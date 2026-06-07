import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import { genId } from "../db/database";

// Receipt photos live in the app's private document directory. Only the path
// is stored in SQLite — never the binary. Uses the modern (SDK 54) synchronous
// expo-file-system API. Web uses fileStorage.web.ts (Metro resolves it there).

const receiptsDir =
  Platform.OS === "web" ? null : new Directory(Paths.document, "receipts");

function ensureDir(): void {
  if (!receiptsDir) return;
  try {
    if (!receiptsDir.exists) receiptsDir.create({ intermediates: true });
  } catch {
    // ignore
  }
}

export async function saveReceiptImage(srcUri: string): Promise<string> {
  if (!receiptsDir) return srcUri;
  try {
    ensureDir();
    const ext = (srcUri.split(".").pop() || "jpg").split("?")[0].slice(0, 5);
    const src = new File(srcUri);
    const dest = new File(receiptsDir, `${genId()}.${ext}`);
    if (dest.exists) dest.delete();
    src.copy(dest);
    return dest.uri;
  } catch (e) {
    console.warn("[files] save failed, keeping source uri", e);
    return srcUri;
  }
}

export async function deleteFiles(paths: string[]): Promise<void> {
  for (const p of paths) {
    if (!p || !p.startsWith("file")) continue;
    try {
      const f = new File(p);
      if (f.exists) f.delete();
    } catch {
      // ignore
    }
  }
}
