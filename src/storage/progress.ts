import AsyncStorage from "@react-native-async-storage/async-storage";

import { CoachLabel } from "../types/coaches";
import { ChatMessage } from "../types/chat";
import {
  SessionHistoryEntry,
  SessionOutcomeCard,
  SessionOutcomeData,
  SessionReportCard,
  TimelineItem,
  WeeklySummaryCard,
} from "../types/progress";
import { trackEvent } from "./analytics";
import { syncMemoryFromOutcome } from "./memory";

const OUTCOMES_KEY = "shipyard.outcomes";
const HISTORY_KEY = "shipyard.sessionHistory";
const WEEKLY_SUMMARIES_KEY = "shipyard.weeklySummaries";
const SESSION_REPORTS_KEY = "shipyard.sessionReports";

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const safeSentence = (value: string, fallback: string) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return fallback;
  }

  const capped = normalized.slice(0, 180);
  return capped.endsWith(".") ? capped : `${capped}.`;
};

const splitSentences = (value: string) =>
  value
    .split(/(?<=[.!?])\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const deriveOutcomeData = (
  coach: CoachLabel,
  latestUserMessage: string,
  latestAssistantMessage: string,
): SessionOutcomeData => {
  const assistantSentences = splitSentences(latestAssistantMessage);

  if (coach === "Focus Coach") {
    return {
      kind: "focus",
      priority: safeSentence(
        assistantSentences[0] ?? latestUserMessage,
        "Choose one concrete priority for today.",
      ),
      firstStep: safeSentence(
        assistantSentences[1] ?? latestUserMessage,
        "Take a single step in the next 20 minutes.",
      ),
      isCompleted: false,
    };
  }

  if (coach === "Decision Coach") {
    return {
      kind: "decision",
      decision: safeSentence(
        assistantSentences[0] ?? latestUserMessage,
        "Commit to one direction.",
      ),
      tradeoffAccepted: safeSentence(
        assistantSentences[1] ?? "",
        "Accept one meaningful downside of this choice.",
      ),
    };
  }

  return {
    kind: "reflection",
    insight: safeSentence(
      assistantSentences[0] ?? latestUserMessage,
      "Name the key thing that keeps recurring.",
    ),
    questionToCarry: safeSentence(
      assistantSentences[1] ?? "",
      "What deserves a slower look this week?",
    ),
  };
};

const isOutcomeCompatibleWithCoach = (
  coach: CoachLabel,
  outcome: SessionOutcomeData,
) => {
  if (coach === "Focus Coach") {
    return outcome.kind === "focus";
  }

  if (coach === "Decision Coach") {
    return outcome.kind === "decision";
  }

  return outcome.kind === "reflection";
};

const parseStoredArray = <T>(rawValue: string | null): T[] => {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};


const toCoachDescriptor = (coach: CoachLabel) => {
  if (coach === "Focus Coach") {
    return "focus and execution";
  }

  if (coach === "Decision Coach") {
    return "decision clarity";
  }

  return "reflection and meaning";
};

const buildSessionReport = (
  outcome: SessionOutcomeCard,
  latestUserMessage: string,
): Omit<SessionReportCard, "id" | "createdAt" | "coach" | "sourceSessionId" | "sourceOutcomeId"> => {
  const summary =
    outcome.data.kind === "focus"
      ? `You narrowed the session to one clear priority: ${outcome.data.priority}`
      : outcome.data.kind === "decision"
        ? `You committed to a direction: ${outcome.data.decision}`
        : `You captured a recurring insight: ${outcome.data.insight}`;

  const pattern =
    outcome.data.kind === "focus"
      ? `Pattern signal: you are using coaching for ${toCoachDescriptor(outcome.coach)}.`
      : outcome.data.kind === "decision"
        ? `Pattern signal: you are naming tradeoffs instead of staying stuck in options.`
        : `Pattern signal: you are slowing down to notice what repeats beneath the surface.`;

  const nextCheckInPrompt =
    outcome.data.kind === "focus"
      ? `When you check in next, report what happened after this first step: ${outcome.data.firstStep}`
      : outcome.data.kind === "decision"
        ? `At your next check-in, reflect on how this tradeoff felt in practice: ${outcome.data.tradeoffAccepted}`
        : `Carry this into your next check-in: ${outcome.data.questionToCarry}`;

  return {
    summary: safeSentence(summary, `You completed a ${outcome.coach} session.`),
    pattern: safeSentence(pattern, "Pattern signal captured from this session."),
    nextCheckInPrompt: safeSentence(
      nextCheckInPrompt || latestUserMessage,
      "What feels most important to revisit next?",
    ),
    confidence: 0.4,
    source: "fallback",
  };
};

export const getSessionReports = async () => {
  const rawValue = await AsyncStorage.getItem(SESSION_REPORTS_KEY);
  const entries = parseStoredArray<SessionReportCard>(rawValue);
  return entries.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
};
const getWeekRange = (dateValue: Date) => {
  const day = dateValue.getDay();
  const distanceFromMonday = (day + 6) % 7;

  const weekStart = new Date(dateValue);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - distanceFromMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    weekStart,
    weekEnd,
  };
};

