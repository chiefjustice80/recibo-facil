import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { colors, fonts, radius, shadow, spacing } from "@/src/theme";

type Variant =
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "bodyMedium"
  | "bodySemi"
  | "caption"
  | "small";

const VARIANT_STYLE: Record<Variant, TextStyle> = {
  h1: { fontFamily: fonts.heading, fontSize: 30, letterSpacing: -0.8 },
  h2: { fontFamily: fonts.headingSemi, fontSize: 23, letterSpacing: -0.4 },
  h3: { fontFamily: fonts.headingSemi, fontSize: 19 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 23 },
  bodySemi: { fontFamily: fonts.bodySemi, fontSize: 16 },
  caption: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  small: { fontFamily: fonts.bodyMedium, fontSize: 13 },
};

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}

export function AppText({
  variant = "body",
  color,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        VARIANT_STYLE[variant],
        { color: color ?? colors.textPrimary },
        style,
      ]}
      {...rest}
    />
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  disabled,
  loading,
  icon,
  style,
  testID,
}: ButtonProps) {
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
        ? colors.danger
        : variant === "secondary"
          ? colors.primarySoft
          : "transparent";
  const fg =
    variant === "primary" || variant === "danger"
      ? colors.white
      : colors.primary;

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bg },
        size === "md" && styles.btnMd,
        variant === "ghost" && styles.btnGhost,
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.btnInner}>
          {icon}
          <Text style={[styles.btnLabel, { color: fg }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

interface ChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  testID?: string;
}

export function Chip({ label, active, onPress, testID }: ChipProps) {
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  testID?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  testID,
}: EmptyStateProps) {
  return (
    <View style={styles.empty} testID={testID}>
      <View style={styles.emptyIcon}>{icon}</View>
      <AppText variant="h3" style={styles.emptyTitle}>
        {title}
      </AppText>
      {description ? (
        <AppText
          variant="body"
          color={colors.textSecondary}
          style={styles.emptyDesc}
        >
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

interface BadgeProps {
  label: string;
  tone?: "neutral" | "danger" | "warning" | "success";
}

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const map = {
    neutral: { bg: colors.inputBg, fg: colors.textSecondary },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    success: { bg: colors.primarySoft, fg: colors.primary },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text style={[styles.badgeText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  btnMd: { height: 46, borderRadius: radius.sm + 4 },
  btnGhost: { borderWidth: 0 },
  btnDisabled: { opacity: 0.5 },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  btnLabel: { fontFamily: fonts.bodySemi, fontSize: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSecondary },
  chipTextActive: { color: colors.white, fontFamily: fonts.bodySemi },
  field: { marginBottom: spacing.lg },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  fieldHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  empty: { alignItems: "center", paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: { textAlign: "center", marginBottom: spacing.xs },
  emptyDesc: { textAlign: "center" },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 12 },
});

export { styles as uiStyles };
