/**
 * SoulQuest - AI Mental Mentor Chat
 * Design: Warm Parchment Dojo 8-bit RPG
 * Uses HackClub AI API directly from client with real streaming + typewriter effect + Markdown rendering
 */
import { useState, useRef, useEffect } from "react";
import { useGameState, useGameDispatch } from "@/contexts/GameContext";
import { Send, Trash2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc"; 

const DOJO_MASTER_AVATAR = "🥋";

const QUICK_PROMPTS = [
  "אני מרגיש לחץ מהלימודים",
  "אני דוחה משימות",
  "אני לא מאמין בעצמי",
  "אני כועס על מישהו",
  "אני מרגיש בודד",
  "עזור לי להתמקד",
];

export default function AIMentor() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const mentorChat = trpc.mentor.chat.useMutation();

  const activeQuestTitles = state.quests
    .filter(q => q.status === "active")
    .map(q => q.title);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.chatHistory, streamingText]);

  async function handleSend(text?: string) {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    setInput("");
    setIsLoading(true);

    // 1. הוספת הודעת המשתמש להיסטוריה המקומית
    dispatch({
      type: "ADD_CHAT_MESSAGE",
      message: { role: "user", content: messageText },
    });

    // 2. בניית היסטוריית השיחה עבור ה-API
    const apiHistory = state.chatHistory.slice(-10).map(m => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    const activeQuestsInfo = state.quests
      .filter(q => q.status === "active")
      .map(q => `- ${q.title} (סוג: ${q.type}, תגמול: ${q.xpReward} XP${q.type === 'study' ? `, יעד: ${q.targetValue} יחידות, התקדמות נוכחית: ${q.currentValue || 0}` : ''}${q.type === 'focus' ? `, משך: ${q.durationMinutes} דקות` : ''}${q.scheduledTime ? `, תזכורת: ${q.scheduledTime}` : ''})`)
      .join("\n");

    const completedQuestsInfo = state.quests
      .filter(q => q.status === "completed")
      .slice(0, 5)
      .map(q => `- ${q.title}`)
      .join("\n");

    const systemPrompt = `You are the Dojo Master, a wise, sharp, and deeply compassionate mentor in a colorful Self-Care RPG Dojo, helping a teenager conquer their challenges. 
You speak fluent Hebrew and respond with warmth, wisdom, and actionable psychological and spiritual guidance but still talk in a simple easy to understand language.

CRITICAL CORE FRAMEWORK (Integrate these 10 concepts naturally based on context):
1. הנפש הבהמית מול הנפש האלוקית: View the user's laziness/procrastination as the "Comfort Monster" (נפש בהמית) and call upon their "Inner Hero" (נפש אלוקית).
2. נקודת הבחירה: Always remind them that every moment of struggle is a conscious choice between giving in or fighting.
3. תמיד יש אפשרות בחירה: Eliminate words like "I can't" or "I must"—reframe everything as an autonomous decision.
4. שיטת SMART: When they talk about goals, gently guide them to be Specific, Measurable, and Time-bound.
5. האנרגיה זורמת לאן שתשומת הלב מופנית: Help them narrow their focus to immediate small actions instead of getting overwhelmed by the future.
6. חוסן נפשי (Resilience): Praise their effort and state that every small victory builds their internal resilience armor.
7. אין כישלון - יש משוב: If they fail a quest or break a streak, forbid self-blame. Treat it as data/feedback to improve tomorrow's strategy.
8. מודל אפר"ת: Whenever they share a crisis, map it internally: Event (אירוע) -> Interpretation (פרשנות) -> Emotion (רגש) -> Reaction (תגובה). Gently challenge their bad 'Interpretation'.
9. עיוותי חשיבה: Actively scan their text for cognitive distortions (e.g., "All-or-nothing", "Overgeneralization", "Emotional reasoning"). If found, name the distortion politely and shatter it.
10. שבירת אמונות מגבילות: Replace harmful core beliefs with empowering, constructive ones.

CONTEXT (PLAYER STATE & QUESTS):
- Player Name: ${state.playerName}
- Level: ${state.level} (XP: ${state.xp}/${state.xpToNextLevel})
- Resilience: ${state.resilience}/100
- Gold: ${state.gold}
- Active Streak: ${state.streak} days
- Active Quests:
${activeQuestsInfo || "אין קווסטים פעילים כרגע"}
- Recently Completed Quests:
${completedQuestsInfo || "טרם הושלמו קווסטים"}

CREATING QUESTS (add_quest tool):
- When creating a study quest (e.g., studying, reading pages, finishing chapters), ALWAYS set type to "study" and provide a numeric targetValue representing the study goal (e.g., 5 pages). This renders an interactive progress slider in their quest list.
- When creating a timer/focus quest (e.g., a focused meditation, silent study block, exercise timer), ALWAYS set type to "focus" and provide a numeric durationMinutes representing the session length (e.g., 25 minutes). This renders an interactive Pomodoro Focus Timer in their quest list.
- For other tasks that just need a simple checkmark to complete, set type to "general".
- Proactively suggest study targets (e.g., 3-5 pages) and timer periods (e.g., 15-30 minutes) to keep quests highly interactive!

RESPONSE STYLING:
- Language: Modern Hebrew, engaging, supportive, and empowering for teenagers.
- Constraints: Keep responses concise (3-4 sentences max) to prevent user fatigue. Use 1-2 retro/dojo emojis max (e.g., ⚔️, 🧠, 📜, 👾). Do not look like a sterile bot; look like a legendary mentor.`;
    try {
      // מפעיל את אנימציית הריבועים המהבהבים של "מקליד..."
      setIsStreaming(true);
      setStreamingText("");

      // פנייה ישירה לראוטר של השרת
      const response = await mentorChat.mutateAsync({
        messages: [
          { role: "system", content: systemPrompt },
          ...apiHistory,
          { role: "user", content: messageText },
        ],
      });

      // קבלת הטקסט המלא שחזר מהשרת
      const fullResponse = response.content || "";

      // טיפול בקריאות לכלים (Tools)
      if (response.tool_calls && response.tool_calls.length > 0) {
        for (const call of response.tool_calls) {
          if (call.function?.name === "add_quest") {
            try {
              const args = typeof call.function.arguments === "string" 
                ? JSON.parse(call.function.arguments) 
                : call.function.arguments;
              
              const getNextDueAt = (time: string): number => {
                const [h, m] = time.split(":").map(Number);
                const now = new Date();
                const due = new Date();
                due.setHours(h, m, 0, 0);
                if (due <= now) due.setDate(due.getDate() + 1);
                return due.getTime();
              };

              dispatch({
                type: "ADD_QUEST",
                quest: {
                  title: args.title,
                  description: args.description,
                  type: args.type,
                  frequency: args.frequency || "once",
                  xpReward: args.xpReward,
                  scheduledTime: args.scheduledTime,
                  targetValue: args.targetValue,
                  durationMinutes: args.durationMinutes,
                  dueAt: args.scheduledTime ? getNextDueAt(args.scheduledTime) : undefined,
                },
              });
              
              toast.success(`קווסט חדש נוסף: ${args.title} ⚔️`, {
                description: "המשך להתאמן ולצבור XP!",
              });
            } catch (e) {
              console.error("Error parsing tool call arguments:", e);
            }
          }
        }
      }

      // מכבה את אנימציית ה"מקליד" ומציג את הבועה
      setIsStreaming(false);

      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: { role: "assistant", content: fullResponse },
      });

      dispatch({ type: "ADD_XP", amount: 5 });

    } catch (error) {
      setIsStreaming(false);
      setStreamingText("");
      toast.error("שגיאה בקבלת תשובה מהמנטור.");
      console.error("tRPC Mentor error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearChat() {
    dispatch({ type: "CLEAR_CHAT" });
    toast.success("שיחה נוקתה 🗑️");
  }

  return (
    <div className="flex flex-col h-full" style={{ height: "calc(100dvh - 64px)" }}>
      {/* Header */}
      <div
        className="px-3 pt-4 pb-3 flex-shrink-0"
        style={{ background: "#4A2E1B", borderBottom: "3px solid #2C1A0E" }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 flex items-center justify-center text-lg"
              style={{ background: "#27AE60", border: "2px solid #1E8449" }}
            >
              {DOJO_MASTER_AVATAR}
            </div>
            <div>
              <div className="pixel-title text-[0.55rem] text-[#F7DC6F]">מאסטר הדוג'ו</div>
              <div className="hebrew-text text-xs text-[#D4AC0D]">
                {isLoading ? "מקליד..." : "מוכן לעזור"}
              </div>
            </div>
          </div>
          <button onClick={clearChat} className="text-[#7B4F2E] p-1">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-3"
        style={{ background: "#FDF6E3" }}
      >
        {/* Welcome message */}
        {state.chatHistory.length === 0 && !isStreaming && (
          <div className="flex gap-2 animate-slide-in-up">
            <div
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-base"
              style={{ background: "#27AE60", border: "2px solid #1E8449" }}
            >
              🥋
            </div>
            <div
              className="flex-1 p-3"
              style={{ background: "#F4EAD4", border: "3px solid #4A2E1B", boxShadow: "3px 3px 0 #4A2E1B" }}
            >
              <div className="prose-dojo">
                <p className="font-bold text-[#4A2E1B] mb-1">שלום, לוחם! 🥋</p>
                <p>אני מאסטר הדוג'ו שלך — כאן לעזור לך להתמודד עם כל אתגר נפשי.</p>
                <p className="mt-1">ספר לי מה עובר עליך, ואני אעזור לך לראות את הדברים בצורה אחרת.</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat history */}
        {state.chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 animate-slide-in-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-base"
              style={{
                background: msg.role === "user" ? "#4A2E1B" : "#27AE60",
                border: `2px solid ${msg.role === "user" ? "#2C1A0E" : "#1E8449"}`,
              }}
            >
              {msg.role === "user" ? "⚔️" : "🥋"}
            </div>

            {/* Message bubble */}
            <div
              className="flex-1 p-3 max-w-[85%] break-words overflow-hidden"
              style={{
                background: msg.role === "user" ? "#4A2E1B" : "#F4EAD4",
                border: `3px solid ${msg.role === "user" ? "#2C1A0E" : "#4A2E1B"}`,
                boxShadow: `3px 3px 0 ${msg.role === "user" ? "#2C1A0E" : "#4A2E1B"}`,
                wordBreak: "break-word",
              }}
            >
              {msg.role === "user" ? (
                <p className="hebrew-text text-sm text-[#FDF6E3]">{msg.content}</p>
              ) : (
                <div className="prose-dojo text-sm">
                  <Streamdown>{msg.content}</Streamdown>
                </div>
              )}
              <div className="mt-1 text-right">
                <span
                  className="pixel-title text-[0.3rem]"
                  style={{ color: "#7B4F2E" }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {isStreaming && (
          <div className="flex gap-2 animate-slide-in-up">
            <div
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-base"
              style={{ background: "#27AE60", border: "2px solid #1E8449" }}
            >
              🥋
            </div>
            <div
              className="flex-1 p-3"
              style={{ background: "#F4EAD4", border: "3px solid #4A2E1B", boxShadow: "3px 3px 0 #4A2E1B" }}
            >
              <div className="prose-dojo text-sm">
                {streamingText ? (
                  <Streamdown>{streamingText}</Streamdown>
                ) : (
                  <div className="flex gap-1 items-center">
                    <span className="pixel-title text-[0.4rem] text-[#4A2E1B]">מקליד</span>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-[#4A2E1B]"
                        style={{ animation: `blink 1s step-end infinite`, animationDelay: `${i * 0.3}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>
              {streamingText && (
                <span className="typewriter-cursor" />
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      {state.chatHistory.length === 0 && (
        <div
          className="px-3 py-2 flex-shrink-0 overflow-x-auto"
          style={{ background: "#F4EAD4", borderTop: "2px solid #4A2E1B" }}
        >
          <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="pixel-title text-[0.38rem] px-2 py-1.5 flex-shrink-0"
                style={{
                  background: "#FDF6E3",
                  border: "2px solid #4A2E1B",
                  boxShadow: "2px 2px 0 #4A2E1B",
                  color: "#4A2E1B",
                  whiteSpace: "nowrap",
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div
        className="flex-shrink-0 p-3 flex gap-2"
        style={{ background: "#F4EAD4", borderTop: "3px solid #4A2E1B" }}
      >
        <textarea
          ref={inputRef}
          className="pixel-input flex-1 resize-none"
          placeholder="שתף אותי במה שאתה מרגיש..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          dir="rtl"
          disabled={isLoading}
          style={{ minHeight: "56px", maxHeight: "120px" }}
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="pixel-btn flex-shrink-0 px-3"
          style={{ alignSelf: "flex-end", opacity: isLoading || !input.trim() ? 0.5 : 1 }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}