import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { IapBridge } from "@/src/context/IapBridge";
import { useApp } from "@/src/context/AppContext";
import { storage } from "@/src/utils/storage";

// Single non-consumable product that permanently removes ads.
export const REMOVE_ADS_SKU = "remove_ads";
const KEY_OWNS = "purchase.removeAds";

export interface PurchaseState {
  ready: boolean;
  /** Whether in-app purchases are usable on this platform/build. */
  available: boolean;
  ownsRemoveAds: boolean;
  priceLabel: string | null;
  purchasing: boolean;
  error: string | null;
  buyRemoveAds: () => void;
  restorePurchases: () => void;
}

const PurchaseContext = createContext<PurchaseState | null>(null);

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const { t } = useApp();

  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [ownsRemoveAds, setOwnsState] = useState(false);
  const [priceLabel, setPriceLabel] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionsRef = useRef<{
    buy: () => Promise<void>;
    restore: () => Promise<void>;
  }>({
    buy: async () => {},
    restore: async () => {},
  });

  // Load the persisted entitlement once (works offline / on every platform).
  useEffect(() => {
    (async () => {
      const stored = await storage.getItem<string>(KEY_OWNS, "false");
      setOwnsState(stored === "true");
      setReady(true);
    })();
  }, []);

  const setOwns = useCallback((owned: boolean) => {
    setOwnsState(owned);
    storage.setItem(KEY_OWNS, owned ? "true" : "false");
  }, []);

  const buyRemoveAds = useCallback(() => {
    setError(null);
    actionsRef.current.buy();
  }, []);

  const restorePurchases = useCallback(() => {
    setError(null);
    actionsRef.current.restore();
  }, []);

  const errorTexts = useMemo(
    () => ({
      generic: t("removeAds.errorGeneric"),
      unavailable: t("removeAds.unavailable"),
    }),
    [t],
  );

  const value = useMemo<PurchaseState>(
    () => ({
      ready,
      available,
      ownsRemoveAds,
      priceLabel,
      purchasing,
      error,
      buyRemoveAds,
      restorePurchases,
    }),
    [
      ready,
      available,
      ownsRemoveAds,
      priceLabel,
      purchasing,
      error,
      buyRemoveAds,
      restorePurchases,
    ],
  );

  return (
    <PurchaseContext.Provider value={value}>
      <IapBridge
        sku={REMOVE_ADS_SKU}
        setAvailable={setAvailable}
        setOwns={setOwns}
        setPriceLabel={setPriceLabel}
        setPurchasing={setPurchasing}
        setError={setError}
        errorTexts={errorTexts}
        actionsRef={actionsRef}
      />
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchases(): PurchaseState {
  const ctx = useContext(PurchaseContext);
  if (!ctx)
    throw new Error("usePurchases must be used within PurchaseProvider");
  return ctx;
}
