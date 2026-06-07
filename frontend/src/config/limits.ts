// Monetization is NOT enforced in the MVP. These constants only prepare the
// architecture for a future one-time Premium purchase that lifts the limits.
// To activate enforcement later, flip `ENFORCE_LIMITS` to true and wire a
// purchase flow that sets `isPremium`.

export const ENFORCE_LIMITS = false;

export const FREE_LIMITS = {
  maxInventoryItems: 50,
  maxReceipts: 30,
};

export const PREMIUM_LIMITS = {
  maxInventoryItems: Number.POSITIVE_INFINITY,
  maxReceipts: Number.POSITIVE_INFINITY,
};

// Placeholder — a real implementation would read this from a verified purchase.
export const isPremium = false;

export function getLimits() {
  return isPremium ? PREMIUM_LIMITS : FREE_LIMITS;
}
