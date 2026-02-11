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
    if (source === "chat") {
      await pauseChatForToday();
    }

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
        <Text style={styles.eyebrow}>MARA PRO</Text>
        <Text style={styles.title}>Upgrade to Pro coaching</Text>
        <Text style={styles.subtitle}>
          Get unlimited chat, persistent memory, and custom coach editing. Cancel anytime from Settings.
        </Text>
        <View style={styles.planList}>
          <View style={styles.planColumn}>
            <Text style={styles.planTitle}>Free</Text>
            <Text style={styles.planMeta}>Great for trying MARA</Text>
            <Text style={styles.planItem}>• 3 coaches</Text>
            <Text style={styles.planItem}>• Daily chat limit</Text>
            <Text style={styles.planItem}>• Context resets</Text>
          </View>
          <View style={[styles.planColumn, styles.planColumnFeatured]}>
            <View style={styles.proHeader}>
              <Text style={styles.planTitle}>Pro</Text>
              <Text style={styles.bestValuePill}>BEST VALUE</Text>
            </View>
            <Text style={styles.planMetaFeatured}>For serious growth</Text>
            <Text style={styles.planItem}>• Unlimited chats</Text>
            <Text style={styles.planItem}>• Edit your coaches</Text>
            <Text style={styles.planItem}>• Persistent context memory</Text>
          </View>
        </View>
        <Text style={styles.trustCopy}>Secure purchase handled by Apple / Google.</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={handlePurchase}
          disabled={isPurchasing}
        >
          <Text style={styles.primaryText}>{isPurchasing ? "Processing..." : "Start Pro"}</Text>
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
          <Text style={styles.dismissText}>Continue on Free</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 22,
    justifyContent: "space-between",
    backgroundColor: "#f1f5f9",
  },
  content: {
    gap: 12,
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    fontWeight: "700",
    color: "#64748b",
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#475569",
    lineHeight: 22,
    maxWidth: 360,
  },
  planList: {
    width: "100%",
    gap: 12,
    marginTop: 12,
  },
  planColumn: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    gap: 6,
  },
  planColumnFeatured: {
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
    shadowColor: "#2563eb",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  proHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bestValuePill: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    color: "#1d4ed8",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#dbeafe",
  },
  planTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  planMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: "#64748b",
    marginBottom: 4,
  },
  planMetaFeatured: {
    fontSize: 13,
    lineHeight: 18,
    color: "#1e40af",
    marginBottom: 4,
    fontWeight: "600",
  },
  planItem: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
  },
  trustCopy: {
    fontSize: 12,
    lineHeight: 16,
    color: "#64748b",
    textAlign: "center",
    marginTop: 2,
  },
  actions: {
    gap: 14,
    paddingBottom: 8,
  },
  primaryButton: {
    backgroundColor: "#0f172a",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  restoreText: {
    color: "#334155",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
  manageText: {
    color: "#334155",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
  restoreHint: {
    color: "#64748b",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 20,
  },
  dismissText: {
    color: "#64748b",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400",
  }
});
