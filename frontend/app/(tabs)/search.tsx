import React, { useCallback, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search as SearchIcon, X } from "lucide-react-native";

import { AppText } from "@/src/components/ui";
import { AppInput } from "@/src/components/inputs";
import { InventoryRow, ReceiptRow } from "@/src/components/rows";
import { useApp } from "@/src/context/AppContext";
import { colors, spacing } from "@/src/theme";
import { searchInventory } from "@/src/db/inventory";
import { searchReceipts } from "@/src/db/receipts";
import { InventoryItem, Receipt } from "@/src/db/types";

export default function SearchScreen() {
  const { t, locale } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const runSearch = useCallback(async (text: string) => {
    setQuery(text);
    const trimmed = text.trim();
    if (!trimmed) {
      setProducts([]);
      setReceipts([]);
      return;
    }
    const [p, r] = await Promise.all([
      searchInventory(trimmed),
      searchReceipts(trimmed),
    ]);
    setProducts(p);
    setReceipts(r);
  }, []);

  const hasQuery = query.trim().length > 0;
  const hasResults = products.length > 0 || receipts.length > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <AppText variant="h2" style={styles.title}>
          {t("tabs.search")}
        </AppText>
        <View style={styles.searchBar}>
          <SearchIcon size={20} color={colors.textMuted} strokeWidth={1.8} />
          <AppInput
            testID="search-input"
            value={query}
            onChangeText={runSearch}
            placeholder={t("search.placeholder")}
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {hasQuery ? (
            <TouchableOpacity
              testID="search-clear"
              onPress={() => {
                runSearch("");
                Keyboard.dismiss();
              }}
              hitSlop={10}
            >
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {!hasQuery ? (
          <AppText variant="body" color={colors.textMuted} style={styles.hint}>
            {t("search.typeToSearch")}
          </AppText>
        ) : !hasResults ? (
          <AppText variant="body" color={colors.textMuted} style={styles.hint}>
            {t("search.noResults")}
          </AppText>
        ) : (
          <>
            {products.length > 0 && (
              <View style={styles.section}>
                <AppText variant="caption" color={colors.textSecondary}>
                  {t("search.products")}
                </AppText>
                {products.map((item) => (
                  <InventoryRow
                    key={item.id}
                    item={item}
                    testID={`search-product-${item.id}`}
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
            {receipts.length > 0 && (
              <View style={styles.section}>
                <AppText variant="caption" color={colors.textSecondary}>
                  {t("search.receipts")}
                </AppText>
                {receipts.map((r) => (
                  <ReceiptRow
                    key={r.id}
                    receipt={r}
                    locale={locale}
                    testID={`search-receipt-${r.id}`}
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
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.screen, paddingBottom: spacing.md },
  title: { marginBottom: spacing.md },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  content: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl },
  hint: { marginTop: spacing.xl },
  section: { marginTop: spacing.lg, gap: spacing.xs },
});
