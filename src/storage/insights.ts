import { AnalyticsEvent, getTrackedEvents } from "./analytics";

export type EventMetric = {
  label: string;
  value: number;
};

const countByName = (events: AnalyticsEvent[], name: string) =>
  events.filter((event) => event.name === name).length;

const countByPayloadField = (
  events: AnalyticsEvent[],
  eventName: string,
  payloadKey: string,
  expectedValue: string | boolean,
) =>
  events.filter(
    (event) => event.name === eventName && event.payload?.[payloadKey] === expectedValue,
  ).length;

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
    {
      label: "Reports accepted (AI)",
      value: countByPayloadField(
        events,
        "session_report_saved",
        "report_quality_status",
        "accepted_ai",
      ),
    },
    {
      label: "Reports rejected to fallback",
      value: countByPayloadField(
        events,
        "session_report_saved",
        "report_quality_status",
        "rejected_ai_fallback",
      ),
    },
    {
      label: "Report feedback: useful",
      value: countByPayloadField(events, "session_report_feedback", "feedback", "useful"),
    },
    {
      label: "Report feedback: not useful",
      value: countByPayloadField(
        events,
        "session_report_feedback",
        "feedback",
        "not_useful",
      ),
    },
    { label: "Outcome edits", value: countByName(events, "outcome_updated") },
    { label: "Focus completed", value: countByName(events, "outcome_focus_completed") },
    { label: "Outcomes archived", value: countByName(events, "outcome_archived") },
    { label: "Outcomes deleted", value: countByName(events, "outcome_deleted") },
  ];

  return metrics;
};
