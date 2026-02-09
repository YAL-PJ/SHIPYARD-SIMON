import AsyncStorage from "@react-native-async-storage/async-storage";

const HAS_SEEN_WELCOME_KEY = "shipyard.hasSeenWelcome";
const USER_CONTEXT_KEY = "shipyard.userContext";

let cachedHasSeenWelcome: boolean | null = null;
let cachedUserContext: string | null = null;

export const getHasSeenWelcome = async () => {
  if (cachedHasSeenWelcome !== null) {
    return cachedHasSeenWelcome;
  }

  try {
    const rawValue = await AsyncStorage.getItem(HAS_SEEN_WELCOME_KEY);
    const parsedValue = rawValue === "1";

    cachedHasSeenWelcome = parsedValue;
    return parsedValue;
  } catch {
    return false;
  }
};

export const setHasSeenWelcome = async (value: boolean) => {
  cachedHasSeenWelcome = value;
  await AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, value ? "1" : "0");
};

export const getUserContext = async () => {
  if (cachedUserContext !== null) {
    return cachedUserContext;
  }

  try {
    const rawValue = await AsyncStorage.getItem(USER_CONTEXT_KEY);
    const normalized = rawValue?.trim() ?? "";

    cachedUserContext = normalized;
    return normalized;
  } catch {
    return "";
  }
};

export const setUserContext = async (value: string) => {
  const normalized = value.trim();

  cachedUserContext = normalized;
  await AsyncStorage.setItem(USER_CONTEXT_KEY, normalized);
};
