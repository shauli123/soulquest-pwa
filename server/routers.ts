import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // AI Mentor router
  mentor: router({
    chat: publicProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant", "system"]),
              content: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const apiKey = process.env.HACKCLUB_AI_API_KEY;
        if (!apiKey) {
          throw new Error("HackClub AI API key not configured");
        }

        const response = await fetch(
          "https://ai.hackclub.com/proxy/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "google/gemini-3.5-flash",
              messages: input.messages,
              stream: true,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("HackClub API error:", response.status, errorText);
          throw new Error(`HackClub API error: ${response.status}`);
        }

        return response;
      }),
  }),
});

export type AppRouter = typeof appRouter;
