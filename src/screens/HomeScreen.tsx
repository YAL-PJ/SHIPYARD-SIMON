import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const COACHES = [
  { label: "Focus Coach" },
  { label: "Decision Coach" },
  { label: "Reflection Coach" },
];

export const HomeScreen = ({ navigation }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you need right now?</Text>
      <View style={styles.cardList}>
        {COACHES.map((coach) => (
          <TouchableOpacity
            key={coach.label}
            style={styles.card}
            accessibilityRole="button"
            onPress={() => navigation.navigate("Chat", { coach: coach.label })}
          >
            <Text style={styles.cardText}>{coach.label}</Text>
          </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 24,
  },
  cardList: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 20,
    backgroundColor: "#f9fafb",
  },
  cardText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
});
