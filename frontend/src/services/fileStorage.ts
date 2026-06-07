import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import { genId } from "../db/database";

// Receipt photos live in the app's private document directory. Only the path
// is stored in SQLite — never the binary. On web (preview) the source URI is
// returned as-is since there is no persistent document directory.

const DIR =
  Platform.OS === "web"
    ? null
    : (FileSystem.documentDirectory || "") + "receipts/";

async function ensureDir(): Promise<void> {
  if (!DIR) return;
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
    }
  } catch {
    // ignore
  }
}

export async function saveReceiptImage(srcUri: string): Promise<string> {
  if (Platform.OS === "web" || !DIR) return srcUri;
  try {
    await ensureDir();
    const ext = (srcUri.split(".").pop() || "jpg").split("?")[0].slice(0, 5);
    const dest = `${DIR}${genId()}.${ext}`;
    await FileSystem.copyAsync({ from: srcUri, to: dest });
    return dest;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[files] save failed, keeping source uri", e);
    return srcUri;
  }
}

export async function deleteFiles(paths: string[]): Promise<void> {
  if (Platform.OS === "web") return;
  for (const p of paths) {
    if (!p || !p.startsWith("file")) continue;
    try {
      await FileSystem.deleteAsync(p, { idempotent: true });
    } catch {
      // ignore
    }
  }
}
