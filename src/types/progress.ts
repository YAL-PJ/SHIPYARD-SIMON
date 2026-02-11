export type TimelineCoachType = "Focus Coach" | "Decision Coach" | "Reflection Coach";

export type FocusOutcome = {
  kind: "focus";
  priority: string;
  firstStep: string;
  isCompleted: boolean;
};

export type DecisionOutcome = {
  kind: "decision";
  decision: string;
  tradeoffAccepted: string;
};

export type ReflectionOutcome = {
  kind: "reflection";
  insight: string;
  questionToCarry: string;
};

export type SessionOutcomeData = FocusOutcome | DecisionOutcome | ReflectionOutcome;

export type SessionOutcomeCard = {
  id: string;
  coach: TimelineCoachType;
  createdAt: string;
  archivedAt?: string;
  sourceSessionId: string;
  data: SessionOutcomeData;
};

export type WeeklySummaryCard = {
  id: string;
  createdAt: string;
  weekStartISO: string;
  weekEndISO: string;
  summary: string;
};

export type SessionReportCard = {
  id: string;
  createdAt: string;
  coach: TimelineCoachType;
  sourceSessionId: string;
  sourceOutcomeId: string;
  summary: string;
  pattern: string;
  nextCheckInPrompt: string;
  confidence: number;
  source: "ai" | "fallback";
};

export type TimelineItem =
  | {
      id: string;
      type: "outcome";
      createdAt: string;
      outcome: SessionOutcomeCard;
    }
  | {
      id: string;
      type: "weekly-summary";
      createdAt: string;
      summary: WeeklySummaryCard;
    }
  | {
      id: string;
      type: "session-report";
      createdAt: string;
      report: SessionReportCard;
    };

export type SessionHistoryEntry = {
  id: string;
  coach: TimelineCoachType;
  startedAt: string;
  endedAt: string;
  messages: Array<{ role: "assistant" | "user"; content: string }>;
  outcomeId?: string;
};
