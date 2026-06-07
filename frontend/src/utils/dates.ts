import { t } from "../i18n";

// Lightweight date helpers. Dates are stored as ISO "YYYY-MM-DD" strings.

export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso?: string | null): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// Whole days between today and the target date (negative = in the past).
export function daysUntil(iso?: string | null): number | null {
  const target = fromISODate(iso);
  if (!target) return null;
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// Localized, human relative label e.g. "Today", "in 3 days", "Expired".
export function relativeLabel(iso?: string | null): string {
  const d = daysUntil(iso);
  if (d === null) return t("inventory.noExpiry");
  if (d < 0) return t("expiry.expired");
  if (d === 0) return t("expiry.today");
  if (d === 1) return t("expiry.tomorrow");
  return t("expiry.inDays", { count: d });
}

// Localized "when" phrase used inside notification bodies.
export function whenLabel(iso?: string | null): string {
  const d = daysUntil(iso);
  if (d === null) return "";
  if (d <= 0) return t("expiry.today").toLowerCase();
  if (d === 1) return t("expiry.tomorrow").toLowerCase();
  return t("expiry.inDays", { count: d });
}

export function formatDisplayDate(iso?: string | null, locale = "en"): string {
  const d = fromISODate(iso);
  if (!d) return "—";
  try {
    return d.toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso || "—";
  }
}

// Urgency bucket used for color coding lists.
export function urgency(iso?: string | null): "expired" | "soon" | "ok" | "none" {
  const d = daysUntil(iso);
  if (d === null) return "none";
  if (d < 0) return "expired";
  if (d <= 3) return "soon";
  return "ok";
}
