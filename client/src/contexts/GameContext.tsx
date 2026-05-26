/**
 * SoulQuest GameContext
 * Design: Warm Parchment Dojo 8-bit RPG
 * Manages all game state with localStorage persistence
 */
import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuestType = "general" | "study" | "focus";
export type QuestFrequency = "once" | "daily" | "weekly" | "monthly";
export type QuestStatus = "active" | "completed" | "failed";

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  frequency: QuestFrequency;
  status: QuestStatus;
  xpReward: number;
  targetValue?: number;   // for study quests
  currentValue?: number;  // for study quests
  durationMinutes?: number; // for focus quests
  scheduledTime?: string;   // HH:MM
  createdAt: number;
  completedAt?: number;
  dueAt?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface SkillNode {
  id: string;
  branch: "resilience" | "wisdom" | "communication";
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  cost: number;
  unlocked: boolean;
  requires?: string[];
  effect: string;
}

export interface Potion {
  id: string;
  type: "calm" | "focus";
  nameHe: string;
  name: string;
  description: string;
  descriptionHe: string;
  cost: number;
  duration: number; // hours
  active: boolean;
  expiresAt?: number;
}

export interface GratitudeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  items: string[];
  aiAnalysis?: string;
  goldEarned: number;
  timestamp: number;
}

export interface CoopQuest {
  id: string;
  questId: string;
  partnerName: string;
  partnerCode: string;
  status: "pending" | "active" | "completed" | "failed";
  createdAt: number;
}

export interface SkinItem {
  id: string;
  name: string;
  nameHe: string;
  type: "hat" | "robe" | "weapon" | "shield" | "aura";
  requiredLevel: number;
  unlocked: boolean;
  equipped: boolean;
  emoji: string;
}

export interface GameState {
  // Player stats
  playerName: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  resilience: number;       // 0-100
  streak: number;
  lastActiveDate: string;   // YYYY-MM-DD
  gold: number;
  skillPoints: number;

  // Quests
  quests: Quest[];

  // Chat
  chatHistory: ChatMessage[];

  // Skins / Avatar
  skins: SkinItem[];
  equippedSkins: string[];

  // Skill tree
  skillNodes: SkillNode[];

  // Potions
  potions: Potion[];
  brewedPotions: { type: "calm" | "focus"; expiresAt: number }[];

  // Gratitude journal
  gratitudeEntries: GratitudeEntry[];

  // Co-op
  coopQuests: CoopQuest[];

  // Thought smasher scores
  thoughtSmasherHighScore: number;
  thoughtSmasherTotalXP: number;

  // Comfort monster
  comfortMonsterActive: boolean;
  comfortMonsterQuestId?: string;

  // Settings
  soundEnabled: boolean;
  notificationsEnabled: boolean;

  // Daily quote index
  dailyQuoteIndex: number;
  lastQuoteDate: string;

  // Onboarding
  onboardingComplete: boolean;
}

// ─── Initial Skins ────────────────────────────────────────────────────────────

