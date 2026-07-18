// SQLite FTS5 full-text search support (native only).
//
// Design goals (defensive):
//  - The base tables are the single source of truth. FTS tables are a pure index
//    and are NEVER required for the app to work.
//  - If FTS5 is not available on the platform/build, `setupFts` fails silently,
//    `isFtsAvailable()` stays false, and callers fall back to LIKE search.
//  - The index is rebuilt from the base tables on every init (cheap for a local
//    DB) so it is always consistent after a restart — even if a live write-sync
//    was somehow missed. Live writes also keep it in sync within a session.
//  - Tokenizer uses `remove_diacritics 2` so "Kühlschrank" / "Muller" / umlauts
//    match regardless of accents.

import type * as SQLite from "expo-sqlite";

let ftsAvailable = false;

export function isFtsAvailable(): boolean {
  return ftsAvailable;
}

const FTS_SCHEMA = `
DROP TABLE IF EXISTS inventory_fts;
DROP TABLE IF EXISTS receipts_fts;
CREATE VIRTUAL TABLE inventory_fts USING fts5(
  id UNINDEXED,
  name, brand, barcode, quantity, storage_location, custom_location, expiry_date,
  tokenize = 'unicode61 remove_diacritics 2'
);
CREATE VIRTUAL TABLE receipts_fts USING fts5(
  id UNINDEXED,
  title, merchant, category, notes, amount, purchase_date, warranty_until, return_until,
  tokenize = 'unicode61 remove_diacritics 2'
);
`;

// Creates the FTS virtual tables and (re)builds the index from the base tables.
// Returns true if FTS5 is usable. On any failure the app keeps working via LIKE.
export async function setupFts(db: SQLite.SQLiteDatabase): Promise<boolean> {
  try {
    // DROP + CREATE ensures the FTS schema always matches the current column set
    // (e.g. after adding custom_location) — the index is rebuilt from the base
    // tables below, so nothing is lost.
    await db.execAsync(FTS_SCHEMA);
    await db.runAsync(
      `INSERT INTO inventory_fts
        (id, name, brand, barcode, quantity, storage_location, custom_location, expiry_date)
       SELECT id,
              COALESCE(name, ''), COALESCE(brand, ''), COALESCE(barcode, ''),
              COALESCE(quantity, ''), COALESCE(storage_location, ''),
              COALESCE(custom_location, ''), COALESCE(expiry_date, '')
       FROM inventory_items`,
    );
    await db.runAsync(
      `INSERT INTO receipts_fts
        (id, title, merchant, category, notes, amount, purchase_date,
         warranty_until, return_until)
       SELECT id,
              COALESCE(title, ''), COALESCE(merchant, ''), COALESCE(category, ''),
              COALESCE(notes, ''), COALESCE(CAST(amount AS TEXT), ''),
              COALESCE(purchase_date, ''), COALESCE(warranty_until, ''),
              COALESCE(return_until, '')
       FROM receipts`,
    );
    ftsAvailable = true;
  } catch (e) {
    ftsAvailable = false;
    console.warn("[fts] FTS5 unavailable — falling back to LIKE search", e);
  }
  return ftsAvailable;
}

// Turns arbitrary user input into a safe FTS5 MATCH expression. Each word becomes
// a quoted prefix term joined with implicit AND. Returns null when there is no
// usable token (e.g. only punctuation) so callers can fall back to LIKE.
export function buildMatchExpr(query: string): string | null {
  let tokens: string[] = [];
  const lower = query.toLowerCase();
  try {
    tokens = lower.match(/[\p{L}\p{N}]+/gu) ?? [];
  } catch {
    // Engine without unicode property escapes — basic fallback.
    tokens = lower.split(/[^0-9a-zà-ÿ]+/i).filter(Boolean);
  }
  if (tokens.length === 0) return null;
  return tokens.map((tk) => `"${tk.replace(/"/g, '""')}"*`).join(" ");
}

interface InvFtsFields {
  id: string;
  name?: string | null;
  brand?: string | null;
  barcode?: string | null;
  quantity?: string | null;
  storage_location?: string | null;
  custom_location?: string | null;
  expiry_date?: string | null;
}

export async function syncInventoryFts(
  db: SQLite.SQLiteDatabase,
  item: InvFtsFields,
): Promise<void> {
  if (!ftsAvailable) return;
  try {
    await db.runAsync(`DELETE FROM inventory_fts WHERE id = ?`, [item.id]);
    await db.runAsync(
      `INSERT INTO inventory_fts
        (id, name, brand, barcode, quantity, storage_location, custom_location, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.name ?? "",
        item.brand ?? "",
        item.barcode ?? "",
        item.quantity ?? "",
        item.storage_location ?? "",
        item.custom_location ?? "",
        item.expiry_date ?? "",
      ],
    );
  } catch (e) {
    console.warn("[fts] inventory sync failed", e);
  }
}

export async function removeInventoryFts(
  db: SQLite.SQLiteDatabase,
  id: string,
): Promise<void> {
  if (!ftsAvailable) return;
  try {
    await db.runAsync(`DELETE FROM inventory_fts WHERE id = ?`, [id]);
  } catch {
    // index drift is self-healed on next init rebuild
  }
}

interface ReceiptFtsFields {
  id: string;
  title?: string | null;
  merchant?: string | null;
  category?: string | null;
  notes?: string | null;
  amount?: number | null;
  purchase_date?: string | null;
  warranty_until?: string | null;
  return_until?: string | null;
}

export async function syncReceiptFts(
  db: SQLite.SQLiteDatabase,
  r: ReceiptFtsFields,
): Promise<void> {
  if (!ftsAvailable) return;
  try {
    await db.runAsync(`DELETE FROM receipts_fts WHERE id = ?`, [r.id]);
    await db.runAsync(
      `INSERT INTO receipts_fts
        (id, title, merchant, category, notes, amount, purchase_date,
         warranty_until, return_until)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id,
        r.title ?? "",
        r.merchant ?? "",
        r.category ?? "",
        r.notes ?? "",
        r.amount != null ? String(r.amount) : "",
        r.purchase_date ?? "",
        r.warranty_until ?? "",
        r.return_until ?? "",
      ],
    );
  } catch (e) {
    console.warn("[fts] receipt sync failed", e);
  }
}

export async function removeReceiptFts(
  db: SQLite.SQLiteDatabase,
  id: string,
): Promise<void> {
  if (!ftsAvailable) return;
  try {
    await db.runAsync(`DELETE FROM receipts_fts WHERE id = ?`, [id]);
  } catch {
    // index drift is self-healed on next init rebuild
  }
}
