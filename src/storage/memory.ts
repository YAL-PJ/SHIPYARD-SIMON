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

const buildOutcomeMemories = (outcome: SessionOutcomeCard) => {
  if (outcome.data.kind === "focus") {
    return [
      { type: "theme" as const, label: `Current priority: ${outcome.data.priority}` },
      { type: "pattern" as const, label: `Action tendency: ${outcome.data.firstStep}` },
    ];
  }

  if (outcome.data.kind === "decision") {
    return [
      { type: "theme" as const, label: `Decision direction: ${outcome.data.decision}` },
      {
        type: "pattern" as const,
        label: `Accepted tradeoff pattern: ${outcome.data.tradeoffAccepted}`,
      },
    ];
  }

  return [
    { type: "theme" as const, label: `Recurring insight: ${outcome.data.insight}` },
    { type: "value" as const, label: `Question carried forward: ${outcome.data.questionToCarry}` },
  ];
};

export const syncMemoryFromOutcome = async (outcome: SessionOutcomeCard) => {
  const memoryEnabled = await isMemoryEnabled();
  if (!memoryEnabled) {
    return;
  }

  const nowIso = new Date().toISOString();
  const existing = await getMemoryItems();
  const memoryCandidates = buildOutcomeMemories(outcome);

  const next = memoryCandidates.reduce<MemoryItem[]>(
    (acc, item) => upsertSystemMemory(acc, item.label, item.type, nowIso),
    existing,
  );

  await AsyncStorage.setItem(MEMORY_ITEMS_KEY, JSON.stringify(next.slice(0, 48)));
};
