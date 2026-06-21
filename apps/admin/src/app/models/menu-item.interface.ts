export interface MenuItem {
  id: string;
  name: string;
  category: string;
  priceKobo: number;
  unit?: string;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  isAvailable: boolean;
}
