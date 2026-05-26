/**
 * SoulQuest - AI Mental Mentor Chat
 * Design: Warm Parchment Dojo 8-bit RPG
 * Uses HackClub AI API via tRPC backend with streaming + typewriter effect + Markdown rendering
 */
import { useState, useRef, useEffect } from "react";
import { useGameState, useGameDispatch } from "@/contexts/GameContext";
import { Send, Trash2, Bot } from "lucide-react";
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

    // Add user message
    dispatch({
      type: "ADD_CHAT_MESSAGE",
      message: { role: "user", content: messageText },
    });

    // Build history for API
    const apiHistory = state.chatHistory.slice(-10).map(m => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    // Add system prompt
    const systemPrompt = `You are the Dojo Master, a wise and compassionate mentor helping a teen navigate mental health and self-care. 
You speak Hebrew and respond with warmth, wisdom, and practical advice.
The user's active quests are: ${activeQuestTitles.join(", ") || "None yet"}.
Keep responses concise (2-3 sentences max) and supportive. Use emojis sparingly.`;

    try {
      setIsStreaming(true);
      setStreamingText("");
      let fullResponse = "";

      const response = await mentorChat.mutateAsync({
        messages: [
          { role: "system", content: systemPrompt },
          ...apiHistory,
          { role: "user", content: messageText },
        ],
      });

      // Handle streaming response
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;

              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  setStreamingText(fullResponse);
                }
              } catch {
                // Ignore JSON parse errors
              }
            }
          }
        }
      }

      setIsStreaming(false);
      setStreamingText("");

      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: { role: "assistant", content: fullResponse },
      });

      // Small XP reward for using mentor
      dispatch({ type: "ADD_XP", amount: 5 });

    } catch (error) {
      setIsStreaming(false);
      setStreamingText("");
      toast.error("שגיאה בחיבור ל-AI. בדוק את החיבור לאינטרנט.");
      console.error("AI error:", error);
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
        {state.chatHistory.map((msg, i) => (
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
              className="flex-1 p-3 max-w-[85%]"
              style={{
                background: msg.role === "user" ? "#4A2E1B" : "#F4EAD4",
                border: `3px solid ${msg.role === "user" ? "#2C1A0E" : "#4A2E1B"}`,
                boxShadow: `3px 3px 0 ${msg.role === "user" ? "#2C1A0E" : "#4A2E1B"}`,
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
                  style={{ color: msg.role === "user" ? "#7B4F2E" : "#7B4F2E" }}
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
