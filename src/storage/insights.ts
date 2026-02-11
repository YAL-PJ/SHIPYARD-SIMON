import { AnalyticsEvent, getTrackedEvents } from "./analytics";

export type EventMetric = {
  label: string;
  value: number;
};

const countByName = (events: AnalyticsEvent[], name: string) =>
  events.filter((event) => event.name === name).length;

export const getOutcomeQualityMetrics = async () => {
  const events = await getTrackedEvents();

  const sessionSaved = countByName(events, "session_saved");
  const extractionEvents = events.filter((entry) => entry.name === "outcome_extraction_result");
  const fallbackCount = extractionEvents.filter(
    (entry) => entry.payload?.used_fallback_outcome === true,
  ).length;

  const metrics: EventMetric[] = [
    { label: "Sessions saved", value: sessionSaved },
    {
      label: "Outcome fallback used",
      value: fallbackCount,
    },
    { label: "Outcome edits", value: countByName(events, "outcome_updated") },
    { label: "Focus completed", value: countByName(events, "outcome_focus_completed") },
    { label: "Outcomes archived", value: countByName(events, "outcome_archived") },
    { label: "Outcomes deleted", value: countByName(events, "outcome_deleted") },
  ];

  return metrics;
};
