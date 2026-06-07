// Web data layer for receipts — mirrors db/receipts.ts but persists to
// localStorage. Receipt images are stored inline as data/object URIs on web.

import { genId, nowISO } from "./database";
import { ReceiptInput } from "./receipts.types";
import { Receipt } from "./types";

const KEY = "web.receipts";
const IMG_KEY = "web.receiptImages";

function readAll(): Receipt[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Receipt[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: Receipt[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function readImages(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(IMG_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeImages(map: Record<string, string>): void {
  try {
    window.localStorage.setItem(IMG_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function withImage(r: Receipt): Receipt {
  const images = readImages();
  return { ...r, image_path: images[r.id] ?? null };
}

export async function listReceipts(): Promise<Receipt[]> {
  return readAll()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map(withImage);
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  const r = readAll().find((x) => x.id === id);
  return r ? withImage(r) : null;
}

export async function upsertReceipt(input: ReceiptInput): Promise<string> {
  const items = readAll();
  const now = nowISO();
  const id = input.id ?? genId();
  const existing = items.find((i) => i.id === id);

  const record: Receipt = {
    id,
    title: input.title.trim(),
    merchant: input.merchant?.trim() || null,
    purchase_date: input.purchase_date ?? null,
    amount: input.amount ?? null,
    currency: input.currency?.trim() || null,
    category: input.category?.trim() || null,
    warranty_until: input.warranty_until ?? null,
    return_until: input.return_until ?? null,
    notes: input.notes?.trim() || null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  const next = existing
    ? items.map((i) => (i.id === id ? record : i))
    : [...items, record];
  writeAll(next);
  return id;
}

export async function deleteReceipt(id: string): Promise<string[]> {
  writeAll(readAll().filter((i) => i.id !== id));
  const images = readImages();
  delete images[id];
  writeImages(images);
  return [];
}

export async function setReceiptImage(
  receiptId: string,
  filePath: string,
): Promise<void> {
  const images = readImages();
  images[receiptId] = filePath;
  writeImages(images);
}

export async function searchReceipts(query: string): Promise<Receipt[]> {
  const q = query.trim().toLowerCase();
  return readAll()
    .filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.merchant || "").toLowerCase().includes(q) ||
        (r.category || "").toLowerCase().includes(q) ||
        (r.notes || "").toLowerCase().includes(q),
    )
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map(withImage);
}

export async function countReceipts(): Promise<number> {
  return readAll().length;
}
