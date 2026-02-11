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
};

const COACHES: CoachOption[] = [
  { label: "Focus Coach" },
  { label: "Decision Coach" },
  { label: "Reflection Coach" },
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
      <Text style={styles.title}>What do you need right now?</Text>
      {!isSubscribed ? (
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.upgradeButton}
          onPress={() =>
            navigation.navigate("Paywall", { coach: "Focus Coach", source: "home" })
          }
        >
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
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
              <Text style={styles.cardText}>{coach.label}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`More options for ${coach.label}`}
                style={styles.moreButton}
                onPress={() => setMenuCoach(coach.label)}
              >
                <Text style={styles.moreButtonText}>•••</Text>
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
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 28,
  },
  cardList: {
    gap: 14,
  },
  upgradeButton: {
    position: "absolute",
    right: 24,
    bottom: 24,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "#fff",
  },
  upgradeButtonText: {
    color: "#374151",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#fafafa",
  },
  cardMainButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cardText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "500",
    color: "#111827",
  },
  moreButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#fff",
  },
  moreButtonText: {
    color: "#374151",
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "500",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.35)",
    justifyContent: "flex-end",
    padding: 20,
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
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
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
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