const INITIAL_SKINS: SkinItem[] = [
  { id: "hat_basic", name: "Training Headband", nameHe: "סרט אימון", type: "hat", requiredLevel: 1, unlocked: true, equipped: true, emoji: "🎽" },
  { id: "hat_ninja", name: "Ninja Mask", nameHe: "מסכת נינג'ה", type: "hat", requiredLevel: 5, unlocked: false, equipped: false, emoji: "🥷" },
  { id: "hat_wizard", name: "Wizard Hat", nameHe: "כובע קוסם", type: "hat", requiredLevel: 10, unlocked: false, equipped: false, emoji: "🧙" },
  { id: "robe_basic", name: "White Gi", nameHe: "גי לבן", type: "robe", requiredLevel: 1, unlocked: true, equipped: true, emoji: "🥋" },
  { id: "robe_golden", name: "Golden Robe", nameHe: "גלימת זהב", type: "robe", requiredLevel: 8, unlocked: false, equipped: false, emoji: "✨" },
  { id: "weapon_bokken", name: "Wooden Bokken", nameHe: "בוקן עץ", type: "weapon", requiredLevel: 1, unlocked: true, equipped: true, emoji: "🪵" },
  { id: "weapon_sword", name: "Light Sword", nameHe: "חרב אור", type: "weapon", requiredLevel: 6, unlocked: false, equipped: false, emoji: "⚔️" },
  { id: "shield_basic", name: "Wooden Shield", nameHe: "מגן עץ", type: "shield", requiredLevel: 3, unlocked: false, equipped: false, emoji: "🛡️" },
  { id: "shield_resilience", name: "Resilience Shield", nameHe: "מגן חוסן", type: "shield", requiredLevel: 12, unlocked: false, equipped: false, emoji: "💎" },
  { id: "aura_glow", name: "Glowing Aura", nameHe: "הילה זוהרת", type: "aura", requiredLevel: 1, unlocked: true, equipped: false, emoji: "🌟" },
];

// ─── Initial Skill Nodes ──────────────────────────────────────────────────────

const INITIAL_SKILL_NODES: SkillNode[] = [
  // Resilience branch
  { id: "res_1", branch: "resilience", name: "Iron Will", nameHe: "רצון ברזל", description: "Reduce Comfort Monster power by 20%", descriptionHe: "מפחית כוח מפלצת נוחות ב-20%", cost: 2, unlocked: false, effect: "comfort_monster_reduction_20" },
  { id: "res_2", branch: "resilience", name: "Quick Recovery", nameHe: "התאוששות מהירה", description: "Recover 10 resilience per completed quest", descriptionHe: "מחזיר 10 חוסן לכל קווסט שהושלם", cost: 3, unlocked: false, requires: ["res_1"], effect: "resilience_recovery_10" },
  { id: "res_3", branch: "resilience", name: "Warrior Spirit", nameHe: "רוח לוחם", description: "Streak bonus XP doubled", descriptionHe: "בונוס XP רצף מוכפל", cost: 4, unlocked: false, requires: ["res_2"], effect: "streak_xp_double" },
  // Wisdom branch
  { id: "wis_1", branch: "wisdom", name: "Scholar's Focus", nameHe: "מיקוד החוקר", description: "Study quest XP +50%", descriptionHe: "XP קווסט לימודי +50%", cost: 2, unlocked: false, effect: "study_xp_boost_50" },
  { id: "wis_2", branch: "wisdom", name: "Deep Learning", nameHe: "למידה עמוקה", description: "Focus timer bonus XP +100%", descriptionHe: "בונוס XP טיימר פוקוס +100%", cost: 3, unlocked: false, requires: ["wis_1"], effect: "focus_xp_double" },
  { id: "wis_3", branch: "wisdom", name: "Master Scholar", nameHe: "חוקר מאסטר", description: "All XP gains +25%", descriptionHe: "כל רווחי XP +25%", cost: 5, unlocked: false, requires: ["wis_2"], effect: "all_xp_boost_25" },
  // Communication branch
  { id: "com_1", branch: "communication", name: "Open Heart", nameHe: "לב פתוח", description: "Unlock new AI conversation styles", descriptionHe: "פותח סגנונות שיחה חדשים עם AI", cost: 2, unlocked: false, effect: "ai_styles_unlock" },
  { id: "com_2", branch: "communication", name: "Empathy Master", nameHe: "מאסטר אמפתיה", description: "Gratitude journal gold +50%", descriptionHe: "זהב יומן הכרת טוב +50%", cost: 3, unlocked: false, requires: ["com_1"], effect: "gratitude_gold_boost" },
  { id: "com_3", branch: "communication", name: "Dojo Champion", nameHe: "אלוף הדוג'ו", description: "Unlock exclusive champion skin", descriptionHe: "פותח סקין אלוף בלעדי", cost: 5, unlocked: false, requires: ["com_2"], effect: "champion_skin_unlock" },
];

