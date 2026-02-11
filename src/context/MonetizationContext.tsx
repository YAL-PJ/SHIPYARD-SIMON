import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCustomerInfoSafe,
  initializeRevenueCat,
  presentCustomerCenter,
  presentPaywallIfNeeded,
  refreshSubscriptionStatus,
  restoreSubscription,
} from "../monetization/revenuecat";

type MonetizationContextValue = {
  initialized: boolean;
  isSubscribed: boolean;
  isPurchasing: boolean;
  customerInfoSnapshot: string | null;
  refreshStatus: () => Promise<boolean>;
  purchase: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  openCustomerCenter: () => Promise<boolean>;
};

const MonetizationContext = createContext<MonetizationContextValue | undefined>(
  undefined,
);

type Props = {
  children: ReactNode;
};

const formatCustomerInfoSnapshot = (customerInfo: unknown) => {
  if (!customerInfo) {
    return null;
  }

  try {
    return JSON.stringify(customerInfo);
  } catch {
    return null;
  }
};

export const MonetizationProvider = ({ children }: Props) => {
  const [initialized, setInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [customerInfoSnapshot, setCustomerInfoSnapshot] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const result = await initializeRevenueCat();

        if (!isMounted) {
          return;
        }

        setIsSubscribed(result.subscribed);

        const customerInfo = await getCustomerInfoSafe();

        if (!isMounted) {
          return;
        }

        setCustomerInfoSnapshot(formatCustomerInfoSnapshot(customerInfo));
      } finally {
        if (isMounted) {
          setInitialized(true);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshStatus = async () => {
    const subscribed = await refreshSubscriptionStatus();
    setIsSubscribed(subscribed);

    const customerInfo = await getCustomerInfoSafe();
    setCustomerInfoSnapshot(formatCustomerInfoSnapshot(customerInfo));

    return subscribed;
  };

  const purchase = async () => {
    setIsPurchasing(true);

    try {
      const result = await presentPaywallIfNeeded();
      setIsSubscribed(result.subscribed);

      const customerInfo = await getCustomerInfoSafe();
      setCustomerInfoSnapshot(formatCustomerInfoSnapshot(customerInfo));

      return result.subscribed;
    } finally {
      setIsPurchasing(false);
    }
  };

  const restore = async () => {
    const result = await restoreSubscription();
    setIsSubscribed(result.subscribed);

    const customerInfo = await getCustomerInfoSafe();
    setCustomerInfoSnapshot(formatCustomerInfoSnapshot(customerInfo));

    return result.subscribed;
  };

  const openCustomerCenterHandler = async () => presentCustomerCenter();

  return (
    <MonetizationContext.Provider
      value={{
        initialized,
        isSubscribed,
        isPurchasing,
        customerInfoSnapshot,
        refreshStatus,
        purchase,
        restore,
        openCustomerCenter: openCustomerCenterHandler,
      }}
    >
      {children}
    </MonetizationContext.Provider>
  );
};

export const useMonetization = () => {
  const context = useContext(MonetizationContext);

  if (!context) {
    throw new Error("useMonetization must be used within MonetizationProvider");
  }

  return context;
};
