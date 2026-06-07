// Shared input shape for creating/updating a receipt (native + web layers).
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
