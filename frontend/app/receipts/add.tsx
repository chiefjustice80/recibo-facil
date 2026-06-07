import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Trash2, Camera, ImageIcon } from "lucide-react-native";

import { AppText, Button, Field } from "@/src/components/ui";
import { AppInput, DateField } from "@/src/components/inputs";
import { useApp } from "@/src/context/AppContext";
import { colors, radius, spacing } from "@/src/theme";
import {
  getReceipt,
  upsertReceipt,
  deleteReceipt,
  setReceiptImage,
} from "@/src/db/receipts";
import {
  syncReceiptReminders,
  cancelAllReceiptReminders,
} from "@/src/services/notifications";
import { saveReceiptImage, deleteFiles } from "@/src/services/fileStorage";
import { confirmAction } from "@/src/utils/confirm";

function defaultCurrency(locale: string): string {
  if (locale === "de") return "EUR";
  if (locale === "pt-BR") return "BRL";
  return "EUR";
}

export default function ReceiptAddScreen() {
  const { t, locale, refresh } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const editing = !!params.id;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [merchant, setMerchant] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency(locale));
  const [category, setCategory] = useState("");
  const [warranty, setWarranty] = useState<string | null>(null);
  const [returnUntil, setReturnUntil] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    (async () => {
      const r = await getReceipt(params.id!);
      if (r) {
        setImageUri(r.image_path ?? null);
        setOriginalImage(r.image_path ?? null);
        setTitle(r.title);
        setMerchant(r.merchant ?? "");
        setPurchaseDate(r.purchase_date);
        setAmount(r.amount != null ? String(r.amount) : "");
        setCurrency(r.currency ?? defaultCurrency(locale));
        setCategory(r.category ?? "");
        setWarranty(r.warranty_until);
        setReturnUntil(r.return_until);
        setNotes(r.notes ?? "");
      }
    })();
  }, [params.id, locale]);

  const handleCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      if (!perm.canAskAgain) {
        Alert.alert(t("permissions.cameraDenied"), "", [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("permissions.openSettings"), onPress: () => Linking.openSettings() },
        ]);
      }
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets?.[0]) setImageUri(res.assets[0].uri);
  }, [t]);

  const handleGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      if (!perm.canAskAgain) {
        Alert.alert(t("permissions.cameraDenied"), "", [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("permissions.openSettings"), onPress: () => Linking.openSettings() },
        ]);
      }
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.6,
      mediaTypes: ["images"],
    });
    if (!res.canceled && res.assets?.[0]) setImageUri(res.assets[0].uri);
  }, [t]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    setSaving(true);
    const parsedAmount = amount.trim()
      ? parseFloat(amount.replace(",", "."))
      : null;

    const id = await upsertReceipt({
      id: params.id,
      title,
      merchant: merchant || null,
      purchase_date: purchaseDate,
      amount: Number.isFinite(parsedAmount as number) ? parsedAmount : null,
      currency: currency || null,
      category: category || null,
      warranty_until: warranty,
      return_until: returnUntil,
      notes: notes || null,
    });

    // Persist a new photo into app storage (path only is stored in DB).
    if (imageUri && imageUri !== originalImage) {
      const savedPath = await saveReceiptImage(imageUri);
      await setReceiptImage(id, savedPath);
      if (originalImage) await deleteFiles([originalImage]);
    }

    const saved = await getReceipt(id);
    if (saved) await syncReceiptReminders(saved);
    setSaving(false);
    refresh();
    router.back();
  }, [
    title,
    merchant,
    purchaseDate,
    amount,
    currency,
    category,
    warranty,
    returnUntil,
    notes,
    imageUri,
    originalImage,
    params.id,
    refresh,
    router,
  ]);

  const handleDelete = useCallback(() => {
    if (!params.id) return;
    confirmAction(t("receipts.deleteConfirm"), {
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      destructive: true,
      onConfirm: async () => {
        await cancelAllReceiptReminders(params.id!);
        const paths = await deleteReceipt(params.id!);
        await deleteFiles(paths);
        refresh();
        router.back();
      },
    });
  }, [params.id, t, refresh, router]);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity testID="rec-close" onPress={() => router.back()} hitSlop={10}>
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="h3">
          {editing ? t("receipts.editReceipt") : t("receipts.addReceipt")}
        </AppText>
        {editing ? (
          <TouchableOpacity testID="rec-delete" onPress={handleDelete} hitSlop={10}>
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
        {/* Photo */}
        <Field label={t("receipts.photo")}>
          {imageUri ? (
            <TouchableOpacity
              testID="rec-photo-preview"
              activeOpacity={0.9}
              onPress={handleCamera}
            >
              <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
            </TouchableOpacity>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity
                testID="rec-take-photo"
                onPress={handleCamera}
                style={styles.photoBtn}
                activeOpacity={0.85}
              >
                <Camera size={22} color={colors.primary} strokeWidth={1.8} />
                <AppText variant="small" color={colors.primary}>
                  {t("receipts.takePhoto")}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                testID="rec-choose-photo"
                onPress={handleGallery}
                style={styles.photoBtn}
                activeOpacity={0.85}
              >
                <ImageIcon size={22} color={colors.primary} strokeWidth={1.8} />
                <AppText variant="small" color={colors.primary}>
                  {t("receipts.choosePhoto")}
                </AppText>
              </TouchableOpacity>
            </View>
          )}
        </Field>

        {/* Title */}
        <Field label={`${t("receipts.receiptTitle")} *`}>
          <AppInput
            testID="rec-title"
            value={title}
            onChangeText={setTitle}
            placeholder={t("receipts.titlePlaceholder")}
          />
        </Field>

        {/* Merchant */}
        <Field label={t("receipts.merchant")} hint={t("common.optional")}>
          <AppInput
            testID="rec-merchant"
            value={merchant}
            onChangeText={setMerchant}
            placeholder={t("receipts.merchantPlaceholder")}
          />
        </Field>

        {/* Purchase date + amount */}
        <View style={styles.twoCol}>
          <View style={styles.flex1}>
            <Field label={t("receipts.purchaseDate")} hint={t("common.optional")}>
              <DateField
                testID="rec-purchase-date"
                value={purchaseDate}
                onChange={setPurchaseDate}
                locale={locale}
                placeholder={t("inventory.pickDate")}
              />
            </Field>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.flex2}>
            <Field label={t("receipts.amount")} hint={t("common.optional")}>
              <AppInput
                testID="rec-amount"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </Field>
          </View>
          <View style={styles.flex1}>
            <Field label={t("receipts.currency")}>
              <AppInput
                testID="rec-currency"
                value={currency}
                onChangeText={setCurrency}
                autoCapitalize="characters"
                maxLength={3}
              />
            </Field>
          </View>
        </View>

        {/* Category */}
        <Field label={t("receipts.category")} hint={t("common.optional")}>
          <AppInput
            testID="rec-category"
            value={category}
            onChangeText={setCategory}
            placeholder={t("receipts.categoryPlaceholder")}
          />
        </Field>

        {/* Warranty + return */}
        <Field label={t("receipts.warrantyUntil")} hint={t("common.optional")}>
          <DateField
            testID="rec-warranty"
            value={warranty}
            onChange={setWarranty}
            locale={locale}
            placeholder={t("inventory.pickDate")}
          />
        </Field>
        <Field label={t("receipts.returnUntil")} hint={t("common.optional")}>
          <DateField
            testID="rec-return"
            value={returnUntil}
            onChange={setReturnUntil}
            locale={locale}
            placeholder={t("inventory.pickDate")}
          />
        </Field>

        {/* Notes */}
        <Field label={t("receipts.notes")} hint={t("common.optional")}>
          <AppInput
            testID="rec-notes"
            value={notes}
            onChangeText={setNotes}
            placeholder={t("receipts.notesPlaceholder")}
            multiline
            style={styles.notes}
          />
        </Field>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Button
            testID="rec-save"
            label={t("common.save")}
            onPress={handleSave}
            loading={saving}
            disabled={!title.trim()}
          />
        </View>
      </KeyboardStickyView>
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
  flex2: { flex: 2 },
  twoCol: { flexDirection: "row", gap: spacing.md },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: radius.md,
    backgroundColor: colors.inputBg,
  },
  photoButtons: { flexDirection: "row", gap: spacing.md },
  photoBtn: {
    flex: 1,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notes: { minHeight: 90, textAlignVertical: "top", paddingTop: 14 },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
