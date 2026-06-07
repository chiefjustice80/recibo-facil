import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, X } from "lucide-react-native";

import { colors, fonts, radius, spacing } from "@/src/theme";
import { AppText, Button } from "./ui";
import { fromISODate, toISODate, formatDisplayDate } from "@/src/utils/dates";

interface AppInputProps extends TextInputProps {
  testID?: string;
}

export function AppInput({ style, testID, ...rest }: AppInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      testID={testID}
      placeholderTextColor={colors.textMuted}
      style={[styles.input, focused && styles.inputFocused, style]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...rest}
    />
  );
}

interface DateFieldProps {
  value: string | null;
  onChange: (iso: string | null) => void;
  locale?: string;
  placeholder?: string;
  clearable?: boolean;
  testID?: string;
}

export function DateField({
  value,
  onChange,
  locale = "en",
  placeholder,
  clearable = true,
  testID,
}: DateFieldProps) {
  const [show, setShow] = useState(false);
  const current = fromISODate(value) ?? new Date();

  // Web preview: the native picker is unavailable — accept typed YYYY-MM-DD.
  if (Platform.OS === "web") {
    return (
      <TextInput
        testID={testID}
        value={value ?? ""}
        onChangeText={(txt) => onChange(txt.trim() ? txt.trim() : null)}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
    );
  }

  const open = () => setShow(true);

  const handleChange = (event: { type: string }, selected?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
      if (event.type === "set" && selected) onChange(toISODate(selected));
      return;
    }
    if (selected) onChange(toISODate(selected));
  };

  return (
    <>
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.8}
        onPress={open}
        style={styles.dateBtn}
      >
        <Calendar size={18} color={colors.primary} strokeWidth={1.8} />
        <AppText
          variant="bodyMedium"
          color={value ? colors.textPrimary : colors.textMuted}
          style={styles.dateText}
        >
          {value ? formatDisplayDate(value, locale) : placeholder || "—"}
        </AppText>
        {value && clearable ? (
          <TouchableOpacity
            onPress={() => onChange(null)}
            hitSlop={10}
            testID={`${testID}-clear`}
          >
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      {show && Platform.OS === "android" && (
        <DateTimePicker
          value={current}
          mode="date"
          display="calendar"
          onChange={handleChange}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={show} transparent animationType="slide">
          <View style={styles.iosBackdrop}>
            <View style={styles.iosSheet}>
              <DateTimePicker
                value={current}
                mode="date"
                display="spinner"
                onChange={handleChange}
              />
              <Button label="OK" onPress={() => setShow(false)} />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.sm + 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === "ios" ? 16 : 13,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputFocused: { borderColor: colors.primary },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.inputBg,
    borderRadius: radius.sm + 4,
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  dateText: { flex: 1 },
  iosBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay },
  iosSheet: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.md,
  },
});
