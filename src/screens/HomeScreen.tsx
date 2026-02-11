import React, { useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { useMonetization } from "../context/MonetizationContext";
import { RootStackParamList } from "../types/navigation";
import { CoachLabel } from "../types/coaches";
import {
  consumePendingReminder,
  getTriggeredReminder,
  markAppOpenedNow,
  markReminderShownNow,
  maybeScheduleGentleReminder,
} from "../storage/engagement";
import { trackEvent } from "../storage/analytics";
import { ANALYTICS_EVENT } from "../types/analytics";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export const HomeScreen = ({ navigation }: Props) => {
  const { isSubscribed } = useMonetization();
  const [showSecondary, setShowSecondary] = useState(false);
  const [modeHelperIndex, setModeHelperIndex] = useState(0);

  const modeHelper = useMemo(
    () => [
      { feeling: "Overwhelmed", coach: "Focus Coach" as CoachLabel },
      { feeling: "Torn", coach: "Decision Coach" as CoachLabel },
      { feeling: "Mentally noisy", coach: "Reflection Coach" as CoachLabel },
    ][modeHelperIndex % 3],
    [modeHelperIndex],
  );

  useFocusEffect(
    React.useCallback(() => {
      const sync = async () => {
        const scheduled = await maybeScheduleGentleReminder();
        if (scheduled) {
          await trackEvent(ANALYTICS_EVENT.REMINDER_SCHEDULED, {
            reminder_id: scheduled.id,
            target: scheduled.target,
          });
        }

        const triggered = await getTriggeredReminder();
        if (triggered) {
          await trackEvent(ANALYTICS_EVENT.REMINDER_TRIGGERED, {
            reminder_id: triggered.id,
            target: triggered.target,
          });
        }

        const pending = await consumePendingReminder();
        if (pending) {
          await markReminderShownNow();
          Alert.alert("Gentle check-in", pending.message, [
            { text: "Not now", style: "cancel" },
            {
              text: pending.target === "focus_outcome" ? "Continue focus outcome" : "Start quick check-in",
              onPress: () => {
                void trackEvent(ANALYTICS_EVENT.REMINDER_OPENED, {
                  reminder_id: pending.id,
                  target: pending.target,
                  has_outcome: Boolean(pending.outcomeId),
                });
                if (pending.target === "focus_outcome" && pending.outcomeId) {
                  navigation.navigate("Progress", { reminderOutcomeId: pending.outcomeId });
                  return;
                }

                navigation.navigate("Chat", { coach: "Focus Coach", quickMode: true });
              },
            },
          ]);
        }

        await markAppOpenedNow();
      };

      void sync();
    }, [navigation]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.eyebrow}>MARA</Text>
        <Text style={styles.title}>One calm next step</Text>
        <Text style={styles.subtitle}>
          A coaching system: session to outcome, timeline, reports, memory, and long-term growth.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryCta}
        onPress={() => navigation.navigate("Chat", { coach: modeHelper.coach })}
      >
        <Text style={styles.primaryCtaTitle}>Start {modeHelper.coach}</Text>
        <Text style={styles.primaryCtaSub}>Suggested for feeling {modeHelper.feeling.toLowerCase()}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryToggle} onPress={() => setShowSecondary((value) => !value)}>
        <Text style={styles.secondaryToggleText}>{showSecondary ? "Hide more actions" : "Show more actions"}</Text>
      </TouchableOpacity>

      {showSecondary ? (
        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Chat", { coach: modeHelper.coach, quickMode: true })}>
            <Text style={styles.secondaryButtonText}>2-minute check-in</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setModeHelperIndex((value) => value + 1)}>
            <Text style={styles.secondaryButtonText}>See another coach suggestion</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Progress")}>
            <Text style={styles.secondaryButtonText}>Timeline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Reports")}>
            <Text style={styles.secondaryButtonText}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Memory")}>
            <Text style={styles.secondaryButtonText}>Memory controls</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Safety")}>
            <Text style={styles.secondaryButtonText}>Safety & scope</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Insights")}>
            <Text style={styles.secondaryButtonText}>Quality dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              if (!isSubscribed) {
                navigation.navigate("Paywall", { coach: "Focus Coach", source: "home" });
                return;
              }

              navigation.navigate("Portal");
            }}
          >
            <Text style={styles.secondaryButtonText}>Advanced Portal</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.boundaryText}>
        Coaching support only. Not medical, legal, financial, or crisis care.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: "#f8fafc",
    gap: 12,
  },
  topSection: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#64748b",
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
  },
  primaryCta: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 3,
  },
  primaryCtaTitle: { color: "#1e3a8a", fontWeight: "700", fontSize: 16 },
  primaryCtaSub: { color: "#1d4ed8", fontSize: 12 },
  secondaryToggle: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  secondaryToggleText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  secondaryActions: {
    gap: 8,
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  boundaryText: {
    marginTop: "auto",
    fontSize: 12,
    lineHeight: 17,
    color: "#64748b",
  },
});
