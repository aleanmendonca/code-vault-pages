import { getSupabaseAdmin } from "./supabase-admin.server";
import { getServerConfig } from "./config.server";

/**
 * Processa um push event do GitHub webhook.
 * Chamado pelo server.ts quando recebe POST /api/github-webhook.
 */
export async function handleGitHubWebhook(request: Request): Promise<Response> {
  const body = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256") ?? "";
  const event = request.headers.get("x-github-event") ?? "";

  // Only handle push events
  if (event !== "push") {
    return json({ ok: true, skipped: "not a push event" });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }

  const repoFullName: string = payload.repository?.full_name ?? "";
  const ref: string = payload.ref ?? "";
  const branch = ref.replace("refs/heads/", "");

  if (!repoFullName) {
    return json({ error: "missing repository info" }, 400);
  }

  const admin = getSupabaseAdmin();

  // Find active subscriptions for this repo
  const { data: subs, error: subErr } = await admin
    .from("webhook_subscriptions")
    .select("*")
    .eq("repo_full_name", repoFullName)
    .eq("is_active", true);

  if (subErr || !subs || subs.length === 0) {
    return json({ ok: true, skipped: "no active subscription" });
  }

  const results: any[] = [];

  for (const sub of subs) {
    // Validate signature
    const isValid = await verifySignature(body, signatureHeader, sub.webhook_secret);
    if (!isValid) {
      results.push({ subscription: sub.id, error: "invalid signature" });
      continue;
    }

    // Check branch match
    if (branch !== sub.branch) {
      results.push({ subscription: sub.id, skipped: `branch mismatch: ${branch} != ${sub.branch}` });
      continue;
    }

    // Get the head commit
    const headCommit = payload.head_commit;
    if (!headCommit) {
      results.push({ subscription: sub.id, skipped: "no head_commit" });
      continue;
    }

    const sha: string = headCommit.id;
    const message: string = headCommit.message ?? "";
    const shortSha = sha.slice(0, 7);

    // Skip if we already processed this commit
    if (sub.last_commit_sha === sha) {
      results.push({ subscription: sub.id, skipped: "already processed" });
      continue;
    }

    try {
      // Download zip from GitHub
      const { githubToken } = getServerConfig();
      const zipUrl = `https://api.github.com/repos/${repoFullName}/zipball/${sha}`;
      const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "CloudCodeVault/1.0",
      };
      if (githubToken) {
        headers.Authorization = `Bearer ${githubToken}`;
      }

      const zipRes = await fetch(zipUrl, { headers });
      if (!zipRes.ok) {
        results.push({ subscription: sub.id, error: `GitHub zip download failed: ${zipRes.status}` });
        continue;
      }

      const zipBuffer = await zipRes.arrayBuffer();
      const zipSize = zipBuffer.byteLength;

      // Upload to Supabase Storage
      const storagePath = `${sub.user_id}/${sub.project_id}/${shortSha}-source.zip`;
      const { error: uploadErr } = await admin.storage
        .from("zips")
        .upload(storagePath, zipBuffer, {
          contentType: "application/zip",
          upsert: true,
        });

      if (uploadErr) {
        results.push({ subscription: sub.id, error: `storage upload: ${uploadErr.message}` });
        continue;
      }

      // Insert version
      const { error: versionErr } = await admin.from("versions").insert({
        project_id: sub.project_id,
        user_id: sub.user_id,
        version: shortSha,
        changelog: message.split("\n")[0].slice(0, 200),
        git_commit: sha,
        zip_path: storagePath,
        zip_size: zipSize,
      });

      if (versionErr) {
        results.push({ subscription: sub.id, error: `version insert: ${versionErr.message}` });
        continue;
      }

      // Update last_commit_sha
      await admin
        .from("webhook_subscriptions")
        .update({ last_commit_sha: sha })
        .eq("id", sub.id);

      results.push({ subscription: sub.id, ok: true, version: shortSha });
    } catch (err: any) {
      results.push({ subscription: sub.id, error: err.message ?? "unknown error" });
    }
  }

  return json({ ok: true, results });
}

/** Verifica HMAC SHA-256 do payload GitHub */
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  if (!signature.startsWith("sha256=")) return false;
  const expected = signature.slice(7);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Timing-safe comparison
  if (expected.length !== computed.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ computed.charCodeAt(i);
  }
  return mismatch === 0;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
