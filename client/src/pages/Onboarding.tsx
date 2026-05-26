/**
 * SoulQuest - Onboarding Screen
 * Design: Warm Parchment Dojo 8-bit RPG
 */
import { useState } from "react";
import { useGameDispatch } from "@/contexts/GameContext";

const DOJO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663697926013/eDd68um6p3eVCiAZdwHFNt/hero-dojo-bg-ez3PHWpaWp4BmpeCZzv65s.webp";
const FIGHTER_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663697926013/eDd68um6p3eVCiAZdwHFNt/fighter-samurai-Bz4VfzKDaFuWZKZKH23pRY.webp";

const SLIDES = [
  {
    title: "ברוך הבא לSoulQuest!",
    subtitle: "משחק RPG לחוסן נפשי",
    content: "כאן תהפוך לגיבור הפנימי שלך — תתמודד עם אתגרי הגיל, תצבור XP ותפתח כוחות חדשים!",
    emoji: "⚔️",
  },
  {
    title: "קווסטים יומיים",
    subtitle: "משימות שמשנות חיים",
    content: "הגדר קווסטים לימודיים, קווסטי פוקוס עם טיימר, ומשימות כלליות. כל הצלחה מעניקה XP!",
    emoji: "📜",
  },
  {
    title: "מאסטר הדוג'ו",
    subtitle: "AI מנטלי חכם",
    content: "שוחח עם מאסטר הדוג'ו — AI שמזהה עיוותי חשיבה ועוזר לך לראות את המציאות בצורה חדשה.",
    emoji: "🥋",
  },
  {
    title: "מפלצת הנוחות",
    subtitle: "הנפש הבהמית",
    content: "כשאתה דוחה משימות, מפלצת הנוחות מופיעה! בחר: להתגבר ולהרוויח חוסן, או להיכנע ולאבד XP.",
    emoji: "👹",
  },
];

export default function Onboarding() {
  const dispatch = useGameDispatch();
  const [slide, setSlide] = useState(0);
  const [name, setName] = useState("");
  const [nameStep, setNameStep] = useState(false);

  function handleNext() {
    if (slide < SLIDES.length - 1) {
      setSlide(s => s + 1);
    } else {
      setNameStep(true);
    }
  }

  function handleStart() {
    if (!name.trim()) return;
    dispatch({ type: "SET_PLAYER_NAME", name: name.trim() });
    dispatch({ type: "COMPLETE_ONBOARDING" });
  }

  const current = SLIDES[slide];

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{
        background: "#FDF6E3",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${DOJO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.15,
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div
          className="text-center py-4 px-3"
          style={{ background: "#4A2E1B", borderBottom: "3px solid #2C1A0E" }}
        >
          <div className="pixel-title text-[0.6rem] text-[#F7DC6F]">⚔️ SOULQUEST</div>
          <div className="hebrew-text text-xs text-[#D4AC0D]">משחק RPG לחוסן נפשי</div>
        </div>

        {!nameStep ? (
          <>
            {/* Slide content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
              {/* Fighter image */}
              <img
                src={FIGHTER_IMG}
                alt="Fighter"
                className="w-32 h-32 object-contain mb-4 animate-float"
                style={{ imageRendering: "pixelated" }}
              />

              {/* Dialogue box */}
              <div className="dialogue-box w-full max-w-[320px] mb-6">
                <div className="text-3xl text-center mb-2">{current.emoji}</div>
                <div className="pixel-title text-[0.55rem] text-[#4A2E1B] text-center mb-2">
                  {current.title}
                </div>
                <div className="pixel-title text-[0.4rem] text-[#27AE60] text-center mb-3">
                  {current.subtitle}
                </div>
                <div className="hebrew-text text-sm text-[#4A2E1B] text-center leading-relaxed">
                  {current.content}
                </div>
              </div>

              {/* Slide dots */}
              <div className="flex gap-2 mb-6">
                {SLIDES.map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3"
                    style={{
                      background: i === slide ? "#27AE60" : "#4A2E1B",
                      border: "2px solid #4A2E1B",
                    }}
                  />
                ))}
              </div>

              <button onClick={handleNext} className="pixel-btn w-full max-w-[280px]">
                {slide < SLIDES.length - 1 ? "הבא ▶" : "אני מוכן! ⚔️"}
              </button>
            </div>
          </>
        ) : (
          /* Name input step */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
            <img
              src={FIGHTER_IMG}
              alt="Fighter"
              className="w-28 h-28 object-contain mb-4"
              style={{ imageRendering: "pixelated" }}
            />

            <div className="dialogue-box w-full max-w-[320px] mb-6">
              <div className="pixel-title text-[0.55rem] text-[#4A2E1B] text-center mb-3">
                מה שמך, לוחם?
              </div>
              <div className="hebrew-text text-sm text-[#7B4F2E] text-center mb-4">
                שמך יופיע על הדמות שלך בדוג'ו
              </div>
              <input
                className="pixel-input text-center"
                placeholder="הכנס שמך כאן..."
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleStart()}
                dir="rtl"
                maxLength={20}
                autoFocus
              />
            </div>

            <button
              onClick={handleStart}
              disabled={!name.trim()}
              className="pixel-btn w-full max-w-[280px]"
              style={{ opacity: name.trim() ? 1 : 0.5 }}
            >
              ⚔️ התחל מסע!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
