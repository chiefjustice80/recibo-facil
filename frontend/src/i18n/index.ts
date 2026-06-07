import { I18n } from "i18n-js";
import { getLocales } from "expo-localization";

import { translations } from "./translations";

export type AppLocale = "de" | "pt-BR" | "en";
export const SUPPORTED_LOCALES: AppLocale[] = ["de", "pt-BR", "en"];

export const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = "en";

// Map a device language tag to one of our supported locales.
export function resolveDeviceLocale(): AppLocale {
  try {
    const locales = getLocales();
    for (const l of locales) {
      const code = (l.languageCode || "").toLowerCase();
      const tag = (l.languageTag || "").toLowerCase();
      if (code === "de") return "de";
      if (code === "pt") {
        // Treat all Portuguese variants as pt-BR for this app.
        return "pt-BR";
      }
      if (code === "en") return "en";
      if (tag.startsWith("pt")) return "pt-BR";
    }
  } catch {
    // ignore — fall through to default
  }
  return "en";
}

// "auto" follows the device; otherwise an explicit override is used.
export function applyLocale(pref: AppLocale | "auto"): AppLocale {
  const resolved = pref === "auto" ? resolveDeviceLocale() : pref;
  i18n.locale = resolved;
  return resolved;
}

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
