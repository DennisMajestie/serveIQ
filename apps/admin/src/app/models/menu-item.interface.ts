export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price_kobo: number;
  unit?: string;
  sku?: string;
  barcode?: string;
  image_url?: string;
  is_available: boolean;
}
