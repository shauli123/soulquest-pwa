/**
 * SoulQuest Settings Page
 * Design: Warm Parchment Dojo 8-bit RPG
 */
import { useState } from "react";
import { useGameState, useGameDispatch } from "@/contexts/GameContext";
import { toast } from "sonner";

export default function Settings() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [name, setName] = useState(state.playerName);
  const [showReset, setShowReset] = useState(false);

  function saveName() {
    if (!name.trim()) return;
    dispatch({ type: "SET_PLAYER_NAME", name: name.trim() });
    toast.success("שם הלוחם עודכן! ⚔️");
  }

  function handleReset() {
    localStorage.clear();
    window.location.reload();
  }

  return (
    <div className="flex flex-col p-3 gap-4" style={{ background: "#FDF6E3", minHeight: "100%" }}>
      {/* Header */}
      <div className="pixel-panel-dark px-3 py-2">
        <h1 className="pixel-title text-[0.6rem] text-[#F7DC6F]">⚙️ הגדרות</h1>
      </div>

      {/* Player Name */}
      <div className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
        <div className="pixel-title text-[0.45rem] text-[#4A2E1B] mb-2">👤 שם הלוחם</div>
        <input
          className="pixel-input mb-2"
          value={name}
          onChange={e => setName(e.target.value)}
          dir="rtl"
          maxLength={20}
        />
        <button onClick={saveName} className="pixel-btn pixel-btn-sm w-full">
          💾 שמור שם
        </button>
      </div>

      {/* Stats */}
      <div className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
        <div className="pixel-title text-[0.45rem] text-[#4A2E1B] mb-3">📊 סטטיסטיקות</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "רמה", value: state.level, emoji: "⭐" },
            { label: "XP כולל", value: state.xp, emoji: "✨" },
            { label: "קווסטים הושלמו", value: state.quests.filter(q => q.status === "completed").length, emoji: "✅" },
            { label: "רצף מקסימלי", value: state.streak, emoji: "🔥" },
            { label: "זהב שנצבר", value: state.gold, emoji: "🪙" },
            { label: "מיומנויות שנפתחו", value: state.skillNodes.filter(s => s.unlocked).length, emoji: "🌳" },
          ].map((stat, i) => (
            <div key={i} className="pixel-panel p-2 text-center" style={{ background: "#FDF6E3" }}>
              <div className="text-lg">{stat.emoji}</div>
              <div className="pixel-title text-[0.5rem] text-[#4A2E1B] mt-0.5">{stat.value}</div>
              <div className="hebrew-text text-[0.65rem] text-[#7B4F2E]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
        <div className="pixel-title text-[0.45rem] text-[#4A2E1B] mb-2">ℹ️ אודות SoulQuest</div>
        <div className="hebrew-text text-sm text-[#4A2E1B] leading-relaxed">
          <p>SoulQuest הוא אפליקציית RPG לטיפול עצמי לנוער.</p>
          <p className="mt-1">השלם קווסטים, בנה חוסן נפשי, ולחם במפלצת הנוחות שלך!</p>
          <p className="mt-2 text-[#7B4F2E] text-xs">גרסה 1.0.0 | מופעל ע"י HackClub AI</p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pixel-panel p-3" style={{ background: "#FDF6E3", borderColor: "#C0392B" }}>
        <div className="pixel-title text-[0.45rem] text-[#C0392B] mb-2">⚠️ אזור מסוכן</div>
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="pixel-btn pixel-btn-red pixel-btn-sm w-full"
          >
            🗑️ אפס את כל הנתונים
          </button>
        ) : (
          <div>
            <p className="hebrew-text text-sm text-[#C0392B] mb-2 font-bold">
              האם אתה בטוח? פעולה זו תמחק את כל ההתקדמות שלך!
            </p>
            <div className="flex gap-2">
              <button onClick={handleReset} className="pixel-btn pixel-btn-red pixel-btn-sm flex-1">
                ✅ כן, אפס
              </button>
              <button onClick={() => setShowReset(false)} className="pixel-btn pixel-btn-wood pixel-btn-sm flex-1">
                ❌ ביטול
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-4" />
    </div>
  );
}