// ─── Initial State ────────────────────────────────────────────────────────────

const getInitialState = (): GameState => ({
  playerName: "לוחם",
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  resilience: 70,
  streak: 0,
  lastActiveDate: "",
  gold: 50,
  skillPoints: 0,
  quests: [],
  chatHistory: [],
  skins: INITIAL_SKINS,
  equippedSkins: ["hat_basic", "robe_basic", "weapon_bokken"],
  skillNodes: INITIAL_SKILL_NODES,
  potions: [
    { id: "calm_1", type: "calm", name: "Calm Potion", nameHe: "שיקוי רוגע", description: "Reduces Comfort Monster rate for 24h", descriptionHe: "מוריד קצב מפלצת נוחות ל-24 שעות", cost: 30, duration: 24, active: false },
    { id: "focus_1", type: "focus", name: "Focus Potion", nameHe: "שיקוי מיקוד", description: "Doubles study quest XP for 24h", descriptionHe: "מכפיל XP קווסטי לימוד ל-24 שעות", cost: 40, duration: 24, active: false },
  ],
  brewedPotions: [],
  gratitudeEntries: [],
  coopQuests: [],
  thoughtSmasherHighScore: 0,
  thoughtSmasherTotalXP: 0,
  comfortMonsterActive: false,
  soundEnabled: true,
  notificationsEnabled: false,
  dailyQuoteIndex: 0,
  lastQuoteDate: "",
  onboardingComplete: false,
});

// ─── Actions ──────────────────────────────────────────────────────────────────

export type GameAction =
  | { type: "SET_PLAYER_NAME"; name: string }
  | { type: "ADD_XP"; amount: number }
  | { type: "SET_RESILIENCE"; value: number }
  | { type: "CHANGE_RESILIENCE"; delta: number }
  | { type: "ADD_QUEST"; quest: Omit<Quest, "id" | "createdAt" | "status"> }
  | { type: "UPDATE_QUEST"; id: string; updates: Partial<Quest> }
  | { type: "COMPLETE_QUEST"; id: string }
  | { type: "FAIL_QUEST"; id: string }
  | { type: "DELETE_QUEST"; id: string }
  | { type: "ADD_CHAT_MESSAGE"; message: Omit<ChatMessage, "id" | "timestamp"> }
  | { type: "CLEAR_CHAT" }
  | { type: "EQUIP_SKIN"; skinId: string }
  | { type: "UNLOCK_SKIN"; skinId: string }
  | { type: "UNLOCK_SKILL"; nodeId: string }
  | { type: "BREW_POTION"; potionType: "calm" | "focus" }
  | { type: "ADD_GRATITUDE"; entry: Omit<GratitudeEntry, "id" | "timestamp"> }
  | { type: "ADD_COOP_QUEST"; coopQuest: Omit<CoopQuest, "id" | "createdAt"> }
  | { type: "UPDATE_THOUGHT_SMASHER"; score: number; xpEarned: number }
  | { type: "TRIGGER_COMFORT_MONSTER"; questId?: string }
  | { type: "DISMISS_COMFORT_MONSTER"; fought: boolean }
  | { type: "UPDATE_STREAK" }
  | { type: "UPDATE_DAILY_QUOTE" }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "TOGGLE_SOUND" }
  | { type: "ADD_GOLD"; amount: number }
  | { type: "LOAD_STATE"; state: GameState };

// ─── XP Calculation ───────────────────────────────────────────────────────────

function calcXpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "LOAD_STATE":
      return { ...action.state };

    case "SET_PLAYER_NAME":
      return { ...state, playerName: action.name };

    case "COMPLETE_ONBOARDING":
      return { ...state, onboardingComplete: true };

    case "TOGGLE_SOUND":
      return { ...state, soundEnabled: !state.soundEnabled };

    case "ADD_GOLD":
      return { ...state, gold: state.gold + action.amount };

    case "ADD_XP": {
      let newXP = state.xp + action.amount;
      let newLevel = state.level;
      let newXpToNext = state.xpToNextLevel;
      let newSkillPoints = state.skillPoints;
      while (newXP >= newXpToNext) {
        newXP -= newXpToNext;
        newLevel++;
        newXpToNext = calcXpToNextLevel(newLevel);
        newSkillPoints += 2;
      }
      // Unlock skins by level
      const updatedSkins = state.skins.map(s =>
        !s.unlocked && s.requiredLevel <= newLevel ? { ...s, unlocked: true } : s
      );
      return { ...state, xp: newXP, level: newLevel, xpToNextLevel: newXpToNext, skins: updatedSkins, skillPoints: newSkillPoints };
    }

    case "SET_RESILIENCE":
      return { ...state, resilience: Math.max(0, Math.min(100, action.value)) };

    case "CHANGE_RESILIENCE":
      return { ...state, resilience: Math.max(0, Math.min(100, state.resilience + action.delta)) };

    case "ADD_QUEST": {
      const quest: Quest = {
        ...action.quest,
        id: nanoid(),
        createdAt: Date.now(),
        status: "active",
        currentValue: action.quest.type === "study" ? 0 : undefined,
      };
      return { ...state, quests: [quest, ...state.quests] };
    }

    case "UPDATE_QUEST":
      return {
        ...state,
        quests: state.quests.map(q => q.id === action.id ? { ...q, ...action.updates } : q),
      };

    case "COMPLETE_QUEST": {
      const quest = state.quests.find(q => q.id === action.id);
      if (!quest) return state;
      const xpGain = quest.xpReward;
      let newXP = state.xp + xpGain;
      let newLevel = state.level;
      let newXpToNext = state.xpToNextLevel;
      let newSkillPoints = state.skillPoints;
      while (newXP >= newXpToNext) {
        newXP -= newXpToNext;
        newLevel++;
        newXpToNext = calcXpToNextLevel(newLevel);
        newSkillPoints += 2;
      }
      const updatedSkins = state.skins.map(s =>
        !s.unlocked && s.requiredLevel <= newLevel ? { ...s, unlocked: true } : s
      );
      const updatedQuests = state.quests.map(q =>
        q.id === action.id ? { ...q, status: "completed" as QuestStatus, completedAt: Date.now() } : q
      );
      return {
        ...state,
        quests: updatedQuests,
        xp: newXP,
        level: newLevel,
        xpToNextLevel: newXpToNext,
        skins: updatedSkins,
        skillPoints: newSkillPoints,
        resilience: Math.min(100, state.resilience + 5),
      };
    }

    case "FAIL_QUEST":
      return {
        ...state,
        quests: state.quests.map(q => q.id === action.id ? { ...q, status: "failed" as QuestStatus } : q),
        resilience: Math.max(0, state.resilience - 10),
      };

    case "DELETE_QUEST":
      return { ...state, quests: state.quests.filter(q => q.id !== action.id) };

    case "ADD_CHAT_MESSAGE": {
      const msg: ChatMessage = { ...action.message, id: nanoid(), timestamp: Date.now() };
      const history = [...state.chatHistory, msg].slice(-100); // keep last 100
      return { ...state, chatHistory: history };
    }

    case "CLEAR_CHAT":
      return { ...state, chatHistory: [] };

    case "EQUIP_SKIN": {
      const skin = state.skins.find(s => s.id === action.skinId);
      if (!skin || !skin.unlocked) return state;
      const updatedSkins = state.skins.map(s => {
        if (s.type === skin.type) return { ...s, equipped: s.id === action.skinId };
        return s;
      });
      const equippedSkins = updatedSkins.filter(s => s.equipped).map(s => s.id);
      return { ...state, skins: updatedSkins, equippedSkins };
    }

    case "UNLOCK_SKIN":
      return {
        ...state,
        skins: state.skins.map(s => s.id === action.skinId ? { ...s, unlocked: true } : s),
      };

    case "UNLOCK_SKILL": {
      const node = state.skillNodes.find(n => n.id === action.nodeId);
      if (!node || node.unlocked || state.skillPoints < node.cost) return state;
      const meetsRequirements = !node.requires || node.requires.every(r =>
        state.skillNodes.find(n => n.id === r)?.unlocked
      );
      if (!meetsRequirements) return state;
      return {
        ...state,
        skillNodes: state.skillNodes.map(n => n.id === action.nodeId ? { ...n, unlocked: true } : n),
        skillPoints: state.skillPoints - node.cost,
      };
    }

    case "BREW_POTION": {
      const potion = state.potions.find(p => p.type === action.potionType);
      if (!potion || state.gold < potion.cost) return state;
      const expiresAt = Date.now() + potion.duration * 3600 * 1000;
      const existing = state.brewedPotions.filter(p => p.type !== action.potionType);
      return {
        ...state,
        gold: state.gold - potion.cost,
        brewedPotions: [...existing, { type: action.potionType, expiresAt }],
      };
    }

    case "ADD_GRATITUDE": {
      const entry: GratitudeEntry = { ...action.entry, id: nanoid(), timestamp: Date.now() };
      return {
        ...state,
        gratitudeEntries: [entry, ...state.gratitudeEntries],
        gold: state.gold + entry.goldEarned,
      };
    }

    case "ADD_COOP_QUEST": {
      const coop: CoopQuest = { ...action.coopQuest, id: nanoid(), createdAt: Date.now() };
      return { ...state, coopQuests: [...state.coopQuests, coop] };
    }

    case "UPDATE_THOUGHT_SMASHER": {
      const newXP = state.xp + action.xpEarned;
      return {
        ...state,
        thoughtSmasherHighScore: Math.max(state.thoughtSmasherHighScore, action.score),
        thoughtSmasherTotalXP: state.thoughtSmasherTotalXP + action.xpEarned,
        xp: newXP,
      };
    }

    case "TRIGGER_COMFORT_MONSTER":
      return { ...state, comfortMonsterActive: true, comfortMonsterQuestId: action.questId };

    case "DISMISS_COMFORT_MONSTER": {
      if (action.fought) {
        return { ...state, comfortMonsterActive: false, comfortMonsterQuestId: undefined, resilience: Math.min(100, state.resilience + 15) };
      } else {
        return { ...state, comfortMonsterActive: false, comfortMonsterQuestId: undefined, resilience: Math.max(0, state.resilience - 20), xp: Math.max(0, state.xp - 20) };
      }
    }

    case "UPDATE_STREAK": {
      const today = new Date().toISOString().split("T")[0];
      if (state.lastActiveDate === today) return state;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const newStreak = state.lastActiveDate === yesterday ? state.streak + 1 : 1;
      return { ...state, streak: newStreak, lastActiveDate: today };
    }

    case "UPDATE_DAILY_QUOTE": {
      const today = new Date().toISOString().split("T")[0];
      if (state.lastQuoteDate === today) return state;
      return { ...state, dailyQuoteIndex: Math.floor(Math.random() * 15), lastQuoteDate: today };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

const STORAGE_KEY = "soulquest_v2";

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, getInitialState(), (initial) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GameState;
        // Merge with initial to handle new fields
        return { ...initial, ...parsed };
      }
    } catch {
      // ignore
    }
    return initial;
  });

  // Persist to localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  // Update streak and daily quote on mount
  useEffect(() => {
    dispatch({ type: "UPDATE_STREAK" });
    dispatch({ type: "UPDATE_DAILY_QUOTE" });
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

export function useGameDispatch() {
  return useGame().dispatch;
}

export function useGameState() {
  return useGame().state;
}

// ─── Convenience hooks ────────────────────────────────────────────────────────

export function useAddXP() {
  const dispatch = useGameDispatch();
  return useCallback((amount: number) => dispatch({ type: "ADD_XP", amount }), [dispatch]);
}
