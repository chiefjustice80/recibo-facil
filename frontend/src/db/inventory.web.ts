// Web data layer for inventory — mirrors db/inventory.ts but persists to
// localStorage (the native SQLite backend cannot run in the web export).
// Metro picks this file automatically on web.

import { genId, nowISO } from "./database";
import { InventoryInput } from "./inventory.types";
import { InventoryItem, ItemStatus } from "./types";

const KEY = "web.inventory";

function readAll(): InventoryItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as InventoryItem[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: InventoryItem[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function sortByExpiry(a: InventoryItem, b: InventoryItem): number {
  const ax = a.expiry_date ? 0 : 1;
  const bx = b.expiry_date ? 0 : 1;
  if (ax !== bx) return ax - bx;
  if (a.expiry_date && b.expiry_date) {
    if (a.expiry_date !== b.expiry_date)
      return a.expiry_date < b.expiry_date ? -1 : 1;
  }
  return a.name.localeCompare(b.name);
}

export async function listInventory(
  status: ItemStatus = "active",
): Promise<InventoryItem[]> {
  return readAll()
    .filter((i) => i.status === status)
    .sort(sortByExpiry);
}

export async function getInventoryItem(
  id: string,
): Promise<InventoryItem | null> {
  return readAll().find((i) => i.id === id) ?? null;
}

export async function upsertInventoryItem(
  input: InventoryInput,
): Promise<string> {
  const items = readAll();
  const now = nowISO();
  const id = input.id ?? genId();
  const existing = items.find((i) => i.id === id);

  const record: InventoryItem = {
    id,
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
    reminder_offsets: input.reminder_offsets ?? [1],
    image_path: input.image_path ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  const next = existing
    ? items.map((i) => (i.id === id ? record : i))
    : [...items, record];
  writeAll(next);
  return id;
}

export async function setInventoryStatus(
  id: string,
  status: ItemStatus,
): Promise<void> {
  const items = readAll().map((i) =>
    i.id === id ? { ...i, status, updated_at: nowISO() } : i,
  );
  writeAll(items);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  writeAll(readAll().filter((i) => i.id !== id));
}

export async function searchInventory(
  query: string,
): Promise<InventoryItem[]> {
  const q = query.trim().toLowerCase();
  return readAll()
    .filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.barcode || "").toLowerCase().includes(q) ||
        (i.brand || "").toLowerCase().includes(q) ||
        (i.custom_location || "").toLowerCase().includes(q),
    )
    .sort(sortByExpiry);
}

export async function countInventory(): Promise<number> {
  return readAll().filter((i) => i.status === "active").length;
}
