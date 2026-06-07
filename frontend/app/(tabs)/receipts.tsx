import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, ReceiptText } from "lucide-react-native";

import { AppText, EmptyState } from "@/src/components/ui";
import { ReceiptRow } from "@/src/components/rows";
import { useApp } from "@/src/context/AppContext";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { listReceipts } from "@/src/db/receipts";
import { Receipt } from "@/src/db/types";

export default function ReceiptsScreen() {
  const { t, locale, dataVersion } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<Receipt[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await listReceipts();
    setItems(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, dataVersion]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <AppText variant="h2">{t("receipts.title")}</AppText>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <ReceiptRow
            receipt={item}
            locale={locale}
            testID={`receipt-row-${item.id}`}
            onPress={() =>
              router.push({ pathname: "/receipts/add", params: { id: item.id } })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            testID="receipts-empty"
            icon={<ReceiptText size={32} color={colors.primary} strokeWidth={1.6} />}
            title={t("receipts.empty")}
            description={t("receipts.emptyDesc")}
          />
        }
      />

      <TouchableOpacity
        testID="receipts-fab"
        activeOpacity={0.9}
        onPress={() => router.push("/receipts/add")}
        style={[styles.fab, { bottom: spacing.xl }]}
      >
        <Plus size={26} color={colors.white} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.screen, paddingBottom: spacing.md },
  listContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 120,
    flexGrow: 1,
  },
  fab: {
    position: "absolute",
    right: spacing.screen,
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.floating,
  },
});
