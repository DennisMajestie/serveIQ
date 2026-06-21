export interface Tab {
  id: string;
  table_id: string;
  customer_name?: string;
  party_size: number;
  notes?: string;
  status: 'open' | 'billed' | 'paid' | 'voided';
  orders?: OrderItem[];
}
