"use client";

/**
 * SoulQuest App
 * Design: Warm Parchment Dojo 8-bit RPG
 * Main app shell with bottom navigation and page routing
 */
import { Toaster, toast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";
import { GameProvider, useGameState, useGameDispatch } from "@/contexts/GameContext";
import Dashboard from "@/pages/Dashboard";
import Quests from "@/pages/Quests";
import AIMentor from "@/pages/AIMentor";
import ThoughtSmasher from "@/pages/ThoughtSmasher";
import Dojo from "@/pages/Dojo";
import Settings from "@/pages/Settings";
import Onboarding from "@/pages/Onboarding";
import ComfortMonster from "@/components/ComfortMonster";
import ErrorBoundary from "@/components/ErrorBoundary";

type Page = "dashboard" | "quests" | "mentor" | "smasher" | "dojo" | "settings";
const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: "dashboard", label: "בית", icon: "🏠" },
  { id: "quests", label: "קווסטים", icon: "⚔️" },
  { id: "mentor", label: "מאסטר", icon: "🥋" },
  { id: "smasher", label: "מנפץ", icon: "🧠" },
  { id: "dojo", label: "דוג'ו", icon: "🏯" },
];

function AppShell() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [page, setPage] = useState<Page>("dashboard");
  const monsterChecked = useRef(false);
  const notifiedQuests = useRef<Set<string>>(new Set());

  // Check for overdue quests and trigger comfort monster
  useEffect(() => {
    if (state.comfortMonsterActive || monsterChecked.current) return;
    const now = Date.now();
    const overdueQuest = state.quests.find(q => {
      if (q.status !== "active" || !q.dueAt) return false;
      return now > q.dueAt + 5 * 60 * 1000; // 5 minutes grace
    });
    if (overdueQuest) {
      monsterChecked.current = true;
      dispatch({ type: "TRIGGER_COMFORT_MONSTER", questId: overdueQuest.id });
    }
  }, [state.quests, state.comfortMonsterActive]);

  // Quest Reminders (Notifications)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      
      state.quests.forEach(q => {
        if (q.status === "active" && q.scheduledTime === currentTime && !notifiedQuests.current.has(`${q.id}-${currentTime}`)) {
          toast.info(`תזכורת קווסט: ${q.title} 🕐`, {
            description: "הגיע הזמן לבצע את המשימה שלך!",
            duration: 10000,
          });
          notifiedQuests.current.add(`${q.id}-${currentTime}`);
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [state.quests]);

  if (!state.onboardingComplete) {
    return <Onboarding />;
  }

  // make sure to consider if you need authentication for certain routes
  return (
    <div
      className="flex flex-col"
      style={{
        height: "100dvh",
        background: "#FDF6E3",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Comfort Monster overlay */}
      {state.comfortMonsterActive && (
        <ComfortMonster questId={state.comfortMonsterQuestId} />
      )}

      {/* Page content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "0" }}
      >
        {page === "dashboard" && <Dashboard />}
        {page === "quests" && <Quests />}
        {page === "mentor" && <AIMentor />}
        {page === "smasher" && <ThoughtSmasher />}
        {page === "dojo" && <Dojo />}
        {page === "settings" && <Settings />}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="flex"
        style={{
          background: "#FDF6E3",
          borderTop: "3px solid #4A2E1B",
          boxShadow: "0 -4px 0 #2C1A0E",
          height: "64px",
          flexShrink: 0,
          zIndex: 40,
        }}
      >
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`nav-tab ${page === item.id ? "active" : ""}`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        {/* Settings button */}
        <button
          onClick={() => setPage("settings")}
          className={`nav-tab ${page === "settings" ? "active" : ""}`}
        >
          <span className="text-xl leading-none">⚙️</span>
          <span>הגדרות</span>
        </button>
      </nav>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <TooltipProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#FDF6E3",
                border: "3px solid #4A2E1B",
                boxShadow: "4px 4px 0 #4A2E1B",
                borderRadius: "0",
                fontFamily: "'Heebo', sans-serif",
                color: "#2C1A0E",
                direction: "rtl",
              },
            }}
          />
          <AppShell />
        </TooltipProvider>
      </GameProvider>
    </ErrorBoundary>
  );
}

export default App;
