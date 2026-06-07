import { ItemStatus, StorageLocation } from "./types";

// Shared input shape for creating/updating an inventory item. Kept in its own
// module so both the native (SQLite) and web (localStorage) data layers can
// import it without pulling in platform-specific code.
export interface InventoryInput {
  id?: string;
  barcode?: string | null;
  name: string;
  brand?: string | null;
  quantity?: string | null;
  storage_location?: StorageLocation;
  expiry_date?: string | null;
  status?: ItemStatus;
  reminder_offsets?: number[];
  image_path?: string | null;
}
