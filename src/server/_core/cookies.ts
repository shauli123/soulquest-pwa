// Cookie utility for Next.js (using NextRequest)
import type { NextRequest } from "next/server";

export type CookieOptions = {
  httpOnly: boolean;
  path: string;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
  domain?: string;
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: NextRequest): boolean {
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol || 'http';
  return proto === "https";
}

export function getSessionCookieOptions(req: NextRequest): CookieOptions {
  // Domain logic can be added if needed; for now we leave it undefined.
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
    domain: undefined,
  };
}
