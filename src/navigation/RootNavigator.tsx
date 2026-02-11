import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { PaywallScreen } from "../screens/PaywallScreen";
import { EditCoachScreen } from "../screens/EditCoachScreen";
import { ProgressScreen } from "../screens/ProgressScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { ReportsScreen } from "../screens/ReportsScreen";
import { MemoryScreen } from "../screens/MemoryScreen";
import { SafetyScreen } from "../screens/SafetyScreen";
import { InsightsScreen } from "../screens/InsightsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Welcome">
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="EditCoach"
        component={EditCoachScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="Memory"
        component={MemoryScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="Safety"
        component={SafetyScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ title: "" }}
      />
    </Stack.Navigator>
  );
};
