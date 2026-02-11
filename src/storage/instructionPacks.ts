import AsyncStorage from "@react-native-async-storage/async-storage";

import { InstructionPack } from "../types/portal";

const ENABLED_PACK_IDS_KEY = "shipyard.portal.enabledPackIds";

const PACKS: InstructionPack[] = [
  {
    id: "values-first",
    name: "Values First",
    description: "Favor alignment over urgency when tradeoffs appear.",
    instructions:
      "When options are close, ask one short values-alignment question before recommending a direction.",
  },
  {
    id: "ship-small",
    name: "Ship Small",
    description: "Bias toward minimum viable motion and fast proof.",
    instructions:
      "When planning next steps, reduce scope and prioritize a single smallest testable step.",
  },
  {
    id: "energy-aware",
    name: "Energy Aware",
    description: "Account for current energy and cognitive load.",
    instructions:
      "If user sounds overloaded, keep actions lighter and suggest lower-energy first steps.",
  },
];

const parseIds = (value: string | null) => {
  if (!value) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === "string") : [];
  } catch {
    return [] as string[];
  }
};

export const getInstructionPacks = async () => {
  const raw = await AsyncStorage.getItem(ENABLED_PACK_IDS_KEY);
  const enabledIds = new Set(parseIds(raw));

  return PACKS.map((pack) => ({
    ...pack,
    enabled: enabledIds.has(pack.id),
  }));
};

export const toggleInstructionPack = async (packId: string, enabled: boolean) => {
  const existing = await getInstructionPacks();
  const enabledIds = existing
    .filter((pack) => (pack.id === packId ? enabled : pack.enabled))
    .map((pack) => pack.id);

  await AsyncStorage.setItem(ENABLED_PACK_IDS_KEY, JSON.stringify(enabledIds));
};

export const getInstructionPackContext = async () => {
  const packs = await getInstructionPacks();
  const enabled = packs.filter((pack) => pack.enabled);

  if (enabled.length === 0) {
    return "";
  }

  const lines = enabled.map((pack) => `- ${pack.name}: ${pack.instructions}`);
  return ["Advanced instruction packs:", ...lines].join("\n");
};
