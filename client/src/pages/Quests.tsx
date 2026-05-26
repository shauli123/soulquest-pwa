/**
 * SoulQuest - Smart Quest System
 * Design: Warm Parchment Dojo 8-bit RPG
 * Features: General, Study (slider), Focus (timer) quests
 */
import { useState, useEffect, useRef } from "react";
import { useGameState, useGameDispatch, Quest, QuestType, QuestFrequency } from "@/contexts/GameContext";
import { Plus, Trash2, CheckCircle, Clock, BookOpen, Target, Play, Pause, RotateCcw } from "lucide-react";
import { toast } from "sonner";

// ─── Add Quest Modal ──────────────────────────────────────────────────────────

function AddQuestModal({ onClose }: { onClose: () => void }) {
  const dispatch = useGameDispatch();
  const [type, setType] = useState<QuestType>("general");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<QuestFrequency>("once");
  const [targetValue, setTargetValue] = useState(3);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [scheduledTime, setScheduledTime] = useState("");
  const [xpReward, setXpReward] = useState(25);

  const typeXP = { general: 25, study: 40, focus: 50 };

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("יש להזין שם לקווסט");
      return;
    }
    dispatch({
      type: "ADD_QUEST",
      quest: {
        title: title.trim(),
        description: description.trim(),
        type,
        frequency,
        xpReward: typeXP[type],
        targetValue: type === "study" ? targetValue : undefined,
        durationMinutes: type === "focus" ? durationMinutes : undefined,
        scheduledTime: scheduledTime || undefined,
        dueAt: scheduledTime ? getNextDueAt(scheduledTime) : undefined,
      },
    });
    toast.success(`קווסט נוסף! +${typeXP[type]} XP בהשלמה ⚔️`);
    onClose();
  }

  function getNextDueAt(time: string): number {
    const [h, m] = time.split(":").map(Number);
    const now = new Date();
    const due = new Date();
    due.setHours(h, m, 0, 0);
    if (due <= now) due.setDate(due.getDate() + 1);
    return due.getTime();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto" style={{ background: "rgba(44,26,14,0.7)", paddingTop: "16px", paddingBottom: "80px" }}>
      <div className="pixel-panel w-full max-w-[480px] p-4 animate-slide-in-up" style={{ background: "#FDF6E3", flexShrink: 0 }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="pixel-title text-[0.65rem] text-[#4A2E1B]">קווסט חדש ⚔️</h2>
          <button onClick={onClose} className="pixel-title text-[0.6rem] text-[#C0392B]">✕</button>
        </div>

        {/* Quest Type Selector */}
        <div className="mb-3">
          <label className="pixel-title text-[0.45rem] text-[#4A2E1B] block mb-2">סוג קווסט:</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "general", label: "כללי", icon: "⚔️" },
              { value: "study", label: "לימוד", icon: "📚" },
              { value: "focus", label: "פוקוס", icon: "⏱️" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value as QuestType)}
                className={`pixel-panel p-2 text-center transition-all ${type === opt.value ? "border-[#27AE60]" : ""}`}
                style={{
                  background: type === opt.value ? "#27AE6020" : "#F4EAD4",
                  borderColor: type === opt.value ? "#27AE60" : "#4A2E1B",
                }}
              >
                <div className="text-xl mb-1">{opt.icon}</div>
                <div className="pixel-title text-[0.4rem] text-[#4A2E1B]">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="mb-3">
          <label className="pixel-title text-[0.45rem] text-[#4A2E1B] block mb-1">שם הקווסט:</label>
          <input
            className="pixel-input"
            placeholder="למשל: ללמוד 3 דפי גמרא"
            value={title}
            onChange={e => setTitle(e.target.value)}
            dir="rtl"
          />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className="pixel-title text-[0.45rem] text-[#4A2E1B] block mb-1">תיאור (אופציונלי):</label>
          <textarea
            className="pixel-input"
            placeholder="פרטים נוספים..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            dir="rtl"
            style={{ resize: "none" }}
          />
        </div>

        {/* Study-specific: target value */}
        {type === "study" && (
          <div className="mb-3">
            <label className="pixel-title text-[0.45rem] text-[#4A2E1B] block mb-1">
              יעד לימוד: {targetValue} יחידות
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={targetValue}
              onChange={e => setTargetValue(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: "#27AE60" }}
            />
            <div className="flex justify-between">
              <span className="pixel-title text-[0.35rem] text-[#7B4F2E]">1</span>
              <span className="pixel-title text-[0.35rem] text-[#7B4F2E]">20</span>
            </div>
          </div>
        )}

        {/* Focus-specific: duration */}
        {type === "focus" && (
          <div className="mb-3">
            <label className="pixel-title text-[0.45rem] text-[#4A2E1B] block mb-1">
              זמן פוקוס: {durationMinutes} דקות
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[5, 10, 15, 25, 30, 45, 60, 90].map(min => (
                <button
                  key={min}
                  onClick={() => setDurationMinutes(min)}
                  className={`pixel-panel p-1.5 text-center ${durationMinutes === min ? "border-[#27AE60]" : ""}`}
                  style={{
                    background: durationMinutes === min ? "#27AE6020" : "#F4EAD4",
                    borderColor: durationMinutes === min ? "#27AE60" : "#4A2E1B",
                  }}
                >
                  <span className="pixel-title text-[0.4rem] text-[#4A2E1B]">{min}m</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Frequency */}
        <div className="mb-3">
          <label className="pixel-title text-[0.45rem] text-[#4A2E1B] block mb-1">תדירות:</label>
          <div className="grid grid-cols-4 gap-1">
            {[
              { value: "once", label: "פעם" },
              { value: "daily", label: "יומי" },
              { value: "weekly", label: "שבועי" },
              { value: "monthly", label: "חודשי" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFrequency(opt.value as QuestFrequency)}
                className={`pixel-panel p-1.5 text-center ${frequency === opt.value ? "border-[#27AE60]" : ""}`}
                style={{
                  background: frequency === opt.value ? "#27AE6020" : "#F4EAD4",
                  borderColor: frequency === opt.value ? "#27AE60" : "#4A2E1B",
                }}
              >
                <span className="pixel-title text-[0.38rem] text-[#4A2E1B]">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scheduled Time */}
        <div className="mb-4">
          <label className="pixel-title text-[0.45rem] text-[#4A2E1B] block mb-1">שעת תזכורת (אופציונלי):</label>
          <input
            type="time"
            className="pixel-input"
            value={scheduledTime}
            onChange={e => setScheduledTime(e.target.value)}
          />
        </div>

        {/* XP Preview */}
        <div className="pixel-panel p-2 mb-4 text-center" style={{ background: "#F7DC6F20", borderColor: "#D4AC0D" }}>
          <span className="pixel-title text-[0.5rem] text-[#4A2E1B]">
            🌟 תגמול: {typeXP[type]} XP
          </span>
        </div>

        <button onClick={handleSubmit} className="pixel-btn w-full">
          ⚔️ צור קווסט
        </button>
      </div>
    </div>
  );
}

// ─── Focus Timer Component ────────────────────────────────────────────────────

function FocusTimer({ quest, onComplete }: { quest: Quest; onComplete: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState((quest.durationMinutes || 15) * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setDone(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalSeconds = (quest.durationMinutes || 15) * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  function reset() {
    setSecondsLeft((quest.durationMinutes || 15) * 60);
    setRunning(false);
    setDone(false);
  }

  return (
    <div className="pixel-panel p-3 mt-2" style={{ background: "#F4EAD4" }}>
      <div className="pixel-title text-[0.45rem] text-[#4A2E1B] mb-2 text-center">⏱️ CHRONO FOCUS</div>

      {/* Timer display */}
      <div className="text-center mb-3">
        <span className="pixel-title text-[1.5rem] text-[#4A2E1B]">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>

      {/* Progress bar */}
      <div className="pixel-bar-track mb-3">
        <div className="pixel-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {done ? (
        <div className="text-center">
          <div className="pixel-title text-[0.55rem] text-[#27AE60] mb-2">🎉 הצלחת! +{Math.floor((quest.xpReward || 50) * 1.5)} XP BONUS!</div>
          <button onClick={onComplete} className="pixel-btn w-full">
            ✅ השלם קווסט
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setRunning(r => !r)}
            className={`pixel-btn flex-1 ${running ? "pixel-btn-red" : ""}`}
          >
            {running ? <><Pause size={12} /> עצור</> : <><Play size={12} /> התחל</>}
          </button>
          <button onClick={reset} className="pixel-btn pixel-btn-wood px-3">
            <RotateCcw size={12} />
          </button>
        </div>
      )}

      {running && (
        <div className="mt-2 text-center">
          <span className="hebrew-text text-xs text-[#7B4F2E]">🎵 ממוקד... אל תפסיק!</span>
        </div>
      )}
    </div>
  );
}

// ─── Quest Card Component ─────────────────────────────────────────────────────

function QuestCard({ quest }: { quest: Quest }) {
  const dispatch = useGameDispatch();
  const [showTimer, setShowTimer] = useState(false);
  const [studyValue, setStudyValue] = useState(quest.currentValue || 0);

  const isCompleted = quest.status === "completed";
  const isFailed = quest.status === "failed";

  function handleComplete() {
    dispatch({ type: "COMPLETE_QUEST", id: quest.id });
    toast.success(`קווסט הושלם! +${quest.xpReward} XP 🌟`);
  }

  function handleDelete() {
    dispatch({ type: "DELETE_QUEST", id: quest.id });
  }

  function handleStudyUpdate(value: number) {
    setStudyValue(value);
    dispatch({ type: "UPDATE_QUEST", id: quest.id, updates: { currentValue: value } });
    if (value >= (quest.targetValue || 1)) {
      setTimeout(() => {
        dispatch({ type: "COMPLETE_QUEST", id: quest.id });
        toast.success(`קווסט לימוד הושלם! +${quest.xpReward} XP 📚`);
      }, 300);
    }
  }

  const typeIcon = { general: "⚔️", study: "📚", focus: "⏱️" }[quest.type];
  const typeLabel = { general: "כללי", study: "לימוד", focus: "פוקוס" }[quest.type];
  const freqLabel = { once: "פעם אחת", daily: "יומי", weekly: "שבועי", monthly: "חודשי" }[quest.frequency];

  const studyProgress = quest.type === "study"
    ? Math.floor((studyValue / (quest.targetValue || 1)) * 100)
    : 0;

  return (
    <div
      className={`pixel-panel p-3 transition-all ${isCompleted ? "opacity-60" : ""} ${isFailed ? "opacity-40" : ""}`}
      style={{
        background: isCompleted ? "#27AE6010" : isFailed ? "#C0392B10" : "#F4EAD4",
        borderColor: isCompleted ? "#27AE60" : isFailed ? "#C0392B" : "#4A2E1B",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-lg flex-shrink-0">{typeIcon}</span>
          <div className="flex-1">
            <div className="hebrew-text font-bold text-sm text-[#4A2E1B] leading-tight">{quest.title}</div>
            {quest.description && (
              <div className="hebrew-text text-xs text-[#7B4F2E] mt-0.5">{quest.description}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="pixel-title text-[0.35rem] text-[#D4AC0D]">+{quest.xpReward}XP</span>
          {!isCompleted && !isFailed && (
            <button onClick={handleDelete} className="text-[#C0392B] p-0.5">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-1 mb-2 flex-wrap">
        <span className="pixel-title text-[0.35rem] px-1.5 py-0.5 border border-[#4A2E1B] bg-[#FDF6E3] text-[#4A2E1B]">{typeLabel}</span>
        <span className="pixel-title text-[0.35rem] px-1.5 py-0.5 border border-[#4A2E1B] bg-[#FDF6E3] text-[#4A2E1B]">{freqLabel}</span>
        {quest.scheduledTime && (
          <span className="pixel-title text-[0.35rem] px-1.5 py-0.5 border border-[#4A2E1B] bg-[#FDF6E3] text-[#4A2E1B]">
            🕐 {quest.scheduledTime}
          </span>
        )}
      </div>

      {/* Study slider */}
      {quest.type === "study" && !isCompleted && !isFailed && (
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="pixel-title text-[0.4rem] text-[#4A2E1B]">התקדמות</span>
            <span className="pixel-title text-[0.4rem] text-[#27AE60]">{studyValue}/{quest.targetValue}</span>
          </div>
          <input
            type="range"
            min={0}
            max={quest.targetValue || 1}
            step={0.5}
            value={studyValue}
            onChange={e => handleStudyUpdate(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: "#27AE60" }}
          />
          <div className="pixel-bar-track mt-1">
            <div className="pixel-bar-fill" style={{ width: `${studyProgress}%` }} />
          </div>
          <div className="text-center mt-0.5">
            <span className="pixel-title text-[0.35rem] text-[#7B4F2E]">
              {studyProgress}% — +{Math.floor(quest.xpReward * studyProgress / 100)} XP
            </span>
          </div>
        </div>
      )}

      {/* Focus timer toggle */}
      {quest.type === "focus" && !isCompleted && !isFailed && (
        <>
          <button
            onClick={() => setShowTimer(t => !t)}
            className="pixel-btn pixel-btn-sm w-full mb-1"
          >
            <Clock size={10} />
            {showTimer ? "סגור טיימר" : "פתח טיימר פוקוס"}
          </button>
          {showTimer && (
            <FocusTimer
              quest={quest}
              onComplete={handleComplete}
            />
          )}
        </>
      )}

      {/* Complete button */}
      {quest.type === "general" && !isCompleted && !isFailed && (
        <button onClick={handleComplete} className="pixel-btn pixel-btn-sm w-full">
          <CheckCircle size={10} />
          סמן כהושלם
        </button>
      )}

      {isCompleted && (
        <div className="text-center">
          <span className="pixel-title text-[0.45rem] text-[#27AE60]">✅ הושלם!</span>
        </div>
      )}
      {isFailed && (
        <div className="text-center">
          <span className="pixel-title text-[0.45rem] text-[#C0392B]">❌ נכשל</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Quests Page ─────────────────────────────────────────────────────────

export default function Quests() {
  const state = useGameState();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");

  const filteredQuests = state.quests.filter(q => {
    if (filter === "active") return q.status === "active";
    if (filter === "completed") return q.status === "completed";
    return true;
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div
        className="px-3 pt-4 pb-3"
        style={{
          background: "#4A2E1B",
          borderBottom: "3px solid #2C1A0E",
        }}
      >
        <div className="flex justify-between items-center">
          <h1 className="pixel-title text-[0.7rem] text-[#F7DC6F]">⚔️ קווסטים</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="pixel-btn pixel-btn-sm"
          >
            <Plus size={10} />
            חדש
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-3">
          {[
            { value: "active", label: "פעיל" },
            { value: "completed", label: "הושלם" },
            { value: "all", label: "הכל" },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as typeof filter)}
              className="pixel-title text-[0.4rem] px-2 py-1 border-2 transition-all"
              style={{
                background: filter === f.value ? "#27AE60" : "transparent",
                borderColor: filter === f.value ? "#1E8449" : "#7B4F2E",
                color: filter === f.value ? "#FDF6E3" : "#D4AC0D",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quest List */}
      <div className="flex-1 p-3 flex flex-col gap-3">
        {filteredQuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-5xl mb-4">⚔️</div>
            <div className="pixel-title text-[0.55rem] text-[#4A2E1B] text-center mb-2">
              {filter === "active" ? "אין קווסטים פעילים" : "אין קווסטים"}
            </div>
            <div className="hebrew-text text-sm text-[#7B4F2E] text-center mb-4">
              {filter === "active" ? "צור קווסט חדש כדי להתחיל את המסע!" : ""}
            </div>
            {filter === "active" && (
              <button onClick={() => setShowAdd(true)} className="pixel-btn">
                <Plus size={12} />
                צור קווסט ראשון
              </button>
            )}
          </div>
        ) : (
          filteredQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} />
          ))
        )}
      </div>

      {/* Add Quest Modal */}
      {showAdd && <AddQuestModal onClose={() => setShowAdd(false)} />}

      <div className="h-4" />
    </div>
  );
}
