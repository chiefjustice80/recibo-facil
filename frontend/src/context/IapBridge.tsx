import React, { useEffect } from "react";
import {
  useIAP,
  finishTransaction,
  ErrorCode,
  type Purchase,
  type PurchaseError,
} from "react-native-iap";

export interface IapBridgeProps {
  sku: string;
  setAvailable: (value: boolean) => void;
  setOwns: (value: boolean) => void;
  setPriceLabel: (value: string | null) => void;
  setPurchasing: (value: boolean) => void;
  setError: (value: string | null) => void;
  errorTexts: { generic: string; unavailable: string };
  actionsRef: React.MutableRefObject<{
    buy: () => Promise<void>;
    restore: () => Promise<void>;
  }>;
}

// Native bridge: drives the Google Play / App Store billing flow via react-native-iap
// and reports state back up to the PurchaseProvider. Designed to be defensive so a
// missing store product never crashes the app.
export function IapBridge({
  sku,
  setAvailable,
  setOwns,
  setPriceLabel,
  setPurchasing,
  setError,
  errorTexts,
  actionsRef,
}: IapBridgeProps) {
  const {
    connected,
    products,
    availablePurchases,
    fetchProducts,
    requestPurchase,
    getAvailablePurchases,
  } = useIAP({
    onPurchaseSuccess: (purchase: Purchase) => {
      if (purchase.productId !== sku) return;
      finishTransaction({ purchase, isConsumable: false }).catch(() => {});
      setOwns(true);
      setPurchasing(false);
      setError(null);
    },
    onPurchaseError: (error: PurchaseError) => {
      setPurchasing(false);
      if (error.code === ErrorCode.UserCancelled) {
        setError(null);
        return;
      }
      if (error.code === ErrorCode.AlreadyOwned) {
        setOwns(true);
        setError(null);
        return;
      }
      setError(error.message ?? errorTexts.generic);
    },
    onError: () => {
      // Non-purchase errors (fetch/restore). Keep app stable, ignore.
    },
  });

  // Once connected: mark IAP available, load the product and any prior purchases.
  useEffect(() => {
    if (!connected) return;
    setAvailable(true);
    fetchProducts({ skus: [sku], type: "in-app" }).catch(() => {});
    getAvailablePurchases().catch(() => {});
  }, [connected, sku, fetchProducts, getAvailablePurchases, setAvailable]);

  // Reflect the localized price once the product loads.
  useEffect(() => {
    const product = products.find((p) => p.id === sku);
    if (product) setPriceLabel(product.displayPrice ?? null);
  }, [products, sku, setPriceLabel]);

  // Auto-detect ownership from restored / existing purchases.
  useEffect(() => {
    if (availablePurchases.some((p) => p.productId === sku)) {
      setOwns(true);
    }
  }, [availablePurchases, sku, setOwns]);

  // Register the imperative buy / restore handlers used by the provider.
  useEffect(() => {
    actionsRef.current.buy = async () => {
      const product = products.find((p) => p.id === sku);
      if (!connected || !product) {
        setError(errorTexts.unavailable);
        return;
      }
      setError(null);
      setPurchasing(true);
      try {
        await requestPurchase({
          request: { apple: { sku }, google: { skus: [sku] } },
          type: "in-app",
        });
      } catch {
        setPurchasing(false);
        setError(errorTexts.generic);
      }
    };

    actionsRef.current.restore = async () => {
      if (!connected) {
        setError(errorTexts.unavailable);
        return;
      }
      setError(null);
      setPurchasing(true);
      try {
        await getAvailablePurchases();
      } catch {
        // ignore; ownership is reflected reactively if found
      }
      setPurchasing(false);
    };
  }, [
    connected,
    products,
    sku,
    requestPurchase,
    getAvailablePurchases,
    actionsRef,
    setError,
    setPurchasing,
    errorTexts,
  ]);

  return null;
}
