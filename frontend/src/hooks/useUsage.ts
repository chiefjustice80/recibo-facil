import { useCallback, useEffect, useState } from "react";

import { FREE_PRODUCT_LIMIT, FREE_RECEIPT_LIMIT } from "@/src/config/limits";
import { useApp } from "@/src/context/AppContext";
import { usePurchases } from "@/src/context/PurchaseContext";
import { countInventory } from "@/src/db/inventory";
import { countReceipts } from "@/src/db/receipts";

// Central free/premium usage state. Premium is driven by the real purchase
// (`ownsRemoveAds`) — when active, all limits are lifted. Counts refresh
// whenever the shared data version changes (create/edit/delete/status change).
export function useUsage() {
  const { dataVersion } = useApp();
  const { ownsRemoveAds } = usePurchases();
  const isPremium = ownsRemoveAds;

  const [productCount, setProductCount] = useState(0);
  const [receiptCount, setReceiptCount] = useState(0);

  const reload = useCallback(async () => {
    const [p, r] = await Promise.all([countInventory(), countReceipts()]);
    setProductCount(p);
    setReceiptCount(r);
  }, []);

  useEffect(() => {
    reload();
  }, [reload, dataVersion]);

  return {
    isPremium,
    productCount,
    receiptCount,
    productLimit: FREE_PRODUCT_LIMIT,
    receiptLimit: FREE_RECEIPT_LIMIT,
    canAddProduct: isPremium || productCount < FREE_PRODUCT_LIMIT,
    canAddReceipt: isPremium || receiptCount < FREE_RECEIPT_LIMIT,
    reload,
  };
}
