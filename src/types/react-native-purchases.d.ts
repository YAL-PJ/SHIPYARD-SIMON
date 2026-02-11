declare module "react-native-purchases" {
  export enum LOG_LEVEL {
    VERBOSE = "VERBOSE",
  }

  export type CustomerInfo = {
    entitlements: {
      active: Record<string, unknown>;
    };
  };

  export type StoreProduct = {
    identifier: string;
  };

  export type PurchasesPackage = {
    identifier: string;
    product: StoreProduct;
  };

  export type Offering = {
    identifier: string;
    availablePackages: PurchasesPackage[];
  };

  export type Offerings = {
    all: Record<string, Offering>;
    current: Offering | null;
  };

  type Purchases = {
    setLogLevel: (level: LOG_LEVEL) => void;
    configure: (params: { apiKey: string }) => void;
    getCustomerInfo: () => Promise<CustomerInfo>;
    getOfferings: () => Promise<Offerings>;
    purchasePackage: (
      pkg: PurchasesPackage,
    ) => Promise<{ customerInfo: CustomerInfo }>;
    restorePurchases: () => Promise<CustomerInfo>;
  };

  const purchases: Purchases;
  export default purchases;
}

declare module "react-native-purchases-ui" {
  export enum PAYWALL_RESULT {
    NOT_PRESENTED = "NOT_PRESENTED",
    CANCELLED = "CANCELLED",
    ERROR = "ERROR",
    PURCHASED = "PURCHASED",
    RESTORED = "RESTORED",
  }

  const RevenueCatUI: {
    presentPaywallIfNeeded: (params: {
      requiredEntitlementIdentifier: string;
      offering?: unknown;
    }) => Promise<PAYWALL_RESULT | string>;
    presentCustomerCenter: () => Promise<void>;
  };

  export default RevenueCatUI;
}
