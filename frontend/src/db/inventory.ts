import { initDatabase, genId, nowISO } from "./database";
import {
  buildMatchExpr,
  isFtsAvailable,
  removeInventoryFts,
  syncInventoryFts,
} from "./fts";
import { InventoryItem, ItemStatus, StorageLocation } from "./types";

interface Row {
  id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  quantity: string | null;
  storage_location: string;
  custom_location: string | null;
  expiry_date: string | null;
  status: string;
  reminder_offsets: string;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(r: Row): InventoryItem {
  let offsets: number[] = [];
  try {
    offsets = JSON.parse(r.reminder_offsets || "[]");
  } catch {
    offsets = [];
  }
  return {
    id: r.id,
    barcode: r.barcode,
    name: r.name,
    brand: r.brand,
    quantity: r.quantity,
    storage_location: r.storage_location as StorageLocation,
    custom_location: r.custom_location,
    expiry_date: r.expiry_date,
    status: r.status as ItemStatus,
    reminder_offsets: offsets,
    image_path: r.image_path,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// Active items sorted by soonest expiry (items without a date go last).
export async function listInventory(
  status: ItemStatus = "active",
): Promise<InventoryItem[]> {
  const db = await initDatabase();
  if (!db) return [];
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM inventory_items
     WHERE status = ?
     ORDER BY (expiry_date IS NULL) ASC, expiry_date ASC, name ASC`,
    [status],
  );
  return rows.map(mapRow);
}

export async function getInventoryItem(
  id: string,
): Promise<InventoryItem | null> {
  const db = await initDatabase();
  if (!db) return null;
  const row = await db.getFirstAsync<Row>(
    `SELECT * FROM inventory_items WHERE id = ?`,
    [id],
  );
  return row ? mapRow(row) : null;
}

export interface InventoryInput {
  id?: string;
  barcode?: string | null;
  name: string;
  brand?: string | null;
  quantity?: string | null;
  storage_location?: StorageLocation;
  custom_location?: string | null;
  expiry_date?: string | null;
  status?: ItemStatus;
  reminder_offsets?: number[];
  image_path?: string | null;
}

export async function upsertInventoryItem(
  input: InventoryInput,
): Promise<string> {
  const db = await initDatabase();
  const now = nowISO();
  const id = input.id ?? genId();
  if (!db) return id;

  const existing = input.id
    ? await db.getFirstAsync<Row>(
        `SELECT created_at FROM inventory_items WHERE id = ?`,
        [id],
      )
    : null;
  const createdAt = existing?.created_at ?? now;

  const fields = {
    barcode: input.barcode ?? null,
    name: input.name.trim(),
    brand: input.brand?.trim() || null,
    quantity: input.quantity?.trim() || null,
    storage_location: input.storage_location ?? "pantry",
    custom_location:
      input.storage_location === "custom"
        ? input.custom_location?.trim().slice(0, 40) || null
        : null,
    expiry_date: input.expiry_date ?? null,
    status: input.status ?? "active",
  };

  await db.runAsync(
    `INSERT OR REPLACE INTO inventory_items
      (id, barcode, name, brand, quantity, storage_location, custom_location,
       expiry_date, status, reminder_offsets, image_path, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      fields.barcode,
      fields.name,
      fields.brand,
      fields.quantity,
      fields.storage_location,
      fields.custom_location,
      fields.expiry_date,
      fields.status,
      JSON.stringify(input.reminder_offsets ?? [1]),
      input.image_path ?? null,
      createdAt,
      now,
    ],
  );
  await syncInventoryFts(db, { id, ...fields });
  return id;
}

export async function setInventoryStatus(
  id: string,
  status: ItemStatus,
): Promise<void> {
  const db = await initDatabase();
  if (!db) return;
  await db.runAsync(
    `UPDATE inventory_items SET status = ?, updated_at = ? WHERE id = ?`,
    [status, nowISO(), id],
  );
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const db = await initDatabase();
  if (!db) return;
  await db.runAsync(`DELETE FROM inventory_items WHERE id = ?`, [id]);
  await removeInventoryFts(db, id);
}

export async function searchInventory(
  query: string,
): Promise<InventoryItem[]> {
  const db = await initDatabase();
  if (!db) return [];
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Preferred: FTS5 full-text search.
  if (isFtsAvailable()) {
    const expr = buildMatchExpr(trimmed);
    if (expr) {
      try {
        const rows = await db.getAllAsync<Row>(
          `SELECT ii.* FROM inventory_items ii
           JOIN inventory_fts f ON f.id = ii.id
           WHERE inventory_fts MATCH ?
           ORDER BY (ii.expiry_date IS NULL) ASC, ii.expiry_date ASC, ii.name ASC`,
          [expr],
        );
        return rows.map(mapRow);
      } catch (e) {
        console.warn("[fts] inventory search failed — using LIKE", e);
      }
    }
  }

  // Fallback: LIKE search (FTS unavailable, tokenless query, or query error).
  const q = `%${trimmed}%`;
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM inventory_items
     WHERE name LIKE ? OR barcode LIKE ? OR brand LIKE ?
        OR quantity LIKE ? OR storage_location LIKE ? OR custom_location LIKE ?
     ORDER BY (expiry_date IS NULL) ASC, expiry_date ASC, name ASC`,
    [q, q, q, q, q, q],
  );
  return rows.map(mapRow);
}

export async function countInventory(): Promise<number> {
  const db = await initDatabase();
  if (!db) return 0;
  const r = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM inventory_items WHERE status = 'active'`,
  );
  return r?.c ?? 0;
}
