// Shared domain types for the local-first data model.

export type StorageLocation = "fridge" | "freezer" | "pantry" | "other";
export type ItemStatus = "active" | "consumed" | "discarded";

export interface InventoryItem {
  id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  quantity: string | null;
  storage_location: StorageLocation;
  expiry_date: string | null; // ISO YYYY-MM-DD
  status: ItemStatus;
  reminder_offsets: number[]; // days before expiry, e.g. [0, 1, 3]
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
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
  // Joined for convenience (not a column)
  image_path?: string | null;
}

export interface ReceiptImage {
  id: string;
  receipt_id: string;
  file_path: string;
  created_at: string;
}

export interface ReminderTarget {
  entity_type: "inventory" | "receipt_warranty" | "receipt_return";
  entity_id: string;
  scheduled_id: string;
  fire_date: string;
  offset_days: number;
}
