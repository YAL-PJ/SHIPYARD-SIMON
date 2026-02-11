import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useMonetization } from "../context/MonetizationContext";
import { pauseChatForToday } from "../storage/dailyLimit";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

export const PaywallScreen = ({ navigation, route }: Props) => {
  const { coach, source = "chat" } = route.params;
  const {
    purchase,
    restore,
    isPurchasing,
    openCustomerCenter,
  } = useMonetization();
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const closeAndPauseChat = async () => {
    if (source !== "chat") {
      navigation.goBack();
      return;
    }

    await pauseChatForToday();
    navigation.goBack();
  };

  const handlePurchase = async () => {
    setRestoreMessage(null);
    const purchased = await purchase();

    if (purchased) {
      if (source === "edit") {
        navigation.replace("EditCoach", { coach });
        return;
      }

      navigation.navigate("Chat", { coach });
      return;
    }

    await closeAndPauseChat();
  };

  const handleRestore = async () => {
    setRestoreMessage(null);
    const restored = await restore();

    if (restored) {
      if (source === "edit") {
        navigation.replace("EditCoach", { coach });
        return;
      }

      navigation.navigate("Chat", { coach });
      return;
    }

    setRestoreMessage("Not restored right now.");
  };

  const handleOpenCustomerCenter = async () => {
    await openCustomerCenter();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Calm access, when you need it.</Text>
        <Text style={styles.subtitle}>
          Subscribe monthly for pro access to coaching whenever you need clarity.
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={handlePurchase}
          disabled={isPurchasing}
        >
          <Text style={styles.primaryText}>{isPurchasing ? "..." : "Continue"}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={handleRestore}>
          <Text style={styles.restoreText}>Restore purchase</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleOpenCustomerCenter}
        >
          <Text style={styles.manageText}>Manage subscription</Text>
        </TouchableOpacity>
        {restoreMessage ? <Text style={styles.restoreHint}>{restoreMessage}</Text> : null}
        <TouchableOpacity accessibilityRole="button" onPress={closeAndPauseChat}>
          <Text style={styles.dismissText}>Not now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  content: {
    paddingTop: 32,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 22,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  restoreText: {
    color: "#2563eb",
    textAlign: "center",
    fontWeight: "500",
  },
  manageText: {
    color: "#2563eb",
    textAlign: "center",
    fontWeight: "500",
  },
  restoreHint: {
    color: "#6b7280",
    textAlign: "center",
  },
  dismissText: {
    color: "#6b7280",
    textAlign: "center",
    fontWeight: "500",
  }
});
