// Free-tier limits. Premium ("Organiza Pro", the `remove_ads` non-consumable
// purchase) lifts these entirely — see `useUsage` which reads the real purchase
// state (`ownsRemoveAds`). Keep values here as the single source of truth.
//
// consumed/discarded products do NOT count towards the active product limit;
// deleted receipts do NOT count towards the receipt limit (both are derived
// from live COUNT queries, so archiving/deleting frees up space immediately).

export const FREE_PRODUCT_LIMIT = 15;
export const FREE_RECEIPT_LIMIT = 10;
