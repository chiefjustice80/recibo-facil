import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  ScanLine,
  Trash2,
  Search as SearchIcon,
  Refrigerator,
  Snowflake,
  Archive,
  Box,
} from "lucide-react-native";

import { AppText, Button, Chip, Field } from "@/src/components/ui";
import { AppInput, DateField } from "@/src/components/inputs";
import { BarcodeScannerModal } from "@/src/components/BarcodeScannerModal";
import { useApp } from "@/src/context/AppContext";
import { colors, radius, spacing } from "@/src/theme";
import {
  getInventoryItem,
  upsertInventoryItem,
  deleteInventoryItem,
} from "@/src/db/inventory";
import {
  syncInventoryReminders,
  cancelEntityReminders,
} from "@/src/services/notifications";
import { lookupBarcode } from "@/src/services/openFoodFacts";
import { ItemStatus, StorageLocation } from "@/src/db/types";

const LOCATIONS: { value: StorageLocation; Icon: React.ComponentType<any> }[] = [
  { value: "fridge", Icon: Refrigerator },
  { value: "freezer", Icon: Snowflake },
  { value: "pantry", Icon: Archive },
  { value: "other", Icon: Box },
];

const REMINDER_OPTIONS = [0, 1, 3, 7];

export default function InventoryAddScreen() {
  const { t, locale, defaultReminders, refresh } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const editing = !!params.id;

  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState<StorageLocation>("pantry");
  const [expiry, setExpiry] = useState<string | null>(null);
  const [reminders, setReminders] = useState<number[]>(defaultReminders);
  const [status, setStatus] = useState<ItemStatus>("active");

  const [scannerOpen, setScannerOpen] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    (async () => {
      const item = await getInventoryItem(params.id!);
      if (item) {
        setBarcode(item.barcode ?? "");
        setName(item.name);
        setBrand(item.brand ?? "");
        setQuantity(item.quantity ?? "");
        setLocation(item.storage_location);
        setExpiry(item.expiry_date);
        setReminders(item.reminder_offsets);
        setStatus(item.status);
      }
    })();
  }, [params.id]);

  const runLookup = useCallback(
    async (code: string) => {
      if (!code.trim()) return;
      setLookupLoading(true);
      setLookupMsg(null);
      const result = await lookupBarcode(code);
      setLookupLoading(false);
      if (result?.name) {
        if (!name) setName(result.name);
        if (result.brand && !brand) setBrand(result.brand);
        setLookupMsg(t("inventory.productFound"));
      } else {
        setLookupMsg(t("inventory.productNotFound"));
      }
    },
    [name, brand, t],
  );

  const onScanned = useCallback(
    (code: string) => {
      setBarcode(code);
      runLookup(code);
    },
    [runLookup],
  );

  const toggleReminder = (offset: number) => {
    const set = new Set(reminders);
    if (set.has(offset)) set.delete(offset);
    else set.add(offset);
    setReminders(Array.from(set).sort((a, b) => a - b));
  };

  const reminderLabel = (offset: number) => {
    if (offset === 0) return t("reminders.onDay");
    if (offset === 1) return t("reminders.oneDayBefore");
    if (offset === 3) return t("reminders.threeDaysBefore");
    return t("expiry.inDays", { count: offset });
  };

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    const id = await upsertInventoryItem({
      id: params.id,
      barcode: barcode.trim() || null,
      name,
      brand: brand || null,
      quantity: quantity || null,
      storage_location: location,
      expiry_date: expiry,
      status,
      reminder_offsets: reminders,
    });
    const saved = await getInventoryItem(id);
    if (saved) await syncInventoryReminders(saved);
    setSaving(false);
    refresh();
    router.back();
  }, [
    name,
    barcode,
    brand,
    quantity,
    location,
    expiry,
    status,
    reminders,
    params.id,
    refresh,
    router,
  ]);

  const handleDelete = useCallback(() => {
    if (!params.id) return;
    Alert.alert(t("inventory.deleteConfirm"), "", [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await cancelEntityReminders("inventory", params.id!);
          await deleteInventoryItem(params.id!);
          refresh();
          router.back();
        },
      },
    ]);
  }, [params.id, t, refresh, router]);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity testID="inv-close" onPress={() => router.back()} hitSlop={10}>
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="h3">
          {editing ? t("inventory.editProduct") : t("inventory.addProduct")}
        </AppText>
        {editing ? (
          <TouchableOpacity testID="inv-delete" onPress={handleDelete} hitSlop={10}>
            <Trash2 size={22} color={colors.danger} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={90}
      >
        {/* Barcode */}
        <Field label={t("inventory.barcode")} hint={t("common.optional")}>
          <View style={styles.barcodeRow}>
            <AppInput
              testID="inv-barcode"
              value={barcode}
              onChangeText={setBarcode}
              placeholder="—"
              keyboardType="number-pad"
              style={styles.flex1}
            />
            <TouchableOpacity
              testID="inv-scan"
              onPress={() => setScannerOpen(true)}
              style={styles.scanBtn}
              activeOpacity={0.85}
            >
              <ScanLine size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            testID="inv-lookup"
            onPress={() => runLookup(barcode)}
            disabled={!barcode.trim() || lookupLoading}
            style={styles.lookupBtn}
          >
            <SearchIcon size={16} color={colors.primary} />
            <AppText variant="small" color={colors.primary}>
              {lookupLoading ? t("inventory.lookingUp") : t("inventory.lookup")}
            </AppText>
          </TouchableOpacity>
          {lookupMsg ? (
            <AppText variant="small" color={colors.textSecondary} style={styles.lookupMsg}>
              {lookupMsg}
            </AppText>
          ) : null}
        </Field>

        {/* Name */}
        <Field label={`${t("inventory.name")} *`}>
          <AppInput
            testID="inv-name"
            value={name}
            onChangeText={setName}
            placeholder={t("inventory.namePlaceholder")}
          />
        </Field>

        {/* Brand + quantity */}
        <View style={styles.twoCol}>
          <View style={styles.flex1}>
            <Field label={t("inventory.brand")} hint={t("common.optional")}>
              <AppInput testID="inv-brand" value={brand} onChangeText={setBrand} placeholder="—" />
            </Field>
          </View>
          <View style={styles.flex1}>
            <Field label={t("inventory.quantity")} hint={t("common.optional")}>
              <AppInput
                testID="inv-quantity"
                value={quantity}
                onChangeText={setQuantity}
                placeholder={t("inventory.quantityPlaceholder")}
              />
            </Field>
          </View>
        </View>

        {/* Storage location */}
        <Field label={t("inventory.storageLocation")}>
          <View style={styles.chipWrap}>
            {LOCATIONS.map(({ value, Icon }) => {
              const active = location === value;
              return (
                <TouchableOpacity
                  key={value}
                  testID={`inv-location-${value}`}
                  activeOpacity={0.8}
                  onPress={() => setLocation(value)}
                  style={[styles.locChip, active && styles.locChipActive]}
                >
                  <Icon size={17} color={active ? colors.white : colors.primary} strokeWidth={1.8} />
                  <AppText
                    variant="small"
                    color={active ? colors.white : colors.textSecondary}
                  >
                    {t(`locations.${value}`)}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Field>

        {/* Expiry */}
        <Field label={t("inventory.expiryDate")} hint={t("common.optional")}>
          <DateField
            testID="inv-expiry"
            value={expiry}
            onChange={setExpiry}
            locale={locale}
            placeholder={t("inventory.pickDate")}
          />
        </Field>

        {/* Reminders */}
        <Field label={t("inventory.reminders")}>
          <View style={styles.chipWrap}>
            {REMINDER_OPTIONS.map((offset) => (
              <Chip
                key={offset}
                testID={`inv-reminder-${offset}`}
                label={reminderLabel(offset)}
                active={reminders.includes(offset)}
                onPress={() => toggleReminder(offset)}
              />
            ))}
          </View>
        </Field>

        {/* Status (editing only) */}
        {editing ? (
          <Field label={t("inventory.status")}>
            <View style={styles.chipWrap}>
              {(["active", "consumed", "discarded"] as ItemStatus[]).map((s) => (
                <Chip
                  key={s}
                  testID={`inv-status-${s}`}
                  label={t(`statuses.${s}`)}
                  active={status === s}
                  onPress={() => setStatus(s)}
                />
              ))}
            </View>
          </Field>
        ) : null}
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Button
            testID="inv-save"
            label={t("common.save")}
            onPress={handleSave}
            loading={saving}
            disabled={!name.trim()}
          />
        </View>
      </KeyboardStickyView>

      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={onScanned}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
  },
  content: { padding: spacing.screen, paddingBottom: 40 },
  flex1: { flex: 1 },
  barcodeRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  scanBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.sm + 4,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  lookupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  lookupMsg: { marginTop: spacing.xs },
  twoCol: { flexDirection: "row", gap: spacing.md },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  locChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.inputBg,
  },
  locChipActive: { backgroundColor: colors.primary },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
