import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

  const handleEditCoach = (coach: CoachLabel) => {
    if (!isSubscribed) {
      navigation.navigate("Paywall", { coach, source: "edit" });
      return;
    }

    navigation.navigate("EditCoach", { coach });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you need right now?</Text>
      <View style={styles.cardList}>
        {COACHES.map((coach) => (
          <View key={coach.label} style={styles.card}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.navigate("Chat", { coach: coach.label })}
            >
              <Text style={styles.cardText}>{coach.label}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.editButton}
              onPress={() => handleEditCoach(coach.label)}
            >
              <Text style={styles.editButtonText}>Edit Coach</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
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
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#fafafa",
    gap: 14,
  },
  cardText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "500",
    color: "#111827",
  },
  editButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#fff",
  },
  editButtonText: {
    color: "#374151",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
});
