import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";

// Helper to call Ollama Cloud API
async function callOllamaCloud(messages: any[], model: string = "gemma4:31b-cloud", format?: any) {
  const baseURL = (process.env.OLLAMA_CLOUD_URL || "https://ollama.com").replace(/\/$/, "");
  const apiKey = process.env.OLLAMA_CLOUD_KEY;

  if (!apiKey) {
    throw new Error("Ollama Cloud API key not configured on server");
  }

  const response = await fetch(`${baseURL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      format, // For structured output if supported
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama Cloud Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.message?.content || "";
}

export const appRouter = router({
  system: systemRouter,

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
        const { messages } = input;

        if (!messages || messages.length === 0) {
          throw new Error("Invalid messages structure: received empty array");
        }

        try {
          const content = await callOllamaCloud(messages);
          return { content };
        } catch (error: any) {
          console.error("Mentor Chat Error:", error);
          throw new Error(`AI Mentor Error: ${error?.message || error}`);
        }
      }),

    generateThoughts: publicProcedure
      .mutation(async () => {
        const prompt = `צור רשימה של בדיוק 10 מחשבות של מתבגר. 5 מחשבות מועילות ו-5 מחשבות מזיקות (עיוותי חשיבה).
החזר JSON בפורמט הבא בלבד:
[
  {"text": "מחשבה כאן", "isHelpful": true},
  {"text": "מחשבה מזיקה כאן", "isHelpful": false, "distortion": "שם העיוות בעברית"},
  ...
]
המחשבות צריכות להיות ספציפיות לחיי מתבגר (לימודים, חברים, משפחה, ביטחון עצמי).`;

        try {
          const content = await callOllamaCloud([
            { role: "system", content: "אתה עוזר ליצור תוכן חינוכי לאפליקציית בריאות נפשית לבני נוער. החזר JSON בלבד." },
            { role: "user", content: prompt }
          ], "gemma4:31b-cloud", "json");

          // Attempt to parse JSON from the response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          // If no array brackets but it is JSON
          return JSON.parse(content);
        } catch (error: any) {
          console.error("Generate Thoughts Error:", error);
          throw new Error("Failed to generate thoughts");
        }
      }),

    analyzeGratitude: publicProcedure
      .input(z.object({ items: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        const prompt = `המשתמש כתב 3 דברים טובים שקרו לו היום:
${input.items.map((item, i) => `${i + 1}. ${item}`).join("\n")}

תן ניתוח רגשי חיובי קצר (2-3 משפטים) שמחזק את ההכרה בטוב ומעודד המשך. השתמש בסגנון חם ומעצים.`;

        try {
          const analysis = await callOllamaCloud([
            { role: "system", content: "אתה מאסטר דוג'ו חכם שמנתח הכרת טוב בעברית. היה קצר, חם ומעצים." },
            { role: "user", content: prompt }
          ]);

          return { analysis };
        } catch (error: any) {
          console.error("Analyze Gratitude Error:", error);
          throw new Error("Failed to analyze gratitude");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;