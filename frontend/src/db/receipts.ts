import { initDatabase, genId, nowISO } from "./database";
import { Receipt } from "./types";

interface Row {
  id: string;
  title: string;
  merchant: string | null;
  purchase_date: string | null;
  amount: number | null;
  currency: string | null;
  category: string | null;
  warranty_until: string | null;
  return_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  image_path?: string | null;
}

function mapRow(r: Row): Receipt {
  return {
    id: r.id,
    title: r.title,
    merchant: r.merchant,
    purchase_date: r.purchase_date,
    amount: r.amount,
    currency: r.currency,
    category: r.category,
    warranty_until: r.warranty_until,
    return_until: r.return_until,
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
    image_path: r.image_path ?? null,
  };
}

// Newest first, with the primary image joined for thumbnails.
export async function listReceipts(): Promise<Receipt[]> {
  const db = await initDatabase();
  if (!db) return [];
  const rows = await db.getAllAsync<Row>(
    `SELECT r.*, (
        SELECT file_path FROM receipt_images ri
        WHERE ri.receipt_id = r.id ORDER BY ri.created_at ASC LIMIT 1
     ) as image_path
     FROM receipts r
     ORDER BY r.created_at DESC`,
  );
  return rows.map(mapRow);
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  const db = await initDatabase();
  if (!db) return null;
  const row = await db.getFirstAsync<Row>(
    `SELECT r.*, (
        SELECT file_path FROM receipt_images ri
        WHERE ri.receipt_id = r.id ORDER BY ri.created_at ASC LIMIT 1
     ) as image_path
     FROM receipts r WHERE r.id = ?`,
    [id],
  );
  return row ? mapRow(row) : null;
}

export interface ReceiptInput {
  id?: string;
  title: string;
  merchant?: string | null;
  purchase_date?: string | null;
  amount?: number | null;
  currency?: string | null;
  category?: string | null;
  warranty_until?: string | null;
  return_until?: string | null;
  notes?: string | null;
}

export async function upsertReceipt(input: ReceiptInput): Promise<string> {
  const db = await initDatabase();
  const now = nowISO();
  const id = input.id ?? genId();
  if (!db) return id;

  const existing = input.id
    ? await db.getFirstAsync<{ created_at: string }>(
        `SELECT created_at FROM receipts WHERE id = ?`,
        [id],
      )
    : null;
  const createdAt = existing?.created_at ?? now;

  await db.runAsync(
    `INSERT OR REPLACE INTO receipts
      (id, title, merchant, purchase_date, amount, currency, category,
       warranty_until, return_until, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title.trim(),
      input.merchant?.trim() || null,
      input.purchase_date ?? null,
      input.amount ?? null,
      input.currency?.trim() || null,
      input.category?.trim() || null,
      input.warranty_until ?? null,
      input.return_until ?? null,
      input.notes?.trim() || null,
      createdAt,
      now,
    ],
  );
  return id;
}

export async function deleteReceipt(id: string): Promise<string[]> {
  const db = await initDatabase();
  if (!db) return [];
  const images = await db.getAllAsync<{ file_path: string }>(
    `SELECT file_path FROM receipt_images WHERE receipt_id = ?`,
    [id],
  );
  await db.runAsync(`DELETE FROM receipt_images WHERE receipt_id = ?`, [id]);
  await db.runAsync(`DELETE FROM receipt_ocr_text WHERE receipt_id = ?`, [id]);
  await db.runAsync(`DELETE FROM receipts WHERE id = ?`, [id]);
  return images.map((i) => i.file_path);
}

export async function setReceiptImage(
  receiptId: string,
  filePath: string,
): Promise<void> {
  const db = await initDatabase();
  if (!db) return;
  // Single primary image per receipt in the MVP — replace any existing.
  await db.runAsync(`DELETE FROM receipt_images WHERE receipt_id = ?`, [
    receiptId,
  ]);
  await db.runAsync(
    `INSERT INTO receipt_images (id, receipt_id, file_path, created_at)
     VALUES (?, ?, ?, ?)`,
    [genId(), receiptId, filePath, nowISO()],
  );
}

export async function searchReceipts(query: string): Promise<Receipt[]> {
  const db = await initDatabase();
  if (!db) return [];
  const q = `%${query.trim()}%`;
  const rows = await db.getAllAsync<Row>(
    `SELECT r.*, (
        SELECT file_path FROM receipt_images ri
        WHERE ri.receipt_id = r.id ORDER BY ri.created_at ASC LIMIT 1
     ) as image_path
     FROM receipts r
     WHERE r.title LIKE ? OR r.merchant LIKE ? OR r.category LIKE ? OR r.notes LIKE ?
     ORDER BY r.created_at DESC`,
    [q, q, q, q],
  );
  return rows.map(mapRow);
}

export async function countReceipts(): Promise<number> {
  const db = await initDatabase();
  if (!db) return 0;
  const r = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM receipts`,
  );
  return r?.c ?? 0;
}
