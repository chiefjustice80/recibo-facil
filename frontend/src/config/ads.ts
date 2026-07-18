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

// Master switch for showing ads. Ad ownership (Organiza Pro / remove_ads) is
// checked separately in AdBanner via the purchase state, so ads disappear
// app-wide once purchased.
export const ADS_ENABLED = true;

// Use Google's TEST ad units in development builds to avoid invalid-traffic
// strikes on the real AdMob account; serve real ads only in production builds.
export const USE_TEST_ADS = __DEV__;

export function shouldShowAds(): boolean {
  return ADS_ENABLED;
}

// Returns the configured production banner unit ID, or null when none is set
// (development / not yet configured). When null, the component falls back to
// Google's official TestIds.BANNER.
export function getProductionBannerUnitId(): string | null {
  const unitId = Constants.expoConfig?.extra?.ads?.bannerUnitId;
  return typeof unitId === "string" && unitId.length > 0 ? unitId : null;
}
