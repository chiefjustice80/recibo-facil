import React, { useRef } from "react";
import {
  Linking,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { X, ScanLine, Camera as CameraIcon } from "lucide-react-native";

import { AppText, Button } from "./ui";
import { useApp } from "@/src/context/AppContext";
import { colors, radius, spacing } from "@/src/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
}

const BARCODE_TYPES = [
  "ean13",
  "ean8",
  "upc_a",
  "upc_e",
  "code128",
  "code39",
  "qr",
] as const;

export function BarcodeScannerModal({ visible, onClose, onScanned }: Props) {
  const { t } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const handledRef = useRef(false);

  const handleScan = ({ data }: { data: string }) => {
    if (handledRef.current) return;
    handledRef.current = true;
    onScanned(data);
    setTimeout(() => {
      handledRef.current = false;
    }, 1500);
    onClose();
  };

  // Web preview has no camera scanning — offer a manual fallback instead.
  if (Platform.OS === "web") {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.fallbackBackdrop}>
          <View style={styles.fallbackCard}>
            <CameraIcon size={28} color={colors.primary} strokeWidth={1.7} />
            <AppText variant="h3" style={styles.fallbackTitle}>
              {t("inventory.scanBarcode")}
            </AppText>
            <AppText variant="small" color={colors.textSecondary} style={styles.fallbackText}>
              {t("permissions.cameraDesc")}
            </AppText>
            <Button label={t("common.close")} variant="secondary" onPress={onClose} />
          </View>
        </View>
      </Modal>
    );
  }

  const renderPermissionState = () => {
    const denied = permission && !permission.granted && !permission.canAskAgain;
    return (
      <View style={styles.permBox}>
        <View style={styles.permIcon}>
          <CameraIcon size={30} color={colors.white} strokeWidth={1.7} />
        </View>
        <AppText variant="h3" color={colors.white} style={styles.permTitle}>
          {t("permissions.cameraTitle")}
        </AppText>
        <AppText variant="body" color="rgba(255,255,255,0.85)" style={styles.permText}>
          {denied ? t("permissions.cameraDenied") : t("permissions.cameraDesc")}
        </AppText>
        {denied ? (
          <Button
            testID="scanner-open-settings"
            label={t("permissions.openSettings")}
            onPress={() => Linking.openSettings()}
            style={styles.permBtn}
          />
        ) : (
          <Button
            testID="scanner-grant"
            label={t("permissions.grant")}
            onPress={requestPermission}
            style={styles.permBtn}
          />
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
            onBarcodeScanned={handleScan}
          />
        ) : (
          renderPermissionState()
        )}

        {permission?.granted ? (
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.frame}>
              <ScanLine size={40} color={colors.white} strokeWidth={1.5} />
            </View>
            <AppText variant="bodyMedium" color={colors.white} style={styles.scanHint}>
              {t("inventory.scanBarcode")}
            </AppText>
          </View>
        ) : null}

        <TouchableOpacity
          testID="scanner-close"
          onPress={onClose}
          style={styles.closeBtn}
          hitSlop={12}
        >
          <X size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  frame: {
    width: 240,
    height: 160,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanHint: { textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 6 },
  closeBtn: {
    position: "absolute",
    top: 56,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  permBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  permIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  permTitle: { marginBottom: spacing.sm },
  permText: { textAlign: "center", marginBottom: spacing.xl },
  permBtn: { alignSelf: "stretch" },
  fallbackBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.overlay,
  },
  fallbackCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  fallbackTitle: { marginTop: spacing.xs },
  fallbackText: { textAlign: "center", marginBottom: spacing.sm },
});
