"use client";

/**
 * SoulQuest - Thought Smasher Mini-Game
 * Design: Warm Parchment Dojo 8-bit RPG
 * Swipe/click to sort helpful vs harmful thoughts
 * AI-generated thoughts via HackClub API
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useGameDispatch } from "@/contexts/GameContext";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Thought {
  text: string;
  isHelpful: boolean;
  distortion?: string;
}

type GamePhase = "menu" | "loading" | "playing" | "result" | "explanation";

const XP_PER_CORRECT = 8;
const XP_COMBO_BONUS = 5;

export default function ThoughtSmasher() {
  const dispatch = useGameDispatch();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [showExplanation, setShowExplanation] = useState<Thought | null>(null);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [comboText, setComboText] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);

  const currentThought = thoughts[currentIndex];
  const generateThoughtsMutation = trpc.mentor.generateThoughts.useMutation();

  const isLastThought = currentIndex >= thoughts.length - 1;

  async function startGame() {
    setPhase("loading");
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setXpEarned(0);
    setTotalCorrect(0);
    setCurrentIndex(0);
    setLastResult(null);

    try {
      const generatedThoughts = await generateThoughtsMutation.mutateAsync();
      // Shuffle
      const shuffled = [...generatedThoughts].sort(() => Math.random() - 0.5);
      setThoughts(shuffled as any);
      setPhase("playing");
    } catch (error) {
      console.error("Game AI error:", error);
      toast.error("שגיאה בטעינת מחשבות. משתמש בברירת מחדל.");
      setPhase("playing");
    }
  }

  function handleAnswer(answeredHelpful: boolean) {
    if (!currentThought || lastResult !== null) return;

    const isCorrect = answeredHelpful === currentThought.isHelpful;
    setSwipeDir(answeredHelpful ? "right" : "left");
    setLastResult(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      const newCombo = combo + 1;
      const newMaxCombo = Math.max(maxCombo, newCombo);
      const xp = XP_PER_CORRECT + (newCombo > 2 ? XP_COMBO_BONUS * Math.floor(newCombo / 2) : 0);
      const newScore = score + 10 + (newCombo > 1 ? newCombo * 5 : 0);

      setCombo(newCombo);
      setMaxCombo(newMaxCombo);
      setXpEarned(prev => prev + xp);
      setScore(newScore);
      setTotalCorrect(prev => prev + 1);

      if (newCombo >= 3) {
        setComboText(`${newCombo}x COMBO! 🔥`);
        setTimeout(() => setComboText(null), 1000);
      }

      // Show explanation for harmful thoughts
      if (!currentThought.isHelpful && currentThought.distortion) {
        setTimeout(() => {
          setShowExplanation(currentThought);
        }, 600);
        return;
      }
    } else {
      setCombo(0);
    }

    setTimeout(() => advanceThought(), 600);
  }

  function advanceThought() {
    setSwipeDir(null);
    setLastResult(null);
    setShowExplanation(null);

    if (isLastThought) {
      finishGame();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }

  function finishGame() {
    dispatch({ type: "UPDATE_THOUGHT_SMASHER", score, xpEarned });
    dispatch({ type: "ADD_XP", amount: xpEarned });
    setPhase("result");
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 60) {
      handleAnswer(diff > 0); // right = helpful, left = harmful
    }
  }

  const accuracy = thoughts.length > 0
    ? Math.round((totalCorrect / Math.min(currentIndex + 1, thoughts.length)) * 100)
    : 0;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div
        className="px-3 pt-4 pb-3 flex-shrink-0"
        style={{ background: "#4A2E1B", borderBottom: "3px solid #2C1A0E" }}
      >
        <h1 className="pixel-title text-[0.65rem] text-[#F7DC6F]">🧠 מנפץ המחשבות</h1>
        <p className="hebrew-text text-xs text-[#D4AC0D] mt-1">מיין מחשבות: מועיל ← ימין | מזיק ← שמאל</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">

        {/* MENU */}
        {phase === "menu" && (
          <div className="flex flex-col items-center gap-4 w-full max-w-[320px] animate-slide-in-up">
            <div className="text-6xl">🧠</div>
            <div className="pixel-panel p-4 w-full text-center" style={{ background: "#F4EAD4" }}>
              <div className="pixel-title text-[0.55rem] text-[#4A2E1B] mb-3">איך לשחק:</div>
              <div className="hebrew-text text-sm text-[#4A2E1B] leading-relaxed">
                <p>• מחשבות יופיעו בכרטיסיות</p>
                <p>• החלק ימינה = מחשבה מועילה ✅</p>
                <p>• החלק שמאלה = מחשבה מזיקה ❌</p>
                <p>• קומבו נכון = בונוס XP! 🔥</p>
              </div>
            </div>
            <button onClick={startGame} className="pixel-btn w-full">
              🎮 התחל משחק
            </button>
          </div>
        )}

        {/* LOADING */}
        {phase === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-4xl animate-spin">🧠</div>
            <div className="pixel-title text-[0.5rem] text-[#4A2E1B]">טוען מחשבות מה-AI...</div>
          </div>
        )}

        {/* PLAYING */}
        {phase === "playing" && currentThought && (
          <div className="w-full max-w-[360px] flex flex-col items-center gap-4">
            {/* Score bar */}
            <div className="flex justify-between w-full">
              <div className="pixel-panel px-2 py-1" style={{ background: "#F4EAD4" }}>
                <span className="pixel-title text-[0.4rem] text-[#D4AC0D]">ניקוד: {score}</span>
              </div>
              <div className="pixel-panel px-2 py-1" style={{ background: "#F4EAD4" }}>
                <span className="pixel-title text-[0.4rem] text-[#27AE60]">
                  {currentIndex + 1}/{thoughts.length}
                </span>
              </div>
              {combo > 1 && (
                <div className="pixel-panel px-2 py-1" style={{ background: "#C0392B", borderColor: "#922B21" }}>
                  <span className="pixel-title text-[0.4rem] text-[#F7DC6F]">🔥 {combo}x</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="pixel-bar-track w-full">
              <div
                className="pixel-bar-fill"
                style={{ width: `${((currentIndex) / thoughts.length) * 100}%` }}
              />
            </div>

            {/* Combo popup */}
            {comboText && (
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 combo-text pixel-title text-[0.7rem] text-[#F7DC6F] z-10"
                style={{ textShadow: "2px 2px 0 #4A2E1B" }}>
                {comboText}
              </div>
            )}

            {/* Thought Card */}
            <div
              ref={cardRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="w-full pixel-panel p-5 text-center cursor-grab active:cursor-grabbing transition-all"
              style={{
                background: lastResult === "correct" ? "#27AE6020" : lastResult === "wrong" ? "#C0392B20" : "#F4EAD4",
                borderColor: lastResult === "correct" ? "#27AE60" : lastResult === "wrong" ? "#C0392B" : "#4A2E1B",
                transform: swipeDir === "right" ? "translateX(30px) rotate(5deg)" : swipeDir === "left" ? "translateX(-30px) rotate(-5deg)" : "none",
                transition: "transform 0.3s ease, border-color 0.2s",
                minHeight: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div>
                <div className="hebrew-text text-lg font-bold text-[#4A2E1B] leading-relaxed">
                  "{currentThought.text}"
                </div>
                {lastResult && (
                  <div className="mt-3 pixel-title text-[0.55rem]" style={{ color: lastResult === "correct" ? "#27AE60" : "#C0392B" }}>
                    {lastResult === "correct" ? "✅ נכון!" : "❌ לא נכון"}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => handleAnswer(false)}
                disabled={lastResult !== null}
                className="flex-1 py-3 flex flex-col items-center gap-1 pixel-btn pixel-btn-red"
                style={{ opacity: lastResult !== null ? 0.5 : 1 }}
              >
                <span className="text-xl">💀</span>
                <span className="pixel-title text-[0.4rem]">מזיק</span>
                <span className="pixel-title text-[0.3rem] opacity-70">← שמאל</span>
              </button>
              <button
                onClick={() => handleAnswer(true)}
                disabled={lastResult !== null}
                className="flex-1 py-3 flex flex-col items-center gap-1 pixel-btn"
                style={{ opacity: lastResult !== null ? 0.5 : 1 }}
              >
                <span className="text-xl">💚</span>
                <span className="pixel-title text-[0.4rem]">מועיל</span>
                <span className="pixel-title text-[0.3rem] opacity-70">ימין →</span>
              </button>
            </div>

            {/* Explanation overlay */}
            {showExplanation && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: "rgba(44,26,14,0.85)" }}
                onClick={() => { setShowExplanation(null); advanceThought(); }}
              >
                <div className="pixel-panel p-4 max-w-[320px] w-full animate-slide-in-up" style={{ background: "#FDF6E3" }}>
                  <div className="pixel-title text-[0.5rem] text-[#C0392B] mb-2">
                    ⚠️ עיוות חשיבה: {showExplanation.distortion}
                  </div>
                  <div className="hebrew-text text-sm text-[#4A2E1B] mb-3 leading-relaxed">
                    המחשבה "{showExplanation.text}" היא דוגמה לעיוות "{showExplanation.distortion}".
                    מחשבות כאלה מגבילות אותנו ולא משקפות את המציאות האמיתית.
                  </div>
                  <div className="pixel-title text-[0.4rem] text-[#27AE60] mb-3">
                    💡 שבירת האמונה המגבילה:
                  </div>
                  <div className="hebrew-text text-sm text-[#4A2E1B] mb-3">
                    נסה לשאול: "האם זה תמיד נכון? האם יש ראיות לסתור?"
                  </div>
                  <button className="pixel-btn w-full" onClick={() => { setShowExplanation(null); advanceThought(); }}>
                    הבנתי! המשך ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESULT */}
        {phase === "result" && (
          <div className="flex flex-col items-center gap-4 w-full max-w-[320px] animate-slide-in-up">
            <div className="text-5xl">
              {accuracy >= 80 ? "🏆" : accuracy >= 60 ? "⚔️" : "💪"}
            </div>
            <div className="pixel-title text-[0.65rem] text-[#4A2E1B] text-center">
              {accuracy >= 80 ? "מדהים!" : accuracy >= 60 ? "כל הכבוד!" : "נסה שוב!"}
            </div>

            <div className="pixel-panel p-4 w-full" style={{ background: "#F4EAD4" }}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "ניקוד", value: score, color: "#D4AC0D" },
                  { label: "דיוק", value: `${accuracy}%`, color: "#27AE60" },
                  { label: "קומבו מקסימלי", value: `${maxCombo}x`, color: "#C0392B" },
                  { label: "XP הרוויח", value: `+${xpEarned}`, color: "#27AE60" },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <div className="pixel-title text-[0.55rem]" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="hebrew-text text-xs text-[#7B4F2E]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <button onClick={startGame} className="pixel-btn flex-1">
                🔄 שחק שוב
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="pixel-btn pixel-btn-wood flex-1"
              >
                🏠 תפריט
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
