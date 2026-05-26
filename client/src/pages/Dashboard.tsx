/**
 * SoulQuest Dashboard Page
 * Design: Warm Parchment Dojo 8-bit RPG
 * Features: Fighter Avatar, XP/Resilience bars, Streak, Daily Quote, Skill Points notification
 */
import { useGameState } from "@/contexts/GameContext";
import { QUOTES } from "@/lib/quotes";
import { Flame, Star, Shield, Zap, Swords, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

const FIGHTER_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663697926013/eDd68um6p3eVCiAZdwHFNt/fighter-samurai-Bz4VfzKDaFuWZKZKH23pRY.webp";
const DOJO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663697926013/eDd68um6p3eVCiAZdwHFNt/hero-dojo-bg-ez3PHWpaWp4BmpeCZzv65s.webp";

export default function Dashboard() {
  const state = useGameState();
  const [quoteIndex, setQuoteIndex] = useState(state.dailyQuoteIndex % QUOTES.length);

  const quote = QUOTES[quoteIndex];
  const xpPercent = Math.min(100, Math.floor((state.xp / state.xpToNextLevel) * 100));
  const resPercent = state.resilience;
  const isHighResilience = state.resilience >= 80;
  const isLowResilience = state.resilience < 30;

  const equippedItems = state.skins.filter(s => s.equipped);
  const hat = equippedItems.find(s => s.type === "hat");
  const weapon = equippedItems.find(s => s.type === "weapon");
  const robe = equippedItems.find(s => s.type === "robe");

  const activeQuests = state.quests.filter(q => q.status === "active").length;
  const completedToday = state.quests.filter(q => {
    if (q.status !== "completed" || !q.completedAt) return false;
    const today = new Date().toISOString().split("T")[0];
    return new Date(q.completedAt).toISOString().split("T")[0] === today;
  }).length;

  const activePotions = state.brewedPotions.filter(p => p.expiresAt > Date.now());

  // Cycle quotes every 8s
  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIndex(i => (i + 1) % QUOTES.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const resLabel =
    resPercent >= 80 ? "⚡ WARRIOR MODE" :
    resPercent >= 50 ? "💪 TRAINING" :
    resPercent >= 30 ? "😤 STRUGGLING" : "😴 REST NEEDED";

  return (
    <div className="flex flex-col" style={{ minHeight: "100%", background: "#FDF6E3" }}>

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: `url(${DOJO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          height: "180px",
        }}
      >
        {/* Gradient fade to cream */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(44,26,14,0.15) 0%, rgba(253,246,227,0) 50%, rgba(253,246,227,1) 100%)"
        }} />

        {/* Top bar */}
        <div className="absolute top-3 right-3 left-3 flex justify-between items-start">
          <div className="pixel-panel-dark px-2 py-1">
            <span className="pixel-title text-[0.45rem] text-[#F7DC6F]">⚔️ SOULQUEST</span>
          </div>
          <div className="flex items-center gap-2">
            {activePotions.length > 0 && (
              <div className="pixel-panel-dark px-2 py-1 flex items-center gap-1">
                <span className="text-xs">{activePotions[0].type === "calm" ? "🌿" : "🔮"}</span>
              </div>
            )}
            <div className="pixel-panel-dark px-2 py-1 flex items-center gap-1">
              <Flame size={10} className="text-orange-400" />
              <span className="pixel-title text-[0.45rem] text-orange-300">{state.streak}</span>
            </div>
          </div>
        </div>

        {/* Dojo sign */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="pixel-panel-dark px-3 py-1">
            <span className="pixel-title text-[0.5rem] text-[#F7DC6F]">道 場</span>
          </div>
        </div>
      </div>

      {/* ── Daily Quote ── */}
      <div className="mx-3 -mt-4 relative z-10">
        <div className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
          <div className="flex items-start gap-2">
            <span className="text-xl flex-shrink-0 mt-0.5">📜</span>
            <div className="flex-1">
              <p className="hebrew-text text-sm font-semibold text-[#4A2E1B] leading-relaxed">
                "{quote.text}"
              </p>
              <p className="hebrew-text text-xs text-[#7B4F2E] mt-1">— {quote.source}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Avatar + Stats ── */}
      <div className="mx-3 mt-3 flex gap-3">

        {/* Fighter Avatar Card */}
        <div className="flex-shrink-0 w-[110px]">
          <div className="pixel-panel p-2 relative flex flex-col items-center" style={{ background: "#F4EAD4" }}>
            {/* Equipped items top row */}
            <div className="flex justify-between w-full mb-1 px-1">
              <span className="text-base leading-none">{hat?.emoji || "🎽"}</span>
              <span className="text-base leading-none">{weapon?.emoji || "🪵"}</span>
            </div>

            {/* Avatar */}
            <div className="relative">
              <img
                src={FIGHTER_IMG}
                alt="Fighter"
                className={`w-[72px] h-[72px] object-contain ${isHighResilience ? "aura-glow" : ""} ${isLowResilience ? "avatar-tired" : ""}`}
                style={{ imageRendering: "pixelated" }}
              />
              {isHighResilience && (
                <div className="absolute inset-0 animate-ping rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(247,220,111,0.25) 0%, transparent 70%)" }}
                />
              )}
              {isLowResilience && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs">😴</div>
              )}
            </div>

            {/* Equipped items bottom row */}
            <div className="flex justify-between w-full mt-1 px-1">
              <span className="text-base leading-none">{robe?.emoji || "🥋"}</span>
              <span className="text-base leading-none">🛡️</span>
            </div>

            {/* Level badge */}
            <div className="absolute -top-2 -left-2 pixel-panel-dark px-1.5 py-0.5">
              <span className="pixel-title text-[0.4rem] text-[#F7DC6F]">LV.{state.level}</span>
            </div>
          </div>

          {/* Player name */}
          <div className="pixel-panel mt-1 px-2 py-1 text-center" style={{ background: "#F4EAD4" }}>
            <span className="hebrew-text text-[0.7rem] font-bold text-[#4A2E1B] truncate block">{state.playerName}</span>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">

          {/* XP Bar */}
          <div className="pixel-panel p-2" style={{ background: "#F4EAD4" }}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1">
                <Star size={9} className="text-[#D4AC0D]" />
                <span className="pixel-title text-[0.4rem] text-[#4A2E1B]">XP</span>
              </div>
              <span className="pixel-title text-[0.35rem] text-[#7B4F2E]">{state.xp}/{state.xpToNextLevel}</span>
            </div>
            <div className="pixel-bar-track">
              <div className="pixel-bar-fill pixel-bar-fill-gold" style={{ width: `${xpPercent}%` }} />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="pixel-title text-[0.3rem] text-[#7B4F2E]">LV {state.level}</span>
              <span className="pixel-title text-[0.3rem] text-[#7B4F2E]">LV {state.level + 1}</span>
            </div>
          </div>

          {/* Resilience Bar */}
          <div className="pixel-panel p-2" style={{ background: "#F4EAD4" }}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1">
                <Shield size={9} className="text-[#27AE60]" />
                <span className="pixel-title text-[0.4rem] text-[#4A2E1B]">חוסן</span>
              </div>
              <span className="pixel-title text-[0.35rem] text-[#7B4F2E]">{state.resilience}%</span>
            </div>
            <div className="pixel-bar-track">
              <div
                className={`pixel-bar-fill ${resPercent < 30 ? "pixel-bar-fill-red" : "pixel-bar-fill"}`}
                style={{ width: `${resPercent}%` }}
              />
            </div>
            <div className="mt-0.5 text-center">
              <span className="pixel-title text-[0.3rem] text-[#7B4F2E]">{resLabel}</span>
            </div>
          </div>

          {/* Gold */}
          <div className="pixel-panel p-2" style={{ background: "#F4EAD4" }}>
            <div className="flex items-center gap-1">
              <Zap size={9} className="text-[#D4AC0D]" />
              <span className="pixel-title text-[0.4rem] text-[#4A2E1B]">זהב: </span>
              <span className="pixel-title text-[0.4rem] text-[#D4AC0D]">{state.gold} 🪙</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Row ── */}
      <div className="mx-3 mt-3 grid grid-cols-3 gap-2">
        <div className="pixel-panel p-2 text-center" style={{ background: "#F4EAD4" }}>
          <div className="text-xl">🔥</div>
          <div className="pixel-title text-[0.5rem] text-[#C0392B] mt-1">{state.streak}</div>
          <div className="hebrew-text text-[0.65rem] text-[#7B4F2E]">רצף</div>
        </div>
        <div className="pixel-panel p-2 text-center" style={{ background: "#F4EAD4" }}>
          <div className="text-xl">⚔️</div>
          <div className="pixel-title text-[0.5rem] text-[#27AE60] mt-1">{activeQuests}</div>
          <div className="hebrew-text text-[0.65rem] text-[#7B4F2E]">קווסטים</div>
        </div>
        <div className="pixel-panel p-2 text-center" style={{ background: "#F4EAD4" }}>
          <div className="text-xl">✅</div>
          <div className="pixel-title text-[0.5rem] text-[#D4AC0D] mt-1">{completedToday}</div>
          <div className="hebrew-text text-[0.65rem] text-[#7B4F2E]">היום</div>
        </div>
      </div>

      {/* ── Active Potions ── */}
      {activePotions.length > 0 && (
        <div className="mx-3 mt-3">
          <div className="pixel-panel p-2" style={{ background: "#F4EAD4" }}>
            <div className="pixel-title text-[0.4rem] text-[#4A2E1B] mb-1.5">🧪 שיקויים פעילים:</div>
            <div className="flex gap-2 flex-wrap">
              {activePotions.map((p, i) => {
                const remaining = Math.max(0, Math.ceil((p.expiresAt - Date.now()) / 3600000));
                return (
                  <div key={i} className="flex items-center gap-1 px-2 py-0.5 border-2 border-[#4A2E1B]"
                    style={{ background: p.type === "calm" ? "#27AE60" : "#8E44AD" }}>
                    <span className="text-sm">{p.type === "calm" ? "🌿" : "🔮"}</span>
                    <span className="pixel-title text-[0.3rem] text-white">
                      {p.type === "calm" ? "רוגע" : "מיקוד"} {remaining}ש
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Skill Points notification ── */}
      {state.skillPoints > 0 && (
        <div className="mx-3 mt-3">
          <div className="pixel-panel p-2" style={{ background: "#F7DC6F20", borderColor: "#D4AC0D" }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <div>
                <div className="pixel-title text-[0.4rem] text-[#4A2E1B]">נקודות מיומנות!</div>
                <div className="hebrew-text text-xs text-[#7B4F2E]">{state.skillPoints} נקודות זמינות</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Today's Active Quests Preview ── */}
      {activeQuests > 0 && (
        <div className="mx-3 mt-3">
          <div className="pixel-title text-[0.4rem] text-[#4A2E1B] mb-1.5 flex items-center gap-1">
            <Swords size={10} /> קווסטים פעילים:
          </div>
          <div className="flex flex-col gap-1.5">
            {state.quests.filter(q => q.status === "active").slice(0, 3).map(q => (
              <div key={q.id} className="pixel-panel p-2 flex items-center gap-2" style={{ background: "#F4EAD4" }}>
                <span className="text-base flex-shrink-0">
                  {q.type === "general" ? "⚔️" : q.type === "study" ? "📚" : "⏱️"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="hebrew-text text-xs font-semibold text-[#4A2E1B] truncate">{q.title}</div>
                  <div className="pixel-title text-[0.3rem] text-[#D4AC0D]">+{q.xpReward} XP</div>
                </div>
              </div>
            ))}
            {activeQuests > 3 && (
              <div className="text-center">
                <span className="pixel-title text-[0.35rem] text-[#7B4F2E]">+{activeQuests - 3} נוספים...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom padding */}
      <div className="h-6" />
    </div>
  );
}
