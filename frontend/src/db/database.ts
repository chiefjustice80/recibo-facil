import * as SQLite from "expo-sqlite";

// Single shared connection. Initialization is resilient: if the platform does
// not support SQLite (e.g. the web preview without the wasm asset), the app
// still boots and screens render empty states instead of crashing.

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;
let initError: Error | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  quantity TEXT,
  storage_location TEXT NOT NULL DEFAULT 'pantry',
  expiry_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  reminder_offsets TEXT NOT NULL DEFAULT '[1]',
  image_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  merchant TEXT,
  purchase_date TEXT,
  amount REAL,
  currency TEXT,
  category TEXT,
  warranty_until TEXT,
  return_until TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS receipt_images (
  id TEXT PRIMARY KEY NOT NULL,
  receipt_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Prepared for future on-device OCR full-text indexing (v1.1+).
CREATE TABLE IF NOT EXISTS receipt_ocr_text (
  receipt_id TEXT PRIMARY KEY NOT NULL,
  ocr_text TEXT,
  updated_at TEXT
);

-- Maps scheduled local notifications back to their entity so reminders can be
-- cancelled / rescheduled when an expiry or warranty date changes.
CREATE TABLE IF NOT EXISTS notification_settings (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  scheduled_id TEXT NOT NULL,
  fire_date TEXT NOT NULL,
  offset_days INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_status_expiry
  ON inventory_items(status, expiry_date);
CREATE INDEX IF NOT EXISTS idx_receipt_images_receipt
  ON receipt_images(receipt_id);
CREATE INDEX IF NOT EXISTS idx_notif_entity
  ON notification_settings(entity_type, entity_id);
`;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync("belegguard.db");
      await db.execAsync(SCHEMA);
      dbInstance = db;
      return db;
    } catch (e) {
      initError = e as Error;
      // eslint-disable-next-line no-console
      console.warn("[db] init failed — running without persistence", e);
      return null;
    }
  })();

  return initPromise;
}

export function getInitError(): Error | null {
  return initError;
}

export function isDbAvailable(): boolean {
  return dbInstance !== null;
}

export function genId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  ).toLowerCase();
}

export function nowISO(): string {
  return new Date().toISOString();
}
