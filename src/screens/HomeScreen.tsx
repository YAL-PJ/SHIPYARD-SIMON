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
        <Text style={styles.title}>Choose your coaching mode</Text>
        <Text style={styles.subtitle}>
          Move from clarity to action. Every session ends with a saved outcome you can revisit.
        </Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.timelineButton} onPress={() => navigation.navigate("Progress")}> 
          <Text style={styles.timelineButtonText}>Open Progress Timeline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.timelineButton} onPress={() => navigation.navigate("Memory")}> 
          <Text style={styles.timelineButtonText}>What I&apos;ve learned</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.timelineButton} onPress={() => navigation.navigate("Safety")}> 
          <Text style={styles.timelineButtonText}>Safety & boundaries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.timelineButton} onPress={() => navigation.navigate("Reports")}> 
          <Text style={styles.timelineButtonText}>Session reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.timelineButton} onPress={() => navigation.navigate("Insights")}> 
          <Text style={styles.timelineButtonText}>Quality insights</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.timelineButton}
          onPress={() => {
            if (!isSubscribed) {
              navigation.navigate("Paywall", { coach: "Focus Coach", source: "home" });
              return;
            }

            navigation.navigate("Portal");
          }}
        >
          <Text style={styles.timelineButtonText}>Advanced Portal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modeHelperCard}>
        <Text style={styles.modeHelperTitle}>What are you experiencing?</Text>
        <Text style={styles.modeHelperText}>
          {modeHelper.feeling} → Try {modeHelper.coach}
        </Text>
        <View style={styles.modeHelperActions}>
          <TouchableOpacity
            style={styles.modeHelperButton}
            onPress={() => navigation.navigate("Chat", { coach: modeHelper.coach })}
          >
            <Text style={styles.modeHelperButtonText}>Start {modeHelper.coach}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modeHelperButton}
            onPress={() => navigation.navigate("Chat", { coach: modeHelper.coach, quickMode: true })}
          >
            <Text style={styles.modeHelperButtonText}>2-minute mode</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modeHelperButtonSecondary}
            onPress={() => setModeHelperIndex((prev) => prev + 1)}
          >
            <Text style={styles.modeHelperButtonSecondaryText}>See another recommendation</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.intentRow}>
        {STARTER_INTENTS.map((intent) => (
          <TouchableOpacity
            key={intent.label}
            style={styles.intentChip}
            onPress={() => navigation.navigate("Chat", { coach: intent.coach })}
          >
            <Text style={styles.intentText}>{intent.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!isSubscribed ? (
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.upgradeButton}
          onPress={() =>
            navigation.navigate("Paywall", { coach: "Focus Coach", source: "home" })
          }
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Plus</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.cardList}>
        {COACHES.map((coach) => (
          <View key={coach.label} style={styles.card}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate("Chat", { coach: coach.label })}
              onLongPress={() => setMenuCoach(coach.label)}
              style={styles.cardMainButton}
            >
              <View style={styles.cardBody}>
                <Text style={styles.cardText}>{coach.label}</Text>
                <Text style={styles.cardDescription}>{coach.description}</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`AI edit options for ${coach.label}`}
                style={styles.moreButton}
                onPress={() => setMenuCoach(coach.label)}
              >
                <Text style={styles.moreButtonText}>✦</Text>
              </TouchableOpacity>
            </Pressable>
          </View>
        ))}
      </View>

      <Text style={styles.scopeText}>Coaching support only. Not medical, legal, or financial advice.</Text>

      <Modal transparent visible={menuCoach !== null} animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.overlay} onPress={closeMenu}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>{menuCoach}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.menuAction}
              onPress={() => menuCoach && handleEditCoach(menuCoach)}
            >
              <Text style={styles.menuActionText}>
                {isSubscribed ? "Edit Coach" : "🔒 Edit Coach (Upgrade required)"}
              </Text>
            </TouchableOpacity>
            {!isSubscribed ? (
              <Text style={styles.menuHint}>This action is locked for free users.</Text>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: "#f6f8fb",
  },
  topSection: { marginBottom: 16, gap: 8 },
  eyebrow: { fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 1, color: "#64748b" },
  title: { fontSize: 32, lineHeight: 38, fontWeight: "700", color: "#0f172a", letterSpacing: -0.7 },
  subtitle: { fontSize: 15, lineHeight: 22, color: "#475569", maxWidth: 360 },
  quickActions: { marginBottom: 10, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  timelineButton: { borderRadius: 999, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#ffffff", paddingHorizontal: 12, paddingVertical: 8 },
  timelineButtonText: { color: "#1e293b", fontSize: 13, lineHeight: 18, fontWeight: "600" },
  modeHelperCard: { borderRadius: 14, borderWidth: 1, borderColor: "#dbe3ef", backgroundColor: "#ffffff", padding: 12, gap: 6, marginBottom: 10 },
  modeHelperTitle: { color: "#334155", fontSize: 12, letterSpacing: 0.5, fontWeight: "700" },
  modeHelperText: { color: "#0f172a", fontSize: 14, lineHeight: 20 },
  modeHelperActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  modeHelperButton: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#0f172a" },
  modeHelperButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  modeHelperButtonSecondary: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#eff6ff" },
  modeHelperButtonSecondaryText: { color: "#1e40af", fontSize: 12, fontWeight: "600" },
  intentRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  intentChip: { borderRadius: 999, borderWidth: 1, borderColor: "#dbe3ef", paddingHorizontal: 11, paddingVertical: 7, backgroundColor: "#fff" },
  intentText: { color: "#334155", fontSize: 12, lineHeight: 16, fontWeight: "600" },
  cardList: { gap: 14 },
  upgradeButton: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#dbe3ef", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#ffffff", marginBottom: 18 },
  upgradeButtonText: { color: "#1e293b", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  card: { borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 16, paddingVertical: 16, backgroundColor: "#ffffff" },
  cardMainButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 14 },
  cardBody: { flex: 1, gap: 4 },
  cardText: { fontSize: 19, lineHeight: 24, fontWeight: "600", color: "#0f172a" },
  cardDescription: { fontSize: 14, lineHeight: 20, color: "#64748b" },
  moreButton: { borderWidth: 1, borderColor: "#dbe3ef", borderRadius: 999, width: 34, height: 34, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  moreButtonText: { color: "#334155", fontSize: 16, lineHeight: 18, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.35)", justifyContent: "flex-end", padding: 20 },
  menuCard: { backgroundColor: "#fff", borderRadius: 18, padding: 16, gap: 14 },
  menuTitle: { fontSize: 17, lineHeight: 22, color: "#111827", fontWeight: "600" },
  menuAction: { borderRadius: 12, borderWidth: 1, borderColor: "#d1d9e6", backgroundColor: "#f8fafc", paddingHorizontal: 12, paddingVertical: 10 },
  menuActionText: { color: "#1f2937", fontSize: 15, lineHeight: 20, fontWeight: "500" },
  menuHint: { color: "#6b7280", fontSize: 14, lineHeight: 19 },
  scopeText: { marginTop: "auto", color: "#64748b", fontSize: 12, lineHeight: 18, paddingTop: 14 },
});
