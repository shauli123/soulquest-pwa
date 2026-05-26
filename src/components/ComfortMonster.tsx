/**
 * SoulQuest - Comfort Monster Screen Blocker
 * Design: Warm Parchment Dojo 8-bit RPG
 * Full-screen red battle overlay with Fight/Yield choice
 */
import { useState, useEffect } from "react";
import { useGameDispatch } from "@/contexts/GameContext";
import { COMFORT_MONSTER_TAUNTS, FIGHT_RESPONSES, YIELD_RESPONSES } from "@/lib/quotes";
import { toast } from "sonner";

const MONSTER_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663697926013/eDd68um6p3eVCiAZdwHFNt/comfort-monster-jeJDZ45zwg83GQJrkNPAnG.webp";

interface ComfortMonsterProps {
  questId?: string;
}

export default function ComfortMonster({ questId }: ComfortMonsterProps) {
  const dispatch = useGameDispatch();
  const [taunt, setTaunt] = useState("");
  const [phase, setPhase] = useState<"intro" | "choice" | "result">("intro");
  const [result, setResult] = useState<"fight" | "yield" | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const randomTaunt = COMFORT_MONSTER_TAUNTS[Math.floor(Math.random() * COMFORT_MONSTER_TAUNTS.length)];
    setTaunt(randomTaunt);

    // Shake on mount
    setShake(true);
    setTimeout(() => setShake(false), 500);

    // Auto-advance to choice after 2 seconds
    const timer = setTimeout(() => setPhase("choice"), 2000);
    return () => clearTimeout(timer);
  }, []);

  function handleFight() {
    setResult("fight");
    setPhase("result");
    const msg = FIGHT_RESPONSES[Math.floor(Math.random() * FIGHT_RESPONSES.length)];
    toast.success(msg);
    setTimeout(() => {
      dispatch({ type: "DISMISS_COMFORT_MONSTER", fought: true });
    }, 2000);
  }

  function handleYield() {
    setResult("yield");
    setPhase("result");
    const msg = YIELD_RESPONSES[Math.floor(Math.random() * YIELD_RESPONSES.length)];
    toast.error(msg);
    setTimeout(() => {
      dispatch({ type: "DISMISS_COMFORT_MONSTER", fought: false });
    }, 2000);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #8B0000 0%, #C0392B 40%, #E74C3C 100%)",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
        }}
      />

      {/* Warning header */}
      <div
        className={`w-full text-center py-3 mb-4 ${shake ? "animate-shake" : ""}`}
        style={{ background: "rgba(0,0,0,0.4)", borderBottom: "3px solid #2C1A0E" }}
      >
        <div className="pixel-title text-[0.6rem] text-[#F7DC6F]">⚠️ מפלצת הנוחות ⚠️</div>
        <div className="pixel-title text-[0.45rem] text-[#FDF6E3] mt-1">COMFORT MONSTER ATTACK!</div>
      </div>

      {/* Monster image */}
      <div className="relative mb-4">
        <img
          src={MONSTER_IMG}
          alt="Comfort Monster"
          className="w-48 h-48 object-contain animate-float"
          style={{ imageRendering: "pixelated", filter: "drop-shadow(0 0 20px rgba(231,76,60,0.8))" }}
        />
        {/* Pixel particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2"
              style={{
                background: "#F7DC6F",
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `blink ${0.5 + Math.random()}s step-end infinite`,
                animationDelay: `${Math.random() * 1}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Taunt dialogue box */}
      <div
        className="mx-4 mb-6 p-3 relative"
        style={{
          background: "#2C1A0E",
          border: "3px solid #F7DC6F",
          boxShadow: "4px 4px 0 #1a0e07",
          maxWidth: "340px",
          width: "100%",
        }}
      >
        <div className="hebrew-text text-sm text-[#FDF6E3] text-center font-bold leading-relaxed">
          {taunt}
        </div>
        {/* Dialogue pointer */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: "12px solid #F7DC6F",
          }}
        />
      </div>

      {/* Choice buttons */}
      {phase === "choice" && (
        <div className="flex flex-col gap-3 w-full px-4 max-w-[340px]">
          {/* Fight button */}
          <button
            onClick={handleFight}
            className="w-full py-4 flex flex-col items-center gap-1 transition-all active:translate-y-1"
            style={{
              background: "#27AE60",
              border: "3px solid #1E8449",
              boxShadow: "0 6px 0 #1E8449, 0 6px 0 1px #4A2E1B",
            }}
          >
            <span className="text-2xl">⚔️</span>
            <span className="pixel-title text-[0.6rem] text-[#FDF6E3]">FIGHT / להתגבר</span>
            <span className="hebrew-text text-xs text-[#FDF6E3] opacity-80">הגיבור הפנימי</span>
          </button>

          {/* Yield button */}
          <button
            onClick={handleYield}
            className="w-full py-3 flex flex-col items-center gap-1 transition-all active:translate-y-1"
            style={{
              background: "#2C1A0E",
              border: "3px solid #1a0e07",
              boxShadow: "0 4px 0 #1a0e07",
            }}
          >
            <span className="text-xl">😴</span>
            <span className="pixel-title text-[0.5rem] text-[#7B4F2E]">YIELD / להיכנע</span>
            <span className="hebrew-text text-xs text-[#7B4F2E] opacity-80">-20 חוסן, -20 XP</span>
          </button>
        </div>
      )}

      {/* Result screen */}
      {phase === "result" && result && (
        <div className="text-center px-4">
          {result === "fight" ? (
            <>
              <div className="text-5xl mb-3 animate-bounce">🌟</div>
              <div className="pixel-title text-[0.65rem] text-[#F7DC6F]">ניצחת!</div>
              <div className="hebrew-text text-sm text-[#FDF6E3] mt-2">הגיבור הפנימי שלך מתעורר!</div>
              <div className="pixel-title text-[0.5rem] text-[#27AE60] mt-2">+15 חוסן</div>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">😔</div>
              <div className="pixel-title text-[0.65rem] text-[#F7DC6F]">הפעם... לא</div>
              <div className="hebrew-text text-sm text-[#FDF6E3] mt-2">מחר תנסה שוב. אתה יכול!</div>
              <div className="pixel-title text-[0.5rem] text-[#C0392B] mt-2">-20 חוסן, -20 XP</div>
            </>
          )}
        </div>
      )}

      {/* Intro phase */}
      {phase === "intro" && (
        <div className="text-center px-4">
          <div className="pixel-title text-[0.5rem] text-[#F7DC6F] animate-pulse">
            ⚠️ נקודת בחירה! ⚠️
          </div>
          <div className="hebrew-text text-sm text-[#FDF6E3] mt-2">
            הנפש הבהמית מול הנפש האלוקית
          </div>
        </div>
      )}
    </div>
  );
}
