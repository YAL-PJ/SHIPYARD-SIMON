import React, { useEffect, useMemo, useState } from "react";
import { NavigationContainer, InitialState } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { MonetizationProvider } from "./src/context/MonetizationContext";
import { getHasSeenWelcome } from "./src/storage/preferences";

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const nextHasSeenWelcome = await getHasSeenWelcome();

      if (!isMounted) {
        return;
      }

      setHasSeenWelcome(nextHasSeenWelcome);
      setIsReady(true);
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const initialState = useMemo<InitialState | undefined>(() => {
    if (!hasSeenWelcome) {
      return undefined;
    }

    return {
      index: 1,
      routes: [
        { name: "Home" },
        { name: "Chat", params: { coach: "Focus Coach" } },
      ],
    };
  }, [hasSeenWelcome]);

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingScreen} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <MonetizationProvider>
        <NavigationContainer initialState={initialState}>
          <RootNavigator />
        </NavigationContainer>
      </MonetizationProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
