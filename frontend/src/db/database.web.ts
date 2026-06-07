// Web stub for the database layer. expo-sqlite's web backend pulls in a wasm
// worker that the static web export cannot bundle, and this is an Android-first,
// on-device app. On web the database is unavailable: initDatabase() returns null
// and all CRUD helpers fall back to empty results / no-ops. Native platforms use
// database.ts (full SQLite). Metro picks this file automatically on web.

export async function initDatabase(): Promise<null> {
  return null;
}

export function getInitError(): Error | null {
  return null;
}

export function isDbAvailable(): boolean {
  return false;
}

export function genId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  ).toLowerCase();
}

export function nowISO(): string {
  return new Date().toISOString();
}
