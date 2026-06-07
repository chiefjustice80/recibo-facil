import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ScanLine,
  Camera,
  ChevronRight,
  PackageOpen,
  ReceiptText,
} from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { InventoryRow, ReceiptRow } from "@/src/components/rows";
import { useApp } from "@/src/context/AppContext";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { listInventory } from "@/src/db/inventory";
import { listReceipts } from "@/src/db/receipts";
import { daysUntil } from "@/src/utils/dates";
import { InventoryItem, Receipt } from "@/src/db/types";

export default function HomeScreen() {
  const { t, locale, dataVersion } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [expiring, setExpiring] = useState<InventoryItem[]>([]);
  const [recent, setRecent] = useState<Receipt[]>([]);

  const load = useCallback(async () => {
    const items = await listInventory("active");
    const soon = items
      .filter((i) => {
        const d = daysUntil(i.expiry_date);
        return d !== null && d <= 14;
      })
      .slice(0, 8);
    setExpiring(soon);
    const receipts = await listReceipts();
    setRecent(receipts.slice(0, 5));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, dataVersion]),
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="caption" color={colors.secondary}>
          {t("common.appName")}
        </AppText>
        <AppText variant="h1" style={styles.title}>
          {t("home.subtitle")}
        </AppText>

        {/* Two primary actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            testID="home-add-product"
            activeOpacity={0.9}
            onPress={() => router.push("/inventory/add")}
            style={[styles.actionCard, { backgroundColor: colors.primary }]}
          >
            <View style={styles.actionIcon}>
              <ScanLine size={24} color={colors.white} strokeWidth={1.9} />
            </View>
            <AppText
              variant="h3"
              color={colors.white}
              style={styles.actionTitle}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {t("home.scanFood")}
            </AppText>
            <AppText variant="small" color="rgba(255,255,255,0.8)">
              {t("home.scanFoodDesc")}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            testID="home-save-receipt"
            activeOpacity={0.9}
            onPress={() => router.push("/receipts/add")}
            style={[styles.actionCard, { backgroundColor: colors.secondary }]}
          >
            <View style={styles.actionIcon}>
              <Camera size={24} color={colors.white} strokeWidth={1.9} />
            </View>
            <AppText
              variant="h3"
              color={colors.white}
              style={styles.actionTitle}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {t("home.saveReceipt")}
            </AppText>
            <AppText variant="small" color="rgba(255,255,255,0.85)">
              {t("home.saveReceiptDesc")}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Expiring soon */}
        <View style={styles.sectionHeader}>
          <AppText variant="h3">{t("home.expiringSoon")}</AppText>
          <TouchableOpacity
            testID="home-see-inventory"
            onPress={() => router.push("/inventory")}
            style={styles.seeAll}
          >
            <AppText variant="small" color={colors.primary}>
              {t("common.seeAll")}
            </AppText>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {expiring.length === 0 ? (
          <View style={styles.miniEmpty}>
            <PackageOpen size={20} color={colors.textMuted} strokeWidth={1.6} />
            <AppText variant="small" color={colors.textMuted}>
              {t("home.emptyExpiring")}
            </AppText>
          </View>
        ) : (
          <View style={styles.list}>
            {expiring.map((item) => (
              <InventoryRow
                key={item.id}
                item={item}
                testID={`home-expiring-${item.id}`}
                onPress={() =>
                  router.push({
                    pathname: "/inventory/add",
                    params: { id: item.id },
                  })
                }
              />
            ))}
          </View>
        )}

        {/* Recent receipts */}
        <View style={styles.sectionHeader}>
          <AppText variant="h3">{t("home.recentReceipts")}</AppText>
          <TouchableOpacity
            testID="home-see-receipts"
            onPress={() => router.push("/receipts")}
            style={styles.seeAll}
          >
            <AppText variant="small" color={colors.primary}>
              {t("common.seeAll")}
            </AppText>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={styles.miniEmpty}>
            <ReceiptText size={20} color={colors.textMuted} strokeWidth={1.6} />
            <AppText variant="small" color={colors.textMuted}>
              {t("home.emptyReceipts")}
            </AppText>
          </View>
        ) : (
          <View style={styles.list}>
            {recent.map((r) => (
              <ReceiptRow
                key={r.id}
                receipt={r}
                locale={locale}
                testID={`home-receipt-${r.id}`}
                onPress={() =>
                  router.push({
                    pathname: "/receipts/add",
                    params: { id: r.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
  },
  title: { marginTop: spacing.xs, marginBottom: spacing.xl, maxWidth: "90%" },
  actionsRow: { flexDirection: "row", gap: spacing.md },
  actionCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 150,
    justifyContent: "space-between",
    ...shadow.card,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  actionTitle: { marginBottom: 2, fontSize: 18 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  list: { marginTop: spacing.xs },
  miniEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
});
