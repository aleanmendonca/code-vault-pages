import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db/client";
import { users, projects, versions, tags, webhookSubscriptions } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/auth/hash";
import { createToken, verifyToken } from "@/auth/jwt";
import { serializeSessionCookie, clearSessionCookie, getSessionToken } from "@/auth/session";
import { requireJwtSecret } from "@/lib/config.server";
import { uploadFile, deleteFile, serveStaticFile, verifySignedUrl } from "@/lib/storage.server";

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function apiRegister(email: string, password: string) {
  if (!email || !password || password.length < 6) {
    throw new Error("Email e senha são obrigatórios (senha mínimo 6 caracteres)");
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    throw new Error("Email já cadastrado");
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, passwordHash }).returning();

  const token = await createToken(user.id, requireJwtSecret());
  return { user: { id: user.id, email: user.email }, token };
}

export async function apiLogin(email: string, password: string) {
  if (!email || !password) {
    throw new Error("Email e senha são obrigatórios");
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    throw new Error("Credenciais inválidas");
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    throw new Error("Credenciais inválidas");
  }

  const token = await createToken(user.id, requireJwtSecret());
  return { user: { id: user.id, email: user.email }, token };
}

export async function apiGetUser(token: string) {
  const userId = await verifyToken(token, requireJwtSecret());
  if (!userId) return null;

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function apiListProjects(userId: string) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));
}

export async function apiGetProject(id: string, userId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project || project.userId !== userId) return null;
  return project;
}

export async function apiCreateProject(data: {
  title: string;
  description?: string;
  type?: string;
  author?: string;
  gitUrl?: string;
  productionUrl?: string;
  coverUrl?: string;
}, userId: string) {
  const [project] = await db.insert(projects).values({
    userId,
    title: data.title,
    description: data.description,
    type: (data.type as any) ?? "pagina",
    author: data.author,
    gitUrl: data.gitUrl,
    productionUrl: data.productionUrl,
    coverUrl: data.coverUrl,
  }).returning();
  return project;
}

export async function apiUpdateProject(id: string, data: {
  title?: string;
  description?: string;
  type?: string;
  author?: string;
  gitUrl?: string;
  productionUrl?: string;
  coverUrl?: string;
}, userId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project || project.userId !== userId) {
    throw new Error("Projeto não encontrado");
  }

  const [updated] = await db.update(projects).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(projects.id, id)).returning();
  return updated;
}

export async function apiDeleteProject(id: string, userId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project || project.userId !== userId) {
    throw new Error("Projeto não encontrado");
  }

  await db.delete(projects).where(eq(projects.id, id));
  return { ok: true };
}

// ─── Versions ─────────────────────────────────────────────────────────────────

export async function apiListVersions(projectId: string, userId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project || project.userId !== userId) {
    throw new Error("Projeto não encontrado");
  }

  return db.select().from(versions).where(eq(versions.projectId, projectId)).orderBy(desc(versions.createdAt));
}

export async function apiCreateVersion(data: {
  projectId: string;
  version: string;
  changelog?: string;
  gitCommit?: string;
  zipBuffer: ArrayBuffer;
  fileName: string;
}, userId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, data.projectId)).limit(1);
  if (!project || project.userId !== userId) {
    throw new Error("Projeto não encontrado");
  }

  const storagePath = `${userId}/${data.projectId}/${data.version}-${crypto.randomUUID()}.zip`;
  await uploadFile("zips", storagePath, Buffer.from(data.zipBuffer), "application/zip");

  const [record] = await db.insert(versions).values({
    projectId: data.projectId,
    userId,
    version: data.version,
    changelog: data.changelog,
    gitCommit: data.gitCommit,
    zipPath: storagePath,
    zipSize: data.zipBuffer.byteLength,
  }).returning();

  return record;
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function apiListTags(userId: string) {
  return db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(tags.name);
}

