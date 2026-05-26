import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

export function getQueryParam(req: NextRequest, key: string): string | undefined {
  const url = req.nextUrl;
  return url.searchParams.get(key) ?? undefined;
}

export async function GET(req: NextRequest) {
  const code = getQueryParam(req, 'code');
  const state = getQueryParam(req, 'state');

  if (!code || !state) {
    return NextResponse.json({ error: "code and state are required" }, { status: 400 });
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      return NextResponse.json({ error: "openId missing from user info" }, { status: 400 });
    }

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    const response = NextResponse.redirect(new URL('/', req.url));
    const cookieParts = [
      `${COOKIE_NAME}=${sessionToken}`,
      `Path=${cookieOptions.path}`,
      `HttpOnly`,
      cookieOptions.secure ? `Secure` : undefined,
      `SameSite=${cookieOptions.sameSite}`,
    ].filter(Boolean).join("; ");
    response.headers.set('Set-Cookie', cookieParts);
    return response;
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return NextResponse.json({ error: "OAuth callback failed" }, { status: 500 });
  }
}
