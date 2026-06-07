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
import { Plus, PackageOpen } from "lucide-react-native";

import { AppText, Chip, EmptyState } from "@/src/components/ui";
import { InventoryRow } from "@/src/components/rows";
import { useApp } from "@/src/context/AppContext";
import { colors, radius, shadow, spacing } from "@/src/theme";
import { listInventory } from "@/src/db/inventory";
import { InventoryItem, ItemStatus } from "@/src/db/types";

export default function InventoryScreen() {
  const { t, dataVersion } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState<ItemStatus>("active");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await listInventory(status);
    setItems(data);
  }, [status]);

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

  const statuses: ItemStatus[] = ["active", "consumed", "discarded"];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <AppText variant="h2">{t("inventory.title")}</AppText>
      </View>

      <View style={styles.filters}>
        {statuses.map((s) => (
          <Chip
            key={s}
            testID={`inventory-filter-${s}`}
            label={t(`statuses.${s}`)}
            active={status === s}
            onPress={() => setStatus(s)}
          />
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <InventoryRow
            item={item}
            testID={`inventory-row-${item.id}`}
            onPress={() =>
              router.push({ pathname: "/inventory/add", params: { id: item.id } })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            testID="inventory-empty"
            icon={<PackageOpen size={32} color={colors.primary} strokeWidth={1.6} />}
            title={t("inventory.empty")}
            description={t("inventory.emptyDesc")}
          />
        }
      />

      <TouchableOpacity
        testID="inventory-fab"
        activeOpacity={0.9}
        onPress={() => router.push("/inventory/add")}
        style={[styles.fab, { bottom: spacing.xl }]}
      >
        <Plus size={26} color={colors.white} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
  },
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
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.floating,
  },
});
