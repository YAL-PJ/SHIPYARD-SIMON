import React, { useState } from "react";
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

import { useMonetization } from "../context/MonetizationContext";
import { RootStackParamList } from "../types/navigation";
import { CoachLabel } from "../types/coaches";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

type CoachOption = {
  label: CoachLabel;
  description: string;
};

const COACHES: CoachOption[] = [
  { label: "Focus Coach", description: "Turn scattered tasks into one clear priority." },
  { label: "Decision Coach", description: "Make confident choices when stakes are high." },
  { label: "Reflection Coach", description: "Process your day and shape the next step." },
];

export const HomeScreen = ({ navigation }: Props) => {
  const { isSubscribed } = useMonetization();
  const [menuCoach, setMenuCoach] = useState<CoachLabel | null>(null);

  const closeMenu = () => setMenuCoach(null);

  const openEditCoachFlow = (coach: CoachLabel) => {
    if (!isSubscribed) {
      Alert.alert(
        "Locked for free users",
        "Editing coaches is a Pro feature. Register to unlock coach personalization.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Register",
            onPress: () => navigation.navigate("Paywall", { coach, source: "edit" }),
          },
        ]
      );
      return;
    }

    navigation.navigate("EditCoach", { coach });
  };

  const handleEditCoach = (coach: CoachLabel) => {
    closeMenu();
    openEditCoachFlow(coach);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.eyebrow}>MARA</Text>
        <Text style={styles.title}>Choose your coaching mode</Text>
        <Text style={styles.subtitle}>
          One focused conversation at a time. Long-press or tap ✦ to customize a coach.
        </Text>
      </View>

      {!isSubscribed ? (
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.upgradeButton}
          onPress={() =>
            navigation.navigate("Paywall", { coach: "Focus Coach", source: "home" })
          }
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
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
                {isSubscribed ? "Edit Coach" : "🔒 Edit Coach (Register required)"}
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
  topSection: {
    marginBottom: 20,
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#64748b",
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
    maxWidth: 360,
  },
  cardList: {
    gap: 14,
  },
  upgradeButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    marginBottom: 18,
  },
  upgradeButtonText: {
    color: "#1e293b",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardMainButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardText: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "600",
    color: "#0f172a",
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },
  moreButton: {
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 999,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  moreButtonText: {
    color: "#334155",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
    padding: 20,
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  menuTitle: {
    fontSize: 17,
    lineHeight: 22,
    color: "#111827",
    fontWeight: "600",
  },
  menuAction: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d9e6",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuActionText: {
    color: "#1f2937",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
  menuHint: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 19,
  },
});
