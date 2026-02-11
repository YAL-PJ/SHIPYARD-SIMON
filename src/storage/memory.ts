import AsyncStorage from "@react-native-async-storage/async-storage";

import { SessionOutcomeCard } from "../types/progress";

const MEMORY_ENABLED_KEY = "shipyard.memory.enabled";
const MEMORY_ITEMS_KEY = "shipyard.memory.items";

export type MemoryItemType = "value" | "theme" | "pattern";

export type MemoryItem = {
  id: string;
  label: string;
  type: MemoryItemType;
  source: "system" | "user";
  updatedAt: string;
};

const createId = () => `memory-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const parseArray = <T>(value: string | null) => {
  if (!value) {
    return [] as T[];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [] as T[];
  }
};

const sanitizeMemoryLabel = (value: string) => value.trim().replace(/\s+/g, " ").slice(0, 160);

export const isMemoryEnabled = async () => {
  try {
    const value = await AsyncStorage.getItem(MEMORY_ENABLED_KEY);
    return value !== "0";
  } catch {
    return true;
  }
};

export const setMemoryEnabled = async (enabled: boolean) => {
  await AsyncStorage.setItem(MEMORY_ENABLED_KEY, enabled ? "1" : "0");
};

export const getMemoryItems = async () => {
  const raw = await AsyncStorage.getItem(MEMORY_ITEMS_KEY);
  return parseArray<MemoryItem>(raw).sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
  );
};

export const updateMemoryItem = async (
  memoryId: string,
  updater: (item: MemoryItem) => MemoryItem,
) => {
  const items = await getMemoryItems();
  const next = items.map((item) => (item.id === memoryId ? updater(item) : item));
  await AsyncStorage.setItem(MEMORY_ITEMS_KEY, JSON.stringify(next));
  return next;
};

export const deleteMemoryItem = async (memoryId: string) => {
  const items = await getMemoryItems();
  const next = items.filter((item) => item.id !== memoryId);
  await AsyncStorage.setItem(MEMORY_ITEMS_KEY, JSON.stringify(next));
  return next;
};

export const saveManualMemoryItem = async (label: string, type: MemoryItemType = "value") => {
  const normalized = sanitizeMemoryLabel(label);
  if (!normalized) {
    return null;
  }

  const items = await getMemoryItems();
  const nextItem: MemoryItem = {
    id: createId(),
    label: normalized,
    type,
    source: "user",
    updatedAt: new Date().toISOString(),
  };

  const next = [nextItem, ...items].slice(0, 48);
  await AsyncStorage.setItem(MEMORY_ITEMS_KEY, JSON.stringify(next));
  return nextItem;
};

const upsertSystemMemory = (
  items: MemoryItem[],
  label: string,
  type: MemoryItemType,
  nowIso: string,
) => {
  const normalized = sanitizeMemoryLabel(label);
  if (!normalized) {
    return items;
  }

  const existing = items.find(
    (item) => item.source === "system" && item.type === type && item.label === normalized,
  );

  if (existing) {
    return items.map((item) =>
      item.id === existing.id
        ? {
            ...item,
            updatedAt: nowIso,
          }
        : item,
    );
  }

  return [
    {
      id: createId(),
      label: normalized,
      type,
      source: "system" as const,
      updatedAt: nowIso,
    },
    ...items,
  ];
};

const getStage = (sessionCount: number) => {
  if (sessionCount >= 9) {
    return 3;
  }

  if (sessionCount >= 5) {
    return 2;
  }

  return 1;
};

const buildOutcomeMemories = (
  outcome: SessionOutcomeCard,
  sessionCount: number,
  outcomes: SessionOutcomeCard[],
) => {
  const stage = getStage(sessionCount);
  const memories: Array<{ type: MemoryItemType; label: string }> = [];

  if (outcome.data.kind === "focus") {
    memories.push({ type: "theme", label: `Current priority: ${outcome.data.priority}` });

    if (stage >= 2) {
      memories.push({ type: "pattern", label: `Action tendency: ${outcome.data.firstStep}` });
    }

    if (stage >= 3) {
      const unresolvedFocus = outcomes.filter(
        (entry) => entry.data.kind === "focus" && !entry.data.isCompleted,
      ).length;
      if (unresolvedFocus >= 2) {
        memories.push({
          type: "pattern",
          label: `Trajectory: you currently have ${unresolvedFocus} unresolved focus commitments.`,
        });
      }
    }

    return memories;
  }

  if (outcome.data.kind === "decision") {
    memories.push({ type: "theme", label: `Decision direction: ${outcome.data.decision}` });

    if (stage >= 2) {
      memories.push({
        type: "pattern",
        label: `Accepted tradeoff pattern: ${outcome.data.tradeoffAccepted}`,
      });
    }

    if (stage >= 3) {
      const priorDecisions = outcomes.filter((entry) => entry.data.kind === "decision").length;
      if (priorDecisions >= 3) {
        memories.push({
          type: "pattern",
          label: "Trajectory: your decisions are becoming more explicit about tradeoffs.",
        });
      }
    }

    return memories;
  }

  memories.push({ type: "theme", label: `Recurring insight: ${outcome.data.insight}` });

  if (stage >= 2) {
    memories.push({
      type: "value",
      label: `Question carried forward: ${outcome.data.questionToCarry}`,
    });
  }

  if (stage >= 3) {
    const priorReflections = outcomes.filter((entry) => entry.data.kind === "reflection").length;
    if (priorReflections >= 3) {
      memories.push({
        type: "pattern",
        label: "Trajectory: your reflections are showing stable recurring themes.",
      });
    }
  }

  return memories;
};

export const syncMemoryFromOutcome = async (
  outcome: SessionOutcomeCard,
  outcomes: SessionOutcomeCard[],
) => {
  const memoryEnabled = await isMemoryEnabled();
  if (!memoryEnabled) {
    return;
  }

  const nowIso = new Date().toISOString();
  const existing = await getMemoryItems();
  const memoryCandidates = buildOutcomeMemories(outcome, outcomes.length, outcomes);

  const next = memoryCandidates.reduce<MemoryItem[]>(
    (acc, item) => upsertSystemMemory(acc, item.label, item.type, nowIso),
    existing,
  );

  await AsyncStorage.setItem(MEMORY_ITEMS_KEY, JSON.stringify(next.slice(0, 48)));
};
