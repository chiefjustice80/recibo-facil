import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import mobileAds, {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

import { getProductionBannerUnitId, shouldShowAds } from "@/src/config/ads";
import { colors } from "@/src/theme";

// Initialize the Google Mobile Ads SDK exactly once for the whole app.
let sdkInitStarted = false;
function ensureSdkInitialized() {
  if (sdkInitStarted) return;
  sdkInitStarted = true;
  mobileAds()
    .initialize()
    .catch(() => {
      // SDK init can fail in Expo Go (native module unavailable); ignore.
    });
}

// Use the real production unit ID when configured, otherwise Google's test ID.
const BANNER_UNIT_ID = getProductionBannerUnitId() ?? TestIds.BANNER;

export function AdBanner() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    ensureSdkInitialized();
  }, []);

  if (!shouldShowAds() || failed) return null;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
