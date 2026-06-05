export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [key, ...val] = c.trim().split("=");
        return [key, val.join("=")];
      })
    );
    if (cookies.session_token) {
      return cookies.session_token;
    }
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

export function serializeSessionCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === "production";
  const secure = isProduction ? "; Secure" : "";
  return `session_token=${token}; HttpOnly; Path=/; SameSite=Lax${secure}; Max-Age=604800`;
}

export function clearSessionCookie(): string {
  return "session_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0";
}