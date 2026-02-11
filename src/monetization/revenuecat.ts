import { Platform } from "react-native";

export const PRO_ENTITLEMENT_IDENTIFIER =
  process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID ??
  "AI coaching for the moment you feel stuck Pro";
export const MONTHLY_PRODUCT_IDENTIFIER =
  process.env.EXPO_PUBLIC_RC_MONTHLY_PRODUCT_ID ?? "monthly";
export const OFFERING_IDENTIFIER =
  process.env.EXPO_PUBLIC_RC_OFFERING_ID ?? "default";

type PurchasesModule = typeof import("react-native-purchases");

type PurchasesUiModule = {
  PAYWALL_RESULT?: {
    PURCHASED?: string;
    RESTORED?: string;
  };
  default?: {
    presentPaywallIfNeeded: (params: {
      requiredEntitlementIdentifier: string;
      offering?: unknown;
    }) => Promise<unknown>;
    presentCustomerCenter: () => Promise<void>;
  };
};

type EntitlementsCustomerInfo = {
  entitlements: { active: Record<string, unknown> };
};

let purchasesModule: PurchasesModule | null = null;
let purchasesUiModule: PurchasesUiModule | null = null;
let sdkReady = false;

const getPlatformApiKey = () => {
  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  }

  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  }

  return undefined;
};

const loadPurchasesModule = async () => {
  if (purchasesModule) {
    return purchasesModule;
  }

  try {
    purchasesModule = require("react-native-purchases");
  } catch {
    purchasesModule = null;
  }

  return purchasesModule;
};

const loadPurchasesUiModule = async () => {
  if (purchasesUiModule) {
    return purchasesUiModule;
  }

  try {
    purchasesUiModule = require("react-native-purchases-ui");
  } catch {
    purchasesUiModule = null;
  }

  return purchasesUiModule;
};

const hasActiveEntitlement = (customerInfo: EntitlementsCustomerInfo) =>
  typeof customerInfo.entitlements.active[PRO_ENTITLEMENT_IDENTIFIER] !==
  "undefined";

const getPurchasesOfferings = async () => {
  const module = await loadPurchasesModule();

  if (!module || !sdkReady) {
    return null;
  }

  return module.default.getOfferings();
};

const getPreferredOffering = async () => {
  const offerings = await getPurchasesOfferings();

  if (!offerings) {
    return null;
  }

  if (offerings.all && offerings.all[OFFERING_IDENTIFIER]) {
    return offerings.all[OFFERING_IDENTIFIER];
  }

  return offerings.current;
};

const isPurchasesUiSuccessful = (result: unknown, ui: PurchasesUiModule) => {
  if (!ui.PAYWALL_RESULT) {
    return false;
  }

  return (
    result === ui.PAYWALL_RESULT.PURCHASED ||
    result === ui.PAYWALL_RESULT.RESTORED
  );
};

export const initializeRevenueCat = async () => {
  const module = await loadPurchasesModule();

  if (!module) {
    return { ready: false, subscribed: false, reason: "sdk_missing" };
  }

  const apiKey = getPlatformApiKey();

  if (!apiKey) {
    return { ready: false, subscribed: false, reason: "api_key_missing" };
  }

  try {
    module.default.setLogLevel(module.LOG_LEVEL.VERBOSE);
    module.default.configure({ apiKey });
    sdkReady = true;

    const customerInfo = await module.default.getCustomerInfo();

    return {
      ready: true,
      subscribed: hasActiveEntitlement(customerInfo),
    };
  } catch {
    return { ready: false, subscribed: false, reason: "configure_failed" };
  }
};

export const getCustomerInfoSafe = async () => {
  const module = await loadPurchasesModule();

  if (!module || !sdkReady) {
    return null;
  }

  try {
    return await module.default.getCustomerInfo();
  } catch {
    return null;
  }
};

export const refreshSubscriptionStatus = async () => {
  const customerInfo = await getCustomerInfoSafe();

  if (!customerInfo) {
    return false;
  }

  return hasActiveEntitlement(customerInfo);
};

export const purchaseMonthlySubscription = async () => {
  const module = await loadPurchasesModule();

  if (!module || !sdkReady) {
    return { subscribed: false, reason: "sdk_not_ready" };
  }

  try {
    const preferredOffering = await getPreferredOffering();
    const monthlyPackage = preferredOffering?.availablePackages.find(
      (pkg) => pkg.product.identifier === MONTHLY_PRODUCT_IDENTIFIER,
    );

    if (!monthlyPackage) {
      return { subscribed: false, reason: "monthly_not_found" };
    }

    const { customerInfo } = await module.default.purchasePackage(monthlyPackage);

    return {
      subscribed: hasActiveEntitlement(customerInfo),
    };
  } catch (error: unknown) {
    const errorWithCancelled = error as { userCancelled?: boolean };

    return {
      subscribed: false,
      reason: errorWithCancelled.userCancelled
        ? "cancelled"
        : "purchase_failed",
    };
  }
};

export const presentPaywallIfNeeded = async () => {
  const ui = await loadPurchasesUiModule();

  if (!ui?.default || !sdkReady) {
    return purchaseMonthlySubscription();
  }

  try {
    const preferredOffering = await getPreferredOffering();
    const result = await ui.default.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT_IDENTIFIER,
      offering: preferredOffering ?? undefined,
    });

    if (!isPurchasesUiSuccessful(result, ui)) {
      return { subscribed: false, reason: "paywall_dismissed" };
    }

    const subscribed = await refreshSubscriptionStatus();

    return {
      subscribed,
      reason: subscribed ? undefined : "entitlement_missing",
    };
  } catch {
    return {
      subscribed: false,
      reason: "paywall_failed",
    };
  }
};

export const restoreSubscription = async () => {
  const module = await loadPurchasesModule();

  if (!module || !sdkReady) {
    return { subscribed: false, reason: "sdk_not_ready" };
  }

  try {
    const customerInfo = await module.default.restorePurchases();

    return {
      subscribed: hasActiveEntitlement(customerInfo),
    };
  } catch {
    return {
      subscribed: false,
      reason: "restore_failed",
    };
  }
};

export const presentCustomerCenter = async () => {
  const ui = await loadPurchasesUiModule();

  if (!ui?.default || !sdkReady) {
    return false;
  }

  try {
    await ui.default.presentCustomerCenter();
    return true;
  } catch {
    return false;
  }
};
