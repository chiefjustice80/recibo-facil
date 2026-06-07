// Web stub for the file-storage service. The web preview has no persistent
// document directory, so receipt photos keep their original object/data URI and
// deletion is a no-op. Native platforms use fileStorage.ts (expo-file-system).

export async function saveReceiptImage(srcUri: string): Promise<string> {
  return srcUri;
}

export async function deleteFiles(_paths: string[]): Promise<void> {
  // no-op on web
}