export async function apiUpsertTags(tagNames: string[], userId: string) {
  const created: { id: string; name: string }[] = [];
  for (const name of tagNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;

    const [tag] = await db.insert(tags).values({ userId, name: trimmed }).onConflictDoNothing().returning();
    if (tag) created.push(tag);
  }
  return created;
}

// ─── Webhook Subscriptions ─────────────────────────────────────────────────────

export async function apiGetWebhookSubscription(projectId: string, userId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project || project.userId !== userId) {
    throw new Error("Projeto não encontrado");
  }

  const [sub] = await db
    .select()
    .from(webhookSubscriptions)
    .where(eq(webhookSubscriptions.projectId, projectId))
    .limit(1);

  return sub ?? null;
}

export async function apiCreateWebhookSubscription(data: {
  projectId: string;
  repoFullName: string;
  branch?: string;
}, userId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, data.projectId)).limit(1);
  if (!project || project.userId !== userId) {
    throw new Error("Projeto não encontrado");
  }

  const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const [sub] = await db.insert(webhookSubscriptions).values({
    projectId: data.projectId,
    userId,
    repoFullName: data.repoFullName,
    webhookSecret: secret,
    branch: data.branch ?? "main",
    isActive: true,
  }).returning();

  return sub;
}

export async function apiToggleWebhookSubscription(id: string, isActive: boolean, userId: string) {
  const [sub] = await db.select().from(webhookSubscriptions).where(eq(webhookSubscriptions.id, id)).limit(1);
  if (!sub || sub.userId !== userId) {
    throw new Error("Subscription não encontrada");
  }

  const [updated] = await db.update(webhookSubscriptions).set({ isActive }).where(eq(webhookSubscriptions.id, id)).returning();
  return updated;
}

// ─── GitHub Webhook ───────────────────────────────────────────────────────────

export async function apiHandleGitHubWebhook(payload: {
  repository: { full_name: string };
  ref: string;
  head_commit?: { id: string; message: string };
}) {
  const repoFullName: string = payload.repository?.full_name ?? "";
  const branch = (payload.ref ?? "").replace("refs/heads/", "");

  if (!repoFullName) return { ok: false, error: "missing repository" };

  const subs = await db
    .select()
    .from(webhookSubscriptions)
    .where(and(
      eq(webhookSubscriptions.repoFullName, repoFullName),
      eq(webhookSubscriptions.isActive, true)
    ));

  if (subs.length === 0) return { ok: true, skipped: "no active subscription" };

  const results: any[] = [];
  for (const sub of subs) {
    if (branch !== sub.branch) {
      results.push({ id: sub.id, skipped: "branch mismatch" });
      continue;
    }

    const headCommit = payload.head_commit;
    if (!headCommit) {
      results.push({ id: sub.id, skipped: "no head_commit" });
      continue;
    }

    const sha = headCommit.id;
    const shortSha = sha.slice(0, 7);

    if (sub.lastCommitSha === sha) {
      results.push({ id: sub.id, skipped: "already processed" });
      continue;
    }

    try {
      // Download zip from GitHub
      const { githubToken } = (await import("@/lib/config.server")).getServerConfig();
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
        results.push({ id: sub.id, error: `GitHub zip download failed: ${zipRes.status}` });
        continue;
      }

      const zipBuffer = await zipRes.arrayBuffer();
      const storagePath = `${sub.userId}/${sub.projectId}/${shortSha}-source.zip`;
      await uploadFile("zips", storagePath, Buffer.from(zipBuffer), "application/zip");

      await db.insert(versions).values({
        projectId: sub.projectId,
        userId: sub.userId,
        version: shortSha,
        changelog: (headCommit.message ?? "").split("\n")[0].slice(0, 200),
        gitCommit: sha,
        zipPath: storagePath,
        zipSize: zipBuffer.byteLength,
      });

      await db.update(webhookSubscriptions).set({ lastCommitSha: sha }).where(eq(webhookSubscriptions.id, sub.id));

      results.push({ id: sub.id, ok: true, version: shortSha });
    } catch (err: any) {
      results.push({ id: sub.id, error: err.message });
    }
  }

  return { ok: true, results };
}

