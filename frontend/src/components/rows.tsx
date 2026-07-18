import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import {
  Refrigerator,
  Snowflake,
  Archive,
  Box,
  MapPin,
  ReceiptText,
  ShieldCheck,
} from "lucide-react-native";

import { colors, radius, spacing } from "@/src/theme";
import { AppText, Badge } from "./ui";
import { InventoryItem, Receipt, StorageLocation } from "@/src/db/types";
import { relativeLabel, urgency, formatDisplayDate } from "@/src/utils/dates";
import { useApp } from "@/src/context/AppContext";

const LOCATION_ICON: Record<StorageLocation, React.ComponentType<any>> = {
  fridge: Refrigerator,
  freezer: Snowflake,
  pantry: Archive,
  other: Box,
  custom: MapPin,
};

function urgencyTone(iso: string | null): "neutral" | "danger" | "warning" | "success" {
  const u = urgency(iso);
  if (u === "expired") return "danger";
  if (u === "soon") return "warning";
  if (u === "ok") return "success";
  return "neutral";
}

interface InventoryRowProps {
  item: InventoryItem;
  onPress: () => void;
  testID?: string;
}

export function InventoryRow({ item, onPress, testID }: InventoryRowProps) {
  const { t } = useApp();
  const Icon = LOCATION_ICON[item.storage_location] || Box;
  const subtitleParts = [
    item.storage_location === "custom" && item.custom_location
      ? item.custom_location
      : t(`locations.${item.storage_location}`),
    item.quantity ? `· ${item.quantity}` : null,
    item.brand ? `· ${item.brand}` : null,
  ].filter(Boolean);

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.iconCircle}>
        <Icon size={20} color={colors.primary} strokeWidth={1.8} />
      </View>
      <View style={styles.rowBody}>
        <AppText variant="bodySemi" numberOfLines={1}>
          {item.name}
        </AppText>
        <AppText
          variant="small"
          color={colors.textSecondary}
          numberOfLines={1}
        >
          {subtitleParts.join(" ")}
        </AppText>
      </View>
      <Badge label={relativeLabel(item.expiry_date)} tone={urgencyTone(item.expiry_date)} />
    </TouchableOpacity>
  );
}

interface ReceiptRowProps {
  receipt: Receipt;
  locale?: string;
  onPress: () => void;
  testID?: string;
}

export function ReceiptRow({ receipt, locale = "en", onPress, testID }: ReceiptRowProps) {
  const { t } = useApp();
  const subtitleParts = [
    receipt.merchant,
    receipt.purchase_date ? formatDisplayDate(receipt.purchase_date, locale) : null,
  ].filter(Boolean);

  const amountLabel =
    receipt.amount != null
      ? `${receipt.amount.toFixed(2)}${receipt.currency ? " " + receipt.currency : ""}`
      : null;

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.row}
    >
      {receipt.image_path ? (
        <Image
          source={{ uri: receipt.image_path }}
          style={styles.thumb}
          contentFit="cover"
          transition={120}
        />
      ) : (
        <View style={styles.iconCircle}>
          <ReceiptText size={20} color={colors.primary} strokeWidth={1.8} />
        </View>
      )}
      <View style={styles.rowBody}>
        <AppText variant="bodySemi" numberOfLines={1}>
          {receipt.title}
        </AppText>
        <AppText variant="small" color={colors.textSecondary} numberOfLines={1}>
          {subtitleParts.length ? subtitleParts.join(" · ") : t("receipts.noPhoto")}
        </AppText>
      </View>
      <View style={styles.rowRight}>
        {amountLabel ? (
          <AppText variant="bodySemi" color={colors.textPrimary}>
            {amountLabel}
          </AppText>
        ) : null}
        {receipt.warranty_until ? (
          <View style={styles.warrantyTag}>
            <ShieldCheck size={13} color={colors.primary} strokeWidth={2} />
            <AppText variant="small" color={colors.primary}>
              {formatDisplayDate(receipt.warranty_until, locale)}
            </AppText>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.inputBg,
  },
  rowBody: { flex: 1, gap: 3 },
  rowRight: { alignItems: "flex-end", gap: 4 },
  warrantyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
