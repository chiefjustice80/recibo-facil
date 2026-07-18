import React from "react";
import { StyleSheet, View } from "react-native";
import { Crown } from "lucide-react-native";

import { AppText, Button } from "@/src/components/ui";
import { FREE_PRODUCT_LIMIT, FREE_RECEIPT_LIMIT } from "@/src/config/limits";
import { useApp } from "@/src/context/AppContext";
import { colors, radius, spacing } from "@/src/theme";

// Shown inside an add-screen when the free limit is reached. Non-destructive:
// it only blocks new entries and points the user to delete/archive or unlock Pro.
export function LimitReached({ onClose }: { onClose: () => void }) {
  const { t } = useApp();
  return (
    <View style={styles.wrap} testID="limit-reached">
      <View style={styles.badge}>
        <Crown size={30} color={colors.secondary} strokeWidth={1.8} />
      </View>
      <AppText variant="h3" style={styles.title}>
        {t("limits.title")}
      </AppText>
      <AppText
        variant="bodyMedium"
        color={colors.textSecondary}
        style={styles.msg}
      >
        {t("limits.message", {
          products: FREE_PRODUCT_LIMIT,
          receipts: FREE_RECEIPT_LIMIT,
        })}
      </AppText>
      <Button testID="limit-ok" label={t("limits.gotIt")} onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  badge: {
    width: 68,
    height: 68,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: { textAlign: "center" },
  msg: { textAlign: "center", lineHeight: 22, marginBottom: spacing.sm },
});
