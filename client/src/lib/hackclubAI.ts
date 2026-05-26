/**
 * SoulQuest - HackClub AI Service
 * Uses OpenAI-compatible protocol at https://ai.hackclub.com/v1/chat/completions
 * Model: gpt-4o-mini
 */

const HACKCLUB_API_KEY = "sk-hc-v1-f22b7dd1dd1841069cd86d5b9c5abf92eae6fcb2e07d437f94ead4b53984ab2e";
const HACKCLUB_API_URL = "https://ai.hackclub.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const DOJO_MASTER_SYSTEM_PROMPT = `אתה מאסטר הדוג'ו של SoulQuest - עוזר מנטלי חכם, חם ומבין ללב, המדבר עברית.

תפקידך:
1. לנתח הודעות המשתמש ולזהות עיוותי חשיבה (הכל-או-כלום, הכללת יתר, חשיבה קטסטרופלית, חשיבה רגשית, פרסונליזציה)
2. להשתמש במודל אפר"ת (אירוע ← פרשנות ← רגש ← תגובה) כדי להציע פרשנויות אלטרנטיביות
3. לדבר בשפה חמה, מעודדת ומכבדת, כמו מאסטר דוג'ו לתלמיד
4. להשתמש ב-Markdown להדגשות, כותרות ורשימות
5. לעודד את המשתמש לבצע קווסטים ולשמור על רצף
6. לשלב חוכמה יהודית רלוונטית כשמתאים
7. לשמור על תשובות ממוקדות, לא ארוכות מדי (3-5 פסקאות מקסימום)

סגנון: חם, ישיר, מעצים. לא מטיף. לא שיפוטי. כמו חבר טוב שמבין.
שפה: עברית בלבד.`;

export async function callHackClubAI(
  messages: AIMessage[],
  onChunk?: (chunk: string) => void
): Promise<string> {
  const response = await fetch(HACKCLUB_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${HACKCLUB_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: !!onChunk,
      max_tokens: 800,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  if (onChunk && response.body) {
    // Streaming
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || "";
          if (content) {
            fullText += content;
            onChunk(content);
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    return fullText;
  } else {
    // Non-streaming
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

export async function getMentorResponse(
  userMessage: string,
  chatHistory: AIMessage[],
  activeQuestTitles: string[],
  onChunk?: (chunk: string) => void
): Promise<string> {
  const questContext = activeQuestTitles.length > 0
    ? `\n\nקווסטים פעילים של המשתמש: ${activeQuestTitles.join(", ")}`
    : "";

  const systemMsg: AIMessage = {
    role: "system",
    content: DOJO_MASTER_SYSTEM_PROMPT + questContext,
  };

  const messages: AIMessage[] = [systemMsg, ...chatHistory, { role: "user", content: userMessage }];
  return callHackClubAI(messages, onChunk);
}

export async function generateThoughts(): Promise<{ text: string; isHelpful: boolean; distortion?: string }[]> {
  const prompt = `צור רשימה של בדיוק 10 מחשבות של מתבגר. 5 מחשבות מועילות ו-5 מחשבות מזיקות (עיוותי חשיבה).
  
החזר JSON בפורמט הבא בלבד (ללא הסבר נוסף):
[
  {"text": "מחשבה כאן", "isHelpful": true},
  {"text": "מחשבה מזיקה כאן", "isHelpful": false, "distortion": "שם העיוות בעברית"},
  ...
]

עיוותי חשיבה אפשריים: הכל-או-כלום, הכללת יתר, קטסטרופיזציה, חשיבה רגשית, פרסונליזציה, פילטר שלילי.
המחשבות צריכות להיות ספציפיות לחיי מתבגר (לימודים, חברים, משפחה, ביטחון עצמי).`;

  const response = await callHackClubAI([
    { role: "system", content: "אתה עוזר ליצור תוכן חינוכי לאפליקציית בריאות נפשית לבני נוער. החזר JSON בלבד." },
    { role: "user", content: prompt },
  ]);

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // fallback
  }

  return FALLBACK_THOUGHTS;
}

export async function analyzeGratitude(items: string[]): Promise<string> {
  const prompt = `המשתמש כתב 3 דברים טובים שקרו לו היום:
${items.map((item, i) => `${i + 1}. ${item}`).join("\n")}

תן ניתוח רגשי חיובי קצר (2-3 משפטים) שמחזק את ההכרה בטוב ומעודד המשך. השתמש בסגנון חם ומעצים.`;

  return callHackClubAI([
    { role: "system", content: "אתה מאסטר דוג'ו חכם שמנתח הכרת טוב בעברית. היה קצר, חם ומעצים." },
    { role: "user", content: prompt },
  ]);
}

const FALLBACK_THOUGHTS = [
  { text: "אני יכול להתמודד עם אתגרים", isHelpful: true },
  { text: "כל טעות היא הזדמנות ללמוד", isHelpful: true },
  { text: "יש לי כוחות שאני עוד לא מכיר", isHelpful: true },
  { text: "אנשים אוהבים אותי כפי שאני", isHelpful: true },
  { text: "אני מסוגל להצליח בלימודים", isHelpful: true },
  { text: "אני תמיד נכשל, אין לי סיכוי", isHelpful: false, distortion: "הכל-או-כלום" },
  { text: "כולם שונאים אותי", isHelpful: false, distortion: "הכללת יתר" },
  { text: "אם נכשלתי פעם אחת, אכשל תמיד", isHelpful: false, distortion: "הכללת יתר" },
  { text: "זה הסוף, הכל יתמוטט", isHelpful: false, distortion: "קטסטרופיזציה" },
  { text: "אני מרגיש טיפש, אז בטח אני טיפש", isHelpful: false, distortion: "חשיבה רגשית" },
];
