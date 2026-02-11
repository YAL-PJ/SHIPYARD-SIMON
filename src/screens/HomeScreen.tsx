import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
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
  markAppOpenedNow,
  markReminderShownNow,
  maybeGetGentleReminder,
} from "../storage/engagement";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

type CoachOption = {
  label: CoachLabel;
  description: string;
};

type StarterIntent = {
  label: string;
  coach: CoachLabel;
};

const COACHES: CoachOption[] = [
  { label: "Focus Coach", description: "Turn scattered tasks into one clear priority." },
  { label: "Decision Coach", description: "Make confident choices when stakes are high." },
  { label: "Reflection Coach", description: "Process your day and shape the next step." },
];

const STARTER_INTENTS: StarterIntent[] = [
  { label: "I can't prioritize this week", coach: "Focus Coach" },
  { label: "I'm stuck between two options", coach: "Decision Coach" },
  { label: "I keep looping on the same thought", coach: "Reflection Coach" },
];

export const HomeScreen = ({ navigation }: Props) => {
  const { isSubscribed } = useMonetization();
  const [menuCoach, setMenuCoach] = useState<CoachLabel | null>(null);
  const [modeHelperIndex, setModeHelperIndex] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      const sync = async () => {
        const reminder = await maybeGetGentleReminder();
        if (reminder) {
          await markReminderShownNow();
          Alert.alert("Check-in", reminder, [
            { text: "Not now", style: "cancel" },
            {
              text: "Start Focus Session",
              onPress: () => navigation.navigate("Chat", { coach: "Focus Coach" }),
            },
          ]);
        }

        await markAppOpenedNow();
      };

      void sync();
    }, [navigation]),
  );

  const closeMenu = () => setMenuCoach(null);

  const openEditCoachFlow = (coach: CoachLabel) => {
    if (!isSubscribed) {
      Alert.alert(
        "Locked for free users",
        "Editing coaches is a Plus feature. Upgrade to unlock coach personalization.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Upgrade",
            onPress: () => navigation.navigate("Paywall", { coach, source: "edit" }),
          },
        ],
      );
      return;
    }

    navigation.navigate("EditCoach", { coach });
  };

  const handleEditCoach = (coach: CoachLabel) => {
    closeMenu();
    openEditCoachFlow(coach);
  };

  const modeHelper = useMemo(
    () => [
      { feeling: "Overwhelmed", coach: "Focus Coach" as CoachLabel },
      { feeling: "Torn", coach: "Decision Coach" as CoachLabel },
      { feeling: "Mentally noisy", coach: "Reflection Coach" as CoachLabel },
    ][modeHelperIndex % 3],
    [modeHelperIndex],
  );

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.eyebrow}>MARA</Text>
        <Text style={styles.title}>One calm next step</Text>
        <Text style={styles.subtitle}>
          Move from clarity to action. Every session ends with a saved outcome you can revisit.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryCta}
        onPress={() => navigation.navigate("Chat", { coach: modeHelper.coach })}
      >
        <Text style={styles.primaryCtaTitle}>Start {modeHelper.coach}</Text>
        <Text style={styles.primaryCtaSub}>Based on your current state: {modeHelper.feeling}</Text>
      </TouchableOpacity>

      <View style={styles.modeHelperCard}>
        <Text style={styles.modeHelperTitle}>What are you experiencing?</Text>
        <Text style={styles.modeHelperText}>
          {modeHelper.feeling} → Try {modeHelper.coach}
        </Text>
        <View style={styles.modeHelperActions}>
          <TouchableOpacity
            style={styles.modeHelperButton}
            onPress={() => navigation.navigate("Chat", { coach: modeHelper.coach, quickMode: true })}
          >
            <Text style={styles.modeHelperButtonText}>2-minute mode</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modeHelperButton}
            onPress={() => setModeHelperIndex((value) => value + 1)}
          >
            <Text style={styles.modeHelperButtonText}>See another recommendation</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.coachGrid}>
        {COACHES.map((coach) => (
          <TouchableOpacity
            key={coach.label}
            style={styles.coachCard}
            onPress={() => navigation.navigate("Chat", { coach: coach.label })}
            onLongPress={() => setMenuCoach(coach.label)}
          >
            <Text style={styles.coachLabel}>{coach.label}</Text>
            <Text style={styles.coachDescription}>{coach.description}</Text>
            <Text style={styles.coachHint}>Long press to edit tone and constraints</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.intentSection}>
        <Text style={styles.intentTitle}>Starter intents</Text>
        <View style={styles.intentWrap}>
          {STARTER_INTENTS.map((intent) => (
            <TouchableOpacity
              key={intent.label}
              style={styles.intentChip}
              onPress={() => navigation.navigate("Chat", { coach: intent.coach })}
            >
              <Text style={styles.intentChipText}>{intent.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.secondaryActions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Progress")}>
          <Text style={styles.secondaryButtonText}>Progress timeline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Reports")}>
          <Text style={styles.secondaryButtonText}>Session reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Memory")}>
          <Text style={styles.secondaryButtonText}>What I've learned</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Safety")}>
          <Text style={styles.secondaryButtonText}>Safety & boundaries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Insights")}>
          <Text style={styles.secondaryButtonText}>Quality insights</Text>
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

      <Text style={styles.boundaryText}>
        Coaching support only. Not medical, legal, financial, or crisis care.
      </Text>

      <Modal
        transparent
        visible={Boolean(menuCoach)}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeMenu}>
          <Pressable style={styles.menuCard}>
            <Text style={styles.menuTitle}>{menuCoach}</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => menuCoach && handleEditCoach(menuCoach)}
            >
              <Text style={styles.menuItemText}>Edit coach tone & emphasis</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={closeMenu}>
              <Text style={styles.menuItemText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  modeHelperCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  modeHelperTitle: {
    color: "#334155",
    fontWeight: "700",
    letterSpacing: 0.4,
    fontSize: 12,
  },
  modeHelperText: {
    color: "#0f172a",
    fontSize: 14,
    lineHeight: 20,
  },
  modeHelperActions: {
    flexDirection: "row",
    gap: 8,
  },
  modeHelperButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  modeHelperButtonText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  coachGrid: {
    gap: 8,
  },
  coachCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  coachLabel: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  coachDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  coachHint: {
    fontSize: 12,
    lineHeight: 16,
    color: "#94a3b8",
  },
  intentSection: {
    gap: 8,
  },
  intentTitle: {
    color: "#334155",
    fontSize: 12,
    letterSpacing: 0.4,
    fontWeight: "700",
  },
  intentWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  intentChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  intentChipText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  secondaryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  boundaryText: {
    marginTop: "auto",
    fontSize: 12,
    lineHeight: 17,
    color: "#64748b",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  menuCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  menuTitle: {
    color: "#0f172a",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  menuItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
  },
  menuItemText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
});
