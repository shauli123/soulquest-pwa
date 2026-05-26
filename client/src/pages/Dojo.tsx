/**
 * SoulQuest - Dojo Page
 * Design: Warm Parchment Dojo 8-bit RPG
 * Features: Mental Alchemy, Skill Tree, Gratitude Journal, Co-op Dojo, Avatar Skins
 */
import { useState } from "react";
import { useGameState, useGameDispatch } from "@/contexts/GameContext";
import { analyzeGratitude } from "@/lib/hackclubAI";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type DojoTab = "alchemy" | "skills" | "gratitude" | "coop" | "skins";

const SKILL_TREE_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663697926013/eDd68um6p3eVCiAZdwHFNt/skill-tree-bg-2b5yW2EgJ5EVYaMuxEgMXx.webp";

// ─── Mental Alchemy ───────────────────────────────────────────────────────────

function AlchemyTab() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const activePotions = state.brewedPotions.filter(p => p.expiresAt > Date.now());

  function brewPotion(type: "calm" | "focus") {
    const potion = state.potions.find(p => p.type === type);
    if (!potion) return;
    if (state.gold < potion.cost) {
      toast.error(`אין מספיק זהב! צריך ${potion.cost} 🪙`);
      return;
    }
    dispatch({ type: "BREW_POTION", potionType: type });
    toast.success(`שיקוי ${potion.nameHe} הוכן! 🧪 -${potion.cost} זהב`);
  }

  return (
    <div className="p-3 flex flex-col gap-3">
      <div className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
        <div className="pixel-title text-[0.5rem] text-[#4A2E1B] mb-1">🪙 זהב זמין:</div>
        <div className="pixel-title text-[0.8rem] text-[#D4AC0D]">{state.gold}</div>
      </div>

      {/* Active potions */}
      {activePotions.length > 0 && (
        <div className="pixel-panel p-3" style={{ background: "#27AE6010", borderColor: "#27AE60" }}>
          <div className="pixel-title text-[0.45rem] text-[#27AE60] mb-2">🧪 שיקויים פעילים:</div>
          {activePotions.map((p, i) => {
            const remaining = Math.ceil((p.expiresAt - Date.now()) / 3600000);
            return (
              <div key={i} className="flex justify-between items-center mb-1">
                <span className="hebrew-text text-sm text-[#4A2E1B]">
                  {p.type === "calm" ? "🌿 שיקוי רוגע" : "🔮 שיקוי מיקוד"}
                </span>
                <span className="pixel-title text-[0.35rem] text-[#7B4F2E]">{remaining}ש' נותרות</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Potion recipes */}
      {state.potions.map(potion => {
        const isActive = activePotions.some(p => p.type === potion.type);
        return (
          <div key={potion.id} className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{potion.type === "calm" ? "🌿" : "🔮"}</span>
                  <div className="pixel-title text-[0.5rem] text-[#4A2E1B]">{potion.nameHe}</div>
                </div>
                <div className="hebrew-text text-xs text-[#7B4F2E]">{potion.descriptionHe}</div>
                <div className="pixel-title text-[0.38rem] text-[#7B4F2E] mt-1">
                  ⏱️ {potion.duration} שעות
                </div>
              </div>
              <div className="pixel-title text-[0.5rem] text-[#D4AC0D]">{potion.cost} 🪙</div>
            </div>
            <button
              onClick={() => brewPotion(potion.type)}
              disabled={isActive || state.gold < potion.cost}
              className={`pixel-btn pixel-btn-sm w-full ${isActive ? "opacity-50" : ""}`}
              style={{ background: isActive ? "#7B4F2E" : undefined }}
            >
              {isActive ? "✅ פעיל" : "🧪 רקח שיקוי"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Skill Tree ───────────────────────────────────────────────────────────────

function SkillTreeTab() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const branches = {
    resilience: { label: "חוסן", color: "#27AE60", icon: "🛡️" },
    wisdom: { label: "בינה", color: "#2980B9", icon: "📚" },
    communication: { label: "תקשורת", color: "#D4AC0D", icon: "💬" },
  };

  function canUnlock(nodeId: string) {
    const node = state.skillNodes.find(n => n.id === nodeId);
    if (!node || node.unlocked) return false;
    if (state.skillPoints < node.cost) return false;
    if (!node.requires) return true;
    return node.requires.every(r => state.skillNodes.find(n => n.id === r)?.unlocked);
  }

  function handleUnlock(nodeId: string) {
    if (!canUnlock(nodeId)) {
      const node = state.skillNodes.find(n => n.id === nodeId);
      if (!node) return;
      if (state.skillPoints < node.cost) {
        toast.error(`צריך ${node.cost} נקודות מיומנות!`);
      } else {
        toast.error("פתח קודם את המיומנות הקודמת!");
      }
      return;
    }
    dispatch({ type: "UNLOCK_SKILL", nodeId });
    toast.success("מיומנות נפתחה! ⭐");
  }

  const selected = state.skillNodes.find(n => n.id === selectedNode);

  return (
    <div className="p-3">
      {/* Skill points */}
      <div className="pixel-panel p-2 mb-3 text-center" style={{ background: "#F4EAD4" }}>
        <span className="pixel-title text-[0.5rem] text-[#4A2E1B]">
          ⭐ נקודות מיומנות: {state.skillPoints}
        </span>
      </div>

      {/* Skill tree background preview */}
      <div
        className="pixel-panel mb-3 overflow-hidden"
        style={{
          backgroundImage: `url(${SKILL_TREE_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "120px",
          position: "relative",
        }}
      >
        <div className="absolute inset-0" style={{ background: "rgba(44,26,14,0.6)" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="pixel-title text-[0.55rem] text-[#F7DC6F]">🌳 עץ המיומנויות</span>
        </div>
      </div>

      {/* Branches */}
      {Object.entries(branches).map(([branch, info]) => {
        const nodes = state.skillNodes.filter(n => n.branch === branch as any);
        return (
          <div key={branch} className="pixel-panel p-3 mb-3" style={{ background: "#F4EAD4" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{info.icon}</span>
              <span className="pixel-title text-[0.5rem]" style={{ color: info.color }}>
                ענף {info.label}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {nodes.map((node, i) => {
                const available = canUnlock(node.id);
                return (
                  <div key={node.id} className="flex items-center gap-1">
                    {i > 0 && <div className="w-4 h-0.5" style={{ background: node.unlocked ? info.color : "#7B4F2E" }} />}
                    <button
                      onClick={() => {
                        setSelectedNode(selectedNode === node.id ? null : node.id);
                      }}
                      className={`skill-node ${node.unlocked ? "unlocked" : available ? "available" : ""}`}
                      style={{
                        background: node.unlocked ? info.color : available ? "#F7DC6F" : "#F4EAD4",
                        borderColor: node.unlocked ? info.color : available ? "#D4AC0D" : "#4A2E1B",
                        boxShadow: node.unlocked ? `3px 3px 0 ${info.color}80` : available ? "3px 3px 0 #D4AC0D" : "3px 3px 0 #4A2E1B",
                      }}
                    >
                      <span className="text-lg">{info.icon}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selected node detail */}
      {selected && (
        <div className="pixel-panel p-3 animate-slide-in-up" style={{ background: "#F4EAD4" }}>
          <div className="pixel-title text-[0.5rem] text-[#4A2E1B] mb-1">{selected.nameHe}</div>
          <div className="hebrew-text text-sm text-[#7B4F2E] mb-2">{selected.descriptionHe}</div>
          <div className="flex justify-between items-center">
            <span className="pixel-title text-[0.4rem] text-[#D4AC0D]">עלות: {selected.cost} נקודות</span>
            {!selected.unlocked && (
              <button
                onClick={() => handleUnlock(selected.id)}
                disabled={!canUnlock(selected.id)}
                className="pixel-btn pixel-btn-sm"
                style={{ opacity: canUnlock(selected.id) ? 1 : 0.5 }}
              >
                {canUnlock(selected.id) ? "⭐ פתח" : "🔒 נעול"}
              </button>
            )}
            {selected.unlocked && (
              <span className="pixel-title text-[0.4rem] text-[#27AE60]">✅ פעיל</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Gratitude Journal ────────────────────────────────────────────────────────

function GratitudeTab() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [items, setItems] = useState(["", "", ""]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const todayEntry = state.gratitudeEntries.find(e => e.date === today);

  async function handleSubmit() {
    const filled = items.filter(i => i.trim());
    if (filled.length < 3) {
      toast.error("מלא את 3 הדברים הטובים!");
      return;
    }

    setIsAnalyzing(true);
    try {
      const aiAnalysis = await analyzeGratitude(filled);
      setAnalysis(aiAnalysis);
      dispatch({
        type: "ADD_GRATITUDE",
        entry: {
          date: today,
          items: filled,
          aiAnalysis,
          goldEarned: 15,
        },
      });
      setSubmitted(true);
      toast.success("יומן הכרת טוב נשמר! +15 🪙");
    } catch {
      toast.error("שגיאה בניתוח. נסה שוב.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (todayEntry && !submitted) {
    return (
      <div className="p-3">
        <div className="pixel-panel p-3 mb-3" style={{ background: "#27AE6010", borderColor: "#27AE60" }}>
          <div className="pixel-title text-[0.5rem] text-[#27AE60] mb-2">✅ כבר כתבת היום!</div>
          <div className="hebrew-text text-sm text-[#4A2E1B]">
            {todayEntry.items.map((item, i) => (
              <p key={i} className="mb-1">• {item}</p>
            ))}
          </div>
        </div>
        {todayEntry.aiAnalysis && (
          <div className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
            <div className="pixel-title text-[0.45rem] text-[#4A2E1B] mb-2">🥋 ניתוח המאסטר:</div>
            <div className="prose-dojo text-sm">
              <Streamdown>{todayEntry.aiAnalysis}</Streamdown>
            </div>
          </div>
        )}
        <div className="mt-3 text-center">
          <span className="hebrew-text text-sm text-[#7B4F2E]">חזור מחר לכתוב שוב! 📅</span>
        </div>
      </div>
    );
  }

  if (submitted && analysis) {
    return (
      <div className="p-3 animate-slide-in-up">
        <div className="pixel-panel p-3 mb-3" style={{ background: "#27AE6010", borderColor: "#27AE60" }}>
          <div className="pixel-title text-[0.5rem] text-[#27AE60] mb-1">🎉 נשמר! +15 🪙</div>
        </div>
        <div className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
          <div className="pixel-title text-[0.45rem] text-[#4A2E1B] mb-2">🥋 ניתוח המאסטר:</div>
          <div className="prose-dojo text-sm">
            <Streamdown>{analysis}</Streamdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col gap-3">
      <div className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
        <div className="pixel-title text-[0.5rem] text-[#4A2E1B] mb-1">📖 יומן הכרת הטוב</div>
        <div className="hebrew-text text-sm text-[#7B4F2E]">
          כתוב 3 דברים טובים שקרו לך היום. ה-AI ינתח ויעניק לך זהב!
        </div>
      </div>

      {items.map((item, i) => (
        <div key={i}>
          <label className="pixel-title text-[0.4rem] text-[#4A2E1B] block mb-1">
            {i + 1}. דבר טוב שקרה:
          </label>
          <input
            className="pixel-input"
            placeholder={`דבר טוב מספר ${i + 1}...`}
            value={item}
            onChange={e => {
              const newItems = [...items];
              newItems[i] = e.target.value;
              setItems(newItems);
            }}
            dir="rtl"
          />
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={isAnalyzing}
        className="pixel-btn w-full"
      >
        {isAnalyzing ? "🔄 מנתח..." : "📖 שמור ונתח +15 🪙"}
      </button>

      {/* Past entries */}
      {state.gratitudeEntries.length > 0 && (
        <div className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
          <div className="pixel-title text-[0.45rem] text-[#4A2E1B] mb-2">📚 רשומות קודמות:</div>
          {state.gratitudeEntries.slice(0, 3).map(entry => (
            <div key={entry.id} className="mb-2 pb-2" style={{ borderBottom: "1px solid #4A2E1B" }}>
              <div className="pixel-title text-[0.35rem] text-[#7B4F2E] mb-1">{entry.date}</div>
              {entry.items.map((item, i) => (
                <div key={i} className="hebrew-text text-xs text-[#4A2E1B]">• {item}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Co-op Dojo ───────────────────────────────────────────────────────────────

function CoopTab() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [partnerName, setPartnerName] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [selectedQuestId, setSelectedQuestId] = useState("");

  const activeQuests = state.quests.filter(q => q.status === "active");

  function handleCreateCoop() {
    if (!partnerName.trim() || !selectedQuestId) {
      toast.error("מלא שם שותף וקווסט!");
      return;
    }
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    dispatch({
      type: "ADD_COOP_QUEST",
      coopQuest: {
        questId: selectedQuestId,
        partnerName: partnerName.trim(),
        partnerCode: code,
        status: "active",
      },
    });
    toast.success(`חברותא נוצרה! קוד: ${code} 🤝`);
    setPartnerName("");
    setSelectedQuestId("");
  }

  return (
    <div className="p-3 flex flex-col gap-3">
      <div className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
        <div className="pixel-title text-[0.5rem] text-[#4A2E1B] mb-1">🤝 ללמוד בחברותא</div>
        <div className="hebrew-text text-sm text-[#7B4F2E]">
          שתף קווסט עם חבר. אם אחד מכם לא מבצע — מפלצת הנוחות מתחזקת לשניכם!
        </div>
      </div>

      {/* Create coop */}
      <div className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
        <div className="pixel-title text-[0.45rem] text-[#4A2E1B] mb-2">צור חברותא חדשה:</div>

        <label className="pixel-title text-[0.4rem] text-[#4A2E1B] block mb-1">שם השותף:</label>
        <input
          className="pixel-input mb-2"
          placeholder="שם החבר..."
          value={partnerName}
          onChange={e => setPartnerName(e.target.value)}
          dir="rtl"
        />

        <label className="pixel-title text-[0.4rem] text-[#4A2E1B] block mb-1">בחר קווסט:</label>
        <select
          className="pixel-input mb-3"
          value={selectedQuestId}
          onChange={e => setSelectedQuestId(e.target.value)}
          dir="rtl"
          style={{ background: "#FDF6E3" }}
        >
          <option value="">-- בחר קווסט --</option>
          {activeQuests.map(q => (
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
        </select>

        <button onClick={handleCreateCoop} className="pixel-btn w-full">
          🤝 צור חברותא
        </button>
      </div>

      {/* Active coops */}
      {state.coopQuests.length > 0 && (
        <div className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
          <div className="pixel-title text-[0.45rem] text-[#4A2E1B] mb-2">חברותות פעילות:</div>
          {state.coopQuests.map(coop => {
            const quest = state.quests.find(q => q.id === coop.questId);
            return (
              <div key={coop.id} className="mb-2 p-2" style={{ background: "#FDF6E3", border: "2px solid #4A2E1B" }}>
                <div className="hebrew-text text-sm font-bold text-[#4A2E1B]">
                  🤝 {coop.partnerName}
                </div>
                <div className="hebrew-text text-xs text-[#7B4F2E]">
                  קווסט: {quest?.title || "לא נמצא"}
                </div>
                <div className="pixel-title text-[0.35rem] text-[#D4AC0D]">
                  קוד: {coop.partnerCode}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Avatar Skins ─────────────────────────────────────────────────────────────

function SkinsTab() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const skinTypes = ["hat", "robe", "weapon", "shield", "aura"] as const;
  const typeLabels = { hat: "כובע", robe: "גלימה", weapon: "נשק", shield: "מגן", aura: "הילה" };

  return (
    <div className="p-3 flex flex-col gap-3">
      <div className="pixel-panel p-2 text-center" style={{ background: "#F4EAD4" }}>
        <span className="pixel-title text-[0.45rem] text-[#4A2E1B]">
          רמה {state.level} — פריטים נפתחים ברמות גבוהות יותר
        </span>
      </div>

      {skinTypes.map(type => {
        const skins = state.skins.filter(s => s.type === type);
        if (skins.length === 0) return null;
        return (
          <div key={type} className="pixel-panel p-3" style={{ background: "#F4EAD4" }}>
            <div className="pixel-title text-[0.45rem] text-[#4A2E1B] mb-2">{typeLabels[type]}:</div>
            <div className="flex gap-2 flex-wrap">
              {skins.map(skin => (
                <button
                  key={skin.id}
                  onClick={() => {
                    if (!skin.unlocked) {
                      toast.error(`פתוח ברמה ${skin.requiredLevel}!`);
                      return;
                    }
                    dispatch({ type: "EQUIP_SKIN", skinId: skin.id });
                    toast.success(`${skin.nameHe} מצויד! ✅`);
                  }}
                  className="flex flex-col items-center p-2 transition-all"
                  style={{
                    background: skin.equipped ? "#27AE6020" : skin.unlocked ? "#FDF6E3" : "#2C1A0E20",
                    border: `2px solid ${skin.equipped ? "#27AE60" : skin.unlocked ? "#4A2E1B" : "#7B4F2E"}`,
                    boxShadow: skin.equipped ? "2px 2px 0 #27AE60" : "2px 2px 0 #4A2E1B",
                    opacity: skin.unlocked ? 1 : 0.5,
                    minWidth: "60px",
                  }}
                >
                  <span className="text-2xl">{skin.emoji}</span>
                  <span className="pixel-title text-[0.3rem] text-[#4A2E1B] mt-1 text-center">{skin.nameHe}</span>
                  {!skin.unlocked && (
                    <span className="pixel-title text-[0.3rem] text-[#7B4F2E]">LV{skin.requiredLevel}</span>
                  )}
                  {skin.equipped && (
                    <span className="pixel-title text-[0.3rem] text-[#27AE60]">✅</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dojo Page ───────────────────────────────────────────────────────────

export default function Dojo() {
  const [activeTab, setActiveTab] = useState<DojoTab>("alchemy");

  const tabs: { id: DojoTab; label: string; icon: string }[] = [
    { id: "alchemy", label: "אלכימיה", icon: "🧪" },
    { id: "skills", label: "מיומנויות", icon: "🌳" },
    { id: "gratitude", label: "הכרת טוב", icon: "📖" },
    { id: "coop", label: "חברותא", icon: "🤝" },
    { id: "skins", label: "ציוד", icon: "⚔️" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div
        className="px-3 pt-4 pb-3"
        style={{ background: "#4A2E1B", borderBottom: "3px solid #2C1A0E" }}
      >
        <h1 className="pixel-title text-[0.7rem] text-[#F7DC6F]">🏯 הדוג'ו</h1>
      </div>

      {/* Tab bar */}
      <div
        className="flex overflow-x-auto"
        style={{ background: "#2C1A0E", borderBottom: "3px solid #4A2E1B" }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 flex-shrink-0 transition-all"
            style={{
              background: activeTab === tab.id ? "#4A2E1B" : "transparent",
              borderBottom: activeTab === tab.id ? "3px solid #27AE60" : "3px solid transparent",
            }}
          >
            <span className="text-base">{tab.icon}</span>
            <span
              className="pixel-title text-[0.35rem]"
              style={{ color: activeTab === tab.id ? "#F7DC6F" : "#7B4F2E" }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "alchemy" && <AlchemyTab />}
        {activeTab === "skills" && <SkillTreeTab />}
        {activeTab === "gratitude" && <GratitudeTab />}
        {activeTab === "coop" && <CoopTab />}
        {activeTab === "skins" && <SkinsTab />}
      </div>

      <div className="h-4" />
    </div>
  );
}
