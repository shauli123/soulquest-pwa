import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user: User | null;
};

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const cookie = opts.req.headers.get("cookie") ?? undefined;
    user = await sdk.authenticateRequest({ headers: { cookie } });
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    resHeaders: opts.resHeaders,
    user,
  };
}
