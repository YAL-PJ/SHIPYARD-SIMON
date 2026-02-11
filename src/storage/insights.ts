import { AnalyticsEvent, getTrackedEvents } from "./analytics";
import { ANALYTICS_EVENT } from "../types/analytics";

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

  const sessionSaved = countByName(events, ANALYTICS_EVENT.SESSION_SAVED);
  const extractionEvents = events.filter((entry) => entry.name === ANALYTICS_EVENT.OUTCOME_EXTRACTION_RESULT);
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
        ANALYTICS_EVENT.SESSION_REPORT_SAVED,
        "report_quality_status",
        "accepted_ai",
      ),
    },
    {
      label: "Reports rejected to fallback",
      value: countByPayloadField(
        events,
        ANALYTICS_EVENT.SESSION_REPORT_SAVED,
        "report_quality_status",
        "rejected_ai_fallback",
      ),
    },
    {
      label: "Report feedback: useful",
      value: countByPayloadField(events, ANALYTICS_EVENT.SESSION_REPORT_FEEDBACK, "feedback", "useful"),
    },
    {
      label: "Report feedback: not useful",
      value: countByPayloadField(
        events,
        ANALYTICS_EVENT.SESSION_REPORT_FEEDBACK,
        "feedback",
        "not_useful",
      ),
    },
    { label: "Outcome edits", value: countByName(events, ANALYTICS_EVENT.OUTCOME_UPDATED) },
    { label: "Focus completed", value: countByName(events, ANALYTICS_EVENT.OUTCOME_FOCUS_COMPLETED) },
    { label: "Outcomes archived", value: countByName(events, ANALYTICS_EVENT.OUTCOME_ARCHIVED) },
    { label: "Outcomes deleted", value: countByName(events, ANALYTICS_EVENT.OUTCOME_DELETED) },
  ];

  return metrics;
};