const buildWeeklySummaryText = (outcomes: SessionOutcomeCard[]) => {
  const focusCount = outcomes.filter((entry) => entry.data.kind === "focus").length;
  const decisionCount = outcomes.filter((entry) => entry.data.kind === "decision").length;
  const reflectionCount = outcomes.filter(
    (entry) => entry.data.kind === "reflection",
  ).length;

  const dominantMode =
    [
      { label: "Focus", count: focusCount },
      { label: "Decision", count: decisionCount },
      { label: "Reflection", count: reflectionCount },
    ].sort((a, b) => b.count - a.count)[0]?.label ?? "Focus";

  return `This week you recorded ${outcomes.length} outcomes. ${dominantMode} carried most of your attention.`;
};

const maybeCreateWeeklySummary = async (outcomes: SessionOutcomeCard[]) => {
  if (outcomes.length < 3) {
    return;
  }

  const now = new Date();
  const { weekStart, weekEnd } = getWeekRange(now);
  const weekStartISO = weekStart.toISOString();
  const weekEndISO = weekEnd.toISOString();

  const outcomesThisWeek = outcomes.filter((entry) => {
    const createdAt = new Date(entry.createdAt).getTime();
    return createdAt >= weekStart.getTime() && createdAt <= weekEnd.getTime();
  });

  if (outcomesThisWeek.length < 3) {
    return;
  }

  const summaries = parseStoredArray<WeeklySummaryCard>(
    await AsyncStorage.getItem(WEEKLY_SUMMARIES_KEY),
  );

  const existingSummary = summaries.find((entry) => entry.weekStartISO === weekStartISO);
  if (existingSummary) {
    return;
  }

  const nextSummary: WeeklySummaryCard = {
    id: createId("weekly"),
    createdAt: new Date().toISOString(),
    weekStartISO,
    weekEndISO,
    summary: buildWeeklySummaryText(outcomesThisWeek),
  };

  await AsyncStorage.setItem(
    WEEKLY_SUMMARIES_KEY,
    JSON.stringify([nextSummary, ...summaries]),
  );
};

export const getOutcomeCards = async () => {
  const rawValue = await AsyncStorage.getItem(OUTCOMES_KEY);
  const entries = parseStoredArray<SessionOutcomeCard>(rawValue);
  return entries.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
};

export const getSessionHistory = async () => {
  const rawValue = await AsyncStorage.getItem(HISTORY_KEY);
  const entries = parseStoredArray<SessionHistoryEntry>(rawValue);
  return entries.sort((a, b) => +new Date(b.endedAt) - +new Date(a.endedAt));
};

export const getTimelineItems = async () => {
  const [outcomes, summaries, reports] = await Promise.all([
    getOutcomeCards(),
    AsyncStorage.getItem(WEEKLY_SUMMARIES_KEY),
    getSessionReports(),
  ]);

  const weeklySummaries = parseStoredArray<WeeklySummaryCard>(summaries);

  const items: TimelineItem[] = [
    ...outcomes
      .filter((entry) => !entry.archivedAt)
      .map((entry) => ({
        id: `outcome-${entry.id}`,
        type: "outcome" as const,
        createdAt: entry.createdAt,
        outcome: entry,
      })),
    ...weeklySummaries.map((entry) => ({
      id: `weekly-${entry.id}`,
      type: "weekly-summary" as const,
      createdAt: entry.createdAt,
      summary: entry,
    })),
    ...reports.map((entry) => ({
      id: `report-${entry.id}`,
      type: "session-report" as const,
      createdAt: entry.createdAt,
      report: entry,
    })),
  ];

  return items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
};

