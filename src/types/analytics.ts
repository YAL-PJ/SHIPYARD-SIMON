export const ANALYTICS_EVENT = {
  SESSION_SAVED: "session_saved",
  SESSION_CLOSED: "session_closed",
  SESSION_CLOSE_BLOCKED: "session_close_blocked",
  OUTCOME_EXTRACTION_RESULT: "outcome_extraction_result",
  SESSION_REPORT_EXTRACTION_RESULT: "session_report_extraction_result",
  SESSION_REPORT_SAVED: "session_report_saved",
  SESSION_REPORT_FEEDBACK: "session_report_feedback",
  OUTCOME_UPDATED: "outcome_updated",
  OUTCOME_FOCUS_COMPLETED: "outcome_focus_completed",
  OUTCOME_ARCHIVED: "outcome_archived",
  OUTCOME_DELETED: "outcome_deleted",
  ANALYTICS_SYNCED: "analytics_synced",
  REMINDER_SCHEDULED: "reminder_scheduled",
  REMINDER_TRIGGERED: "reminder_triggered",
  REMINDER_OPENED: "reminder_opened",
  CALENDAR_CONNECT_REQUESTED: "calendar_connect_requested",
  CALENDAR_CONNECTED: "calendar_connected",
  CALENDAR_DISCONNECTED: "calendar_disconnected",
  CALENDAR_SYNC_STARTED: "calendar_sync_started",
  CALENDAR_SYNC_SUCCEEDED: "calendar_sync_succeeded",
  CALENDAR_SYNC_FAILED: "calendar_sync_failed",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT)[keyof typeof ANALYTICS_EVENT];

export type AnalyticsPayloadValue = string | number | boolean | null | undefined;
export type AnalyticsPayload = Record<string, AnalyticsPayloadValue>;
