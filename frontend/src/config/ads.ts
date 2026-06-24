// Central AdMob configuration.
//
// IMPORTANT: No production IDs are hardcoded here. During development we always
// use Google's official TEST ad unit IDs (via TestIds.BANNER in the component).
// Real production App IDs live in `app.json` under the top-level
// "react-native-google-mobile-ads" block, and the real banner Ad Unit ID is
// read from `expo.extra.ads.bannerUnitId` (currently null -> use test ads).
//
// To go live later:
//   1. Replace the sample App IDs in app.json with your real AdMob App IDs.
//   2. Set expo.extra.ads.bannerUnitId in app.json to your real banner unit ID.
//   3. Rebuild the app (App IDs are baked into the native build).

import Constants from "expo-constants";

import { isPremium } from "@/src/config/limits";

// Master switch for showing ads. Disabled automatically for Premium users so a
// future in-app purchase can simply flip `isPremium` to remove all ads.
export const ADS_ENABLED = true;

export function shouldShowAds(): boolean {
  return ADS_ENABLED && !isPremium;
}

// Returns the configured production banner unit ID, or null when none is set
// (development / not yet configured). When null, the component falls back to
// Google's official TestIds.BANNER.
export function getProductionBannerUnitId(): string | null {
  const unitId = Constants.expoConfig?.extra?.ads?.bannerUnitId;
  return typeof unitId === "string" && unitId.length > 0 ? unitId : null;
}
