import { Alert, Platform } from "react-native";

interface ConfirmOptions {
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

// Cross-platform confirm. RN Web does not render multi-button Alert.alert,
// so fall back to window.confirm there; native uses the native dialog.
export function confirmAction(title: string, opts: ConfirmOptions): void {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    if (typeof window !== "undefined" && window.confirm(title)) {
      opts.onConfirm();
    }
    return;
  }
  Alert.alert(title, "", [
    { text: opts.cancelLabel, style: "cancel" },
    {
      text: opts.confirmLabel,
      style: opts.destructive ? "destructive" : "default",
      onPress: opts.onConfirm,
    },
  ]);
}