export const saveSessionWithOutcome = async ({
  coach,
  startedAt,
  messages,
  outcomeOverride,
  reportOverride,
}: {
  coach: CoachLabel;
  startedAt: string;
  messages: ChatMessage[];
  outcomeOverride?: SessionOutcomeData | null;
  reportOverride?: {
    summary: string;
    pattern: string;
    nextCheckInPrompt: string;
    confidence: number;
  } | null;
}) => {
  const conversationalMessages = messages.filter(
    (message) => !message.isOpening && !message.isError,
  );

  const userMessages = conversationalMessages.filter((message) => message.role === "user");
  const assistantMessages = conversationalMessages.filter(
    (message) => message.role === "assistant",
  );

  if (userMessages.length === 0 || assistantMessages.length === 0) {
    return null;
  }

  const latestUserMessage = userMessages[userMessages.length - 1]?.content ?? "";
  const latestAssistantMessage = assistantMessages[assistantMessages.length - 1]?.content ?? "";

  const sessionId = createId("session");

  const outcomeCard: SessionOutcomeCard = {
    id: createId("outcome"),
    coach,
    createdAt: new Date().toISOString(),
    sourceSessionId: sessionId,
    data:
      outcomeOverride && isOutcomeCompatibleWithCoach(coach, outcomeOverride)
        ? outcomeOverride
        : deriveOutcomeData(coach, latestUserMessage, latestAssistantMessage),
  };

  const sessionEntry: SessionHistoryEntry = {
    id: sessionId,
    coach,
    startedAt,
    endedAt: new Date().toISOString(),
    outcomeId: outcomeCard.id,
    messages: conversationalMessages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  };

  const [existingOutcomes, existingHistory, existingReports] = await Promise.all([
    getOutcomeCards(),
    getSessionHistory(),
    getSessionReports(),
  ]);

  const nextOutcomes = [outcomeCard, ...existingOutcomes];
  const nextHistory = [sessionEntry, ...existingHistory];
  const fallbackReport = buildSessionReport(outcomeCard, latestUserMessage);
  const reportCard: SessionReportCard = {
    id: createId("report"),
    createdAt: new Date().toISOString(),
    coach,
    sourceSessionId: sessionId,
    sourceOutcomeId: outcomeCard.id,
    summary: safeSentence(reportOverride?.summary ?? fallbackReport.summary, fallbackReport.summary),
    pattern: safeSentence(reportOverride?.pattern ?? fallbackReport.pattern, fallbackReport.pattern),
    nextCheckInPrompt: safeSentence(
      reportOverride?.nextCheckInPrompt ?? fallbackReport.nextCheckInPrompt,
      fallbackReport.nextCheckInPrompt,
    ),
    confidence:
      typeof reportOverride?.confidence === "number"
        ? Math.max(0, Math.min(1, Number(reportOverride.confidence.toFixed(2))))
        : fallbackReport.confidence,
    source: reportOverride ? "ai" : "fallback",
  };
  const nextReports = [reportCard, ...existingReports];

  await Promise.all([
    AsyncStorage.setItem(OUTCOMES_KEY, JSON.stringify(nextOutcomes)),
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory)),
    AsyncStorage.setItem(SESSION_REPORTS_KEY, JSON.stringify(nextReports)),
  ]);

  await maybeCreateWeeklySummary(nextOutcomes);
  await syncMemoryFromOutcome(outcomeCard);

  await trackEvent("session_saved", {
    coach,
    outcome_kind: outcomeCard.data.kind,
    used_outcome_override: Boolean(outcomeOverride),
  });

  await trackEvent("session_report_saved", {
    coach,
    outcome_kind: outcomeCard.data.kind,
    report_id: reportCard.id,
    report_source: reportCard.source,
    report_confidence: reportCard.confidence,
  });

  return outcomeCard;
};

export const updateOutcomeCard = async (
  outcomeId: string,
  updater: (value: SessionOutcomeCard) => SessionOutcomeCard,
) => {
  const outcomes = await getOutcomeCards();
  const nextOutcomes = outcomes.map((entry) =>
    entry.id === outcomeId ? updater(entry) : entry,
  );

  await AsyncStorage.setItem(OUTCOMES_KEY, JSON.stringify(nextOutcomes));

  const updated = nextOutcomes.find((entry) => entry.id === outcomeId);
  if (updated) {
    await trackEvent("outcome_updated", {
      outcome_kind: updated.data.kind,
      coach: updated.coach,
    });

    if (updated.data.kind === "focus" && updated.data.isCompleted) {
      await trackEvent("outcome_focus_completed", {
        outcome_id: updated.id,
      });
    }
  }
};

export const archiveOutcomeCard = async (outcomeId: string) => {
  await updateOutcomeCard(outcomeId, (entry) => ({
    ...entry,
    archivedAt: new Date().toISOString(),
  }));

  await trackEvent("outcome_archived", { outcome_id: outcomeId });
};

export const deleteOutcomeCard = async (outcomeId: string) => {
  const outcomes = await getOutcomeCards();
  const deleted = outcomes.find((entry) => entry.id === outcomeId);
  const nextOutcomes = outcomes.filter((entry) => entry.id !== outcomeId);
  await AsyncStorage.setItem(OUTCOMES_KEY, JSON.stringify(nextOutcomes));

  await trackEvent("outcome_deleted", {
    outcome_id: outcomeId,
    outcome_kind: deleted?.data.kind ?? null,
  });
};
