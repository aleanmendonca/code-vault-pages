import { SignJWT, jwtVerify } from "jose";

const ALGORITHM = "HS256";

export async function createToken(userId: string, secret: string): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifyToken(token: string, secret: string): Promise<string | null> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey, { algorithms: [ALGORITHM] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}