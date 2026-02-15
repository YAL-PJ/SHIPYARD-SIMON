import React, { useEffect, useMemo, useState } from "react";
import { NavigationContainer, InitialState } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import * as Updates from "expo-updates";

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

  useEffect(() => {
    const checkForUpdates = async () => {
      if (__DEV__ || !Updates.isEnabled) {
        return;
      }

      try {
        const update = await Updates.checkForUpdateAsync();

        if (!update.isAvailable) {
          return;
        }

        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } catch (error) {
        console.warn("Failed to apply OTA update", error);
      }
    };

    void checkForUpdates();
  }, []);

  const initialState = useMemo<InitialState | undefined>(() => {
    if (!hasSeenWelcome) {
      return undefined;
    }

    return {
      index: 0,
      routes: [{ name: "Home" }],
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
