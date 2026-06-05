import { createWriteStream, createReadStream, statSync, mkdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";
import { getServerConfig } from "./config.server";
import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNED_URL_EXPIRY = 3600; // 1 hour

export type Bucket = "covers" | "zips";

function getBucketDir(bucket: Bucket): string {
  const { uploadDir } = getServerConfig();
  const dir = join(uploadDir, bucket);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function uploadFile(
  bucket: Bucket,
  relativePath: string,
  data: Buffer,
  _contentType: string
): Promise<string> {
  const dir = getBucketDir(bucket);
  const fullPath = join(dir, relativePath);

  // Ensure parent directory exists
  const parent = dirname(fullPath);
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }

  // Write file
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(fullPath);
    stream.on("finish", () => resolve(relativePath));
    stream.on("error", reject);
    stream.write(data);
    stream.end();
  });
}

export async function deleteFile(relativePath: string): Promise<void> {
  const { uploadDir } = getServerConfig();
  const fullPath = join(uploadDir, relativePath);

  if (existsSync(fullPath)) {
    unlinkSync(fullPath);
  }
}

export function getFilePath(relativePath: string): string {
  const { uploadDir } = getServerConfig();
  return join(uploadDir, relativePath);
}

export function createSignedUrl(relativePath: string, expiresIn = SIGNED_URL_EXPIRY): string {
  const expiry = Math.floor(Date.now() / 1000) + expiresIn;
  const secret = getServerConfig().jwtSecret;
  const data = `${relativePath}:${expiry}`;
  const signature = createHmac("sha256", secret).update(data).digest("hex");

  return `?path=${encodeURIComponent(relativePath)}&expiry=${expiry}&sig=${signature}`;
}

export function verifySignedUrl(path: string, expiry: string, signature: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (parseInt(expiry, 10) < now) {
    return false; // expired
  }

  const secret = getServerConfig().jwtSecret;
  const data = `${path}:${expiry}`;
  const expectedSig = createHmac("sha256", secret).update(data).digest("hex");

  // Timing-safe comparison
  if (signature.length !== expectedSig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return mismatch === 0;
}

export function fileExists(relativePath: string): boolean {
  const { uploadDir } = getServerConfig();
  const fullPath = join(uploadDir, relativePath);
  return existsSync(fullPath);
}

export function getFileSize(relativePath: string): number | null {
  try {
    const { uploadDir } = getServerConfig();
    const fullPath = join(uploadDir, relativePath);
    const stat = statSync(fullPath);
    return stat.size;
  } catch {
    return null;
  }
}

export function serveStaticFile(relativePath: string): Response | null {
  const { uploadDir } = getServerConfig();
  const fullPath = join(uploadDir, relativePath);

  if (!existsSync(fullPath)) {
    return null;
  }

  const stream = createReadStream(fullPath);
  const { size } = statSync(fullPath);

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Length": String(size),
      "Content-Type": getMimeType(relativePath),
      "Cache-Control": "public, max-age=31536000",
    },
  });
}

function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    zip: "application/zip",
    pdf: "application/pdf",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
  };
  return types[ext] ?? "application/octet-stream";
}