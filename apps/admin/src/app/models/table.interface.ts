export interface Table {
  id: string;
  table_number: string;
  label?: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
}
