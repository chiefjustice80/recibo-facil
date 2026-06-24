import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Languages,
  Bell,
  BellOff,
  Crown,
  ShieldCheck,
  Database,
  Check,
} from "lucide-react-native";

import { AppText, Button, Card, Chip } from "@/src/components/ui";
import { useApp } from "@/src/context/AppContext";
import { usePurchases } from "@/src/context/PurchaseContext";
import { colors, radius, spacing } from "@/src/theme";
import { AppLocale } from "@/src/i18n";
import {
  getNotificationStatus,
  requestNotificationPermission,
} from "@/src/services/notifications";

const REMINDER_OPTIONS = [0, 1, 3, 7];

export default function SettingsScreen() {
  const {
    t,
    localePref,
    setLocalePref,
    defaultReminders,
    setDefaultReminders,
  } = useApp();
  const insets = useSafeAreaInsets();
  const {
    available: iapAvailable,
    ownsRemoveAds,
    priceLabel,
    purchasing,
    error: purchaseError,
    buyRemoveAds,
    restorePurchases,
  } = usePurchases();

  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);

  useEffect(() => {
    getNotificationStatus().then((s) => setNotifGranted(s === "granted"));
  }, []);

  const localeOptions: { value: AppLocale | "auto"; label: string }[] = [
    { value: "auto", label: t("settings.languageAuto") },
    { value: "de", label: "Deutsch" },
    { value: "pt-BR", label: "Português (BR)" },
    { value: "en", label: "English" },
  ];

  const toggleReminder = useCallback(
    (offset: number) => {
      const set = new Set(defaultReminders);
      if (set.has(offset)) set.delete(offset);
      else set.add(offset);
      setDefaultReminders(Array.from(set).sort((a, b) => a - b));
    },
    [defaultReminders, setDefaultReminders],
  );

  const reminderLabel = (offset: number) => {
    if (offset === 0) return t("reminders.onDay");
    if (offset === 1) return t("reminders.oneDayBefore");
    if (offset === 3) return t("reminders.threeDaysBefore");
    return t("expiry.inDays", { count: offset });
  };

  const handleNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="h2" style={styles.title}>
          {t("settings.title")}
        </AppText>

        {/* Language */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Languages size={20} color={colors.primary} strokeWidth={1.8} />
            <AppText variant="bodySemi">{t("settings.language")}</AppText>
          </View>
          <View style={styles.optionList}>
            {localeOptions.map((opt) => {
              const active = localePref === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  testID={`settings-locale-${opt.value}`}
                  activeOpacity={0.7}
                  onPress={() => setLocalePref(opt.value)}
                  style={styles.optionRow}
                >
                  <AppText variant="bodyMedium">{opt.label}</AppText>
                  {active ? (
                    <Check size={20} color={colors.primary} strokeWidth={2.2} />
                  ) : (
                    <View style={styles.radioEmpty} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Default reminders */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Bell size={20} color={colors.primary} strokeWidth={1.8} />
            <AppText variant="bodySemi">{t("settings.reminderDefaults")}</AppText>
          </View>
          <View style={styles.chipWrap}>
            {REMINDER_OPTIONS.map((offset) => (
              <Chip
                key={offset}
                testID={`settings-reminder-${offset}`}
                label={reminderLabel(offset)}
                active={defaultReminders.includes(offset)}
                onPress={() => toggleReminder(offset)}
              />
            ))}
          </View>
        </Card>

        {/* Notifications permission */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            {notifGranted ? (
              <Bell size={20} color={colors.primary} strokeWidth={1.8} />
            ) : (
              <BellOff size={20} color={colors.textSecondary} strokeWidth={1.8} />
            )}
            <AppText variant="bodySemi">{t("permissions.notifDesc")}</AppText>
          </View>
          {!notifGranted ? (
            <TouchableOpacity
              testID="settings-enable-notifications"
              onPress={handleNotif}
              style={styles.enableBtn}
              activeOpacity={0.85}
            >
              <AppText variant="bodySemi" color={colors.white}>
                {t("permissions.enableNotif")}
              </AppText>
            </TouchableOpacity>
          ) : (
            <AppText variant="small" color={colors.primary}>
              {t("permissions.notifEnabled")}
            </AppText>
          )}
        </Card>

        {/* Remove ads (one-time in-app purchase) */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Crown size={20} color={colors.secondary} strokeWidth={1.8} />
            <AppText variant="bodySemi">{t("removeAds.title")}</AppText>
          </View>
          {ownsRemoveAds ? (
            <View style={styles.ownedRow}>
              <Check size={18} color={colors.primary} strokeWidth={2.2} />
              <View style={styles.flex1}>
                <AppText variant="bodyMedium" color={colors.primary}>
                  {t("removeAds.owned")}
                </AppText>
                <AppText variant="small" color={colors.textSecondary}>
                  {t("removeAds.ownedDesc")}
                </AppText>
              </View>
            </View>
          ) : (
            <>
              <AppText variant="small" color={colors.textSecondary}>
                {t("removeAds.desc")}
              </AppText>
              {purchaseError ? (
                <AppText variant="small" color={colors.danger}>
                  {purchaseError}
                </AppText>
              ) : null}
              <Button
                testID="settings-remove-ads-buy"
                label={
                  priceLabel
                    ? `${t("removeAds.buy")} · ${priceLabel}`
                    : t("removeAds.buy")
                }
                onPress={buyRemoveAds}
                loading={purchasing}
                disabled={!iapAvailable}
                size="md"
              />
              {iapAvailable ? (
                <Button
                  testID="settings-remove-ads-restore"
                  label={t("removeAds.restore")}
                  onPress={restorePurchases}
                  variant="ghost"
                  size="md"
                  disabled={purchasing}
                />
              ) : (
                <AppText variant="small" color={colors.textMuted}>
                  {t("removeAds.unavailable")}
                </AppText>
              )}
            </>
          )}
        </Card>

        {/* Privacy */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <ShieldCheck size={20} color={colors.primary} strokeWidth={1.8} />
            <AppText variant="bodySemi">{t("settings.privacy")}</AppText>
          </View>
          <AppText variant="small" color={colors.textSecondary}>
            {t("settings.privacyText")}
          </AppText>
        </Card>

        {/* Data & storage */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Database size={20} color={colors.primary} strokeWidth={1.8} />
            <AppText variant="bodySemi">{t("settings.dataStorage")}</AppText>
          </View>
          <AppText variant="small" color={colors.textSecondary}>
            {t("settings.dataStorageText")}
          </AppText>
        </Card>

        <AppText variant="small" color={colors.textMuted} style={styles.about}>
          {t("settings.aboutText")}
        </AppText>
        <AppText variant="small" color={colors.textMuted} style={styles.version}>
          {t("settings.version")} {Constants.expoConfig?.version ?? "1.1.0"}
        </AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl },
  title: { marginBottom: spacing.lg },
  card: { marginBottom: spacing.md, gap: spacing.md },
  flex1: { flex: 1 },
  ownedRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  optionList: { gap: 2 },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  radioEmpty: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  enableBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm + 4,
    paddingVertical: 12,
    alignItems: "center",
  },
  about: { marginTop: spacing.lg, lineHeight: 19 },
  version: { marginTop: spacing.sm },
});