// ─── Request Handler ───────────────────────────────────────────────────────────

export async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Auth routes
  if (pathname === "/api/auth/register" && request.method === "POST") {
    return handleAuthRegister(request);
  }
  if (pathname === "/api/auth/login" && request.method === "POST") {
    return handleAuthLogin(request);
  }
  if (pathname === "/api/auth/logout" && request.method === "POST") {
    return handleAuthLogout();
  }
  if (pathname === "/api/auth/me" && request.method === "GET") {
    return handleAuthMe(request);
  }

  // Check auth for protected routes
  const token = getSessionToken(request);
  const userId = token ? await verifyToken(token, requireJwtSecret()) : null;

  if (!userId) {
    // Allow webhook without auth
    if (pathname !== "/api/webhook") {
      return json({ error: "Unauthorized" }, 401);
    }
  }

  // Projects
  if (pathname === "/api/projects" && request.method === "GET") {
    return json(await apiListProjects(userId!));
  }
  if (pathname === "/api/projects" && request.method === "POST") {
    return handleCreateProject(request, userId!);
  }
  if (pathname.match(/^\/api\/projects\/[^/]+\/versions$/)) {
    const projectId = pathname.split("/")[3];
    return request.method === "GET"
      ? json(await apiListVersions(projectId, userId!))
      : handleCreateVersion(request, projectId, userId!);
  }
  if (pathname.match(/^\/api\/projects\/[^/]+$/)) {
    const id = pathname.split("/")[3];
    return handleProjectById(request, id, userId!);
  }

  // Tags
  if (pathname === "/api/tags" && request.method === "GET") {
    return json(await apiListTags(userId!));
  }

  // Webhook subscriptions
  if (pathname.match(/^\/api\/webhook-subscriptions\/[^/]+$/)) {
    const projectId = pathname.split("/")[3];
    if (request.method === "GET") {
      return json(await apiGetWebhookSubscription(projectId, userId!));
    }
    if (request.method === "PUT") {
      return handleToggleWebhook(request, projectId, userId!);
    }
  }
  if (pathname === "/api/webhook-subscriptions" && request.method === "POST") {
    return handleCreateWebhook(request, userId!);
  }

  // GitHub webhook
  if (pathname === "/api/webhook" && request.method === "POST") {
    return handleGitHubWebhook(request);
  }

  // Static files
  if (pathname.startsWith("/uploads/")) {
    return serveStaticFile(pathname.slice(1)) ?? json({ error: "Not found" }, 404);
  }

  // Signed download
  if (pathname === "/api/download") {
    return handleSignedDownload(request);
  }

  return null;
}

// ─── Route Handlers ────────────────────────────────────────────────────────────

async function handleAuthRegister(request: Request): Promise<Response> {
  try {
    const { email, password } = await request.json();
    const { user, token } = await apiRegister(email, password);
    const headers = new Headers();
    headers.append("Set-Cookie", serializeSessionCookie(token));
    return json({ user }, 201, headers);
  } catch (err: any) {
    return json({ error: err.message }, 400);
  }
}

async function handleAuthLogin(request: Request): Promise<Response> {
  try {
    const { email, password } = await request.json();
    const { user, token } = await apiLogin(email, password);
    const headers = new Headers();
    headers.append("Set-Cookie", serializeSessionCookie(token));
    return json({ user }, 200, headers);
  } catch (err: any) {
    return json({ error: err.message }, 401);
  }
}

function handleAuthLogout(): Response {
  const headers = new Headers();
  headers.append("Set-Cookie", clearSessionCookie());
  return json({ ok: true }, 200, headers);
}

async function handleAuthMe(request: Request): Promise<Response> {
  const token = getSessionToken(request);
  if (!token) return json({ error: "Unauthorized" }, 401);
  const user = await apiGetUser(token);
  if (!user) return json({ error: "Unauthorized" }, 401);
  return json({ user });
}

async function handleCreateProject(request: Request, userId: string): Promise<Response> {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let data: any;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      data = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        type: formData.get("type") as string,
        author: formData.get("author") as string,
        gitUrl: formData.get("gitUrl") as string,
        productionUrl: formData.get("productionUrl") as string,
      };

      // Handle cover upload
      const coverFile = formData.get("cover") as File | null;
      if (coverFile && coverFile.size > 0) {
        const ext = coverFile.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const buffer = Buffer.from(await coverFile.arrayBuffer());
        await uploadFile("covers", path, buffer, coverFile.type);
        data.coverUrl = `/uploads/covers/${path}`;
      }
    } else {
      data = await request.json();
    }

    const project = await apiCreateProject(data, userId);
    return json(project, 201);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
}

async function handleProjectById(request: Request, id: string, userId: string): Promise<Response> {
  try {
    if (request.method === "GET") {
      const project = await apiGetProject(id, userId);
      return project ? json(project) : json({ error: "Not found" }, 404);
    }
    if (request.method === "PUT") {
      const data = await request.json();
      const project = await apiUpdateProject(id, data, userId);
      return json(project);
    }
    if (request.method === "DELETE") {
      await apiDeleteProject(id, userId);
      return json({ ok: true });
    }
    return json({ error: "Method not allowed" }, 405);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
}

async function handleCreateVersion(request: Request, projectId: string, userId: string): Promise<Response> {
  try {
    const formData = await request.formData();
    const zipFile = formData.get("zip") as File | null;

    if (!zipFile) {
      return json({ error: "Arquivo zip é obrigatório" }, 400);
    }

    const record = await apiCreateVersion({
      projectId,
      version: (formData.get("version") as string) ?? "v1.0.0",
      changelog: formData.get("changelog") as string,
      gitCommit: formData.get("gitCommit") as string,
      zipBuffer: await zipFile.arrayBuffer(),
      fileName: zipFile.name,
    }, userId);

    return json(record, 201);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
}

async function handleCreateWebhook(request: Request, userId: string): Promise<Response> {
  try {
    const data = await request.json();
    const sub = await apiCreateWebhookSubscription(data, userId);
    return json(sub, 201);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
}

async function handleToggleWebhook(request: Request, projectId: string, userId: string): Promise<Response> {
  try {
    const data = await request.json();
    const sub = await apiGetWebhookSubscription(projectId, userId);
    if (!sub) return json({ error: "Not found" }, 404);
    const updated = await apiToggleWebhookSubscription(sub.id, data.isActive, userId);
    return json(updated);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
}

async function handleGitHubWebhook(request: Request): Promise<Response> {
  try {
    const body = await request.text();
    const event = request.headers.get("x-github-event");
    if (event !== "push") {
      return json({ ok: true, skipped: "not a push event" });
    }
    const payload = JSON.parse(body);
    const result = await apiHandleGitHubWebhook(payload);
    return json(result);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
}

async function handleSignedDownload(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  const expiry = url.searchParams.get("expiry");
  const sig = url.searchParams.get("sig");

  if (!path || !expiry || !sig) {
    return json({ error: "Missing parameters" }, 400);
  }

  if (!verifySignedUrl(path, expiry, sig)) {
    return json({ error: "Invalid or expired signature" }, 403);
  }

  return serveStaticFile(path) ?? json({ error: "Not found" }, 404);
}

// ─── Helper ────────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200, extraHeaders?: Headers): Response {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (extraHeaders) {
    for (const [k, v] of extraHeaders.entries()) {
      headers[k] = v;
    }
  }
  return new Response(JSON.stringify(data), { status, headers });
}