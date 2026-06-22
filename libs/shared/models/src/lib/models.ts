// ==========================================
// Domain Models — aligned with API types.ts
// ==========================================

export interface User {
  id: string;
  businessId: string;
  fullName: string;
  email: string;
  role: 'owner' | 'waiter';
  pin?: string;
}

export interface Waiter extends User {}

export interface Business {
  id: string;
  name: string;
  type: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  address: string;
  phoneNumber: string;
  location?: string;
}

export interface MenuItem {
  id: string;
  branchId: string;
  name: string;
  category: string;
  priceKobo: number;
  unit?: string;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface Table {
  id: string;
  branchId: string;
  tableNumber: string;
  capacity: number;
  label?: string;
  status: TableStatus;
}

export type TabStatus = 'open' | 'billed' | 'paid' | 'voided';

export interface Tab {
  id: string;
  branchId: string;
  tableId: string;
  partySize: number;
  customerName?: string;
  notes?: string;
  status: TabStatus;
  openedAt: Date;
  closedAt?: Date;
  orderItems?: OrderItem[];
}

export interface OrderItem {
  id: string;
  tabId: string;
  menuItemId: string;
  menuItemName: string;
  priceKobo: number;
  quantity: number;
  notes?: string;
}

export interface Bill {
  id: string;
  tabId: string;
  branchId: string;
  subtotalKobo: number;
  serviceChargePercent: number;
  discountKobo: number;
  totalKobo: number;
  paymentAmountKobo?: number;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: Date;
  createdAt: Date;
  orderItems?: OrderItem[];
}

export interface Receipt {
  bill: Bill;
  tab: Tab;
  orderItems: OrderItem[];
  receiptNumber: string;
}

export interface DashboardStats {
  totalBranches: number;
  totalTables: number;
  openTabs: number;
  totalOrders: number;
}

// ==========================================
// Request / Response DTOs
// ==========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  businessName: string;
  businessType: string;
  logoUrl?: string;
  cacDocumentUrl?: string;
}

export interface RegisterResponse {
  business: Business;
  owner: User;
  branch?: Branch;
  branchId?: string;
  access_token?: string;
}

export interface CreateWaiterRequest {
  fullName: string;
  email: string;
  password?: string;
  pin?: string;
}

export interface CreateBranchRequest {
  name: string;
  address: string;
  phone_number: string;
  location?: string;
}

export interface CreateMenuItemRequest {
  branchId: string;
  name: string;
  category: string;
  priceKobo: number;
  unit?: string;
  imageUrl?: string;
}

export interface CreateTableRequest {
  branchId: string;
  tableNumber: string;
  capacity: number;
  label?: string;
}

export interface OpenTabRequest {
  tableId: string;
  partySize: number;
  customerName?: string;
  notes?: string;
}

export interface AddOrderItemsRequest {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface GenerateBillRequest {
  serviceChargePercent?: number;
  discountKobo?: number;
}

export interface RecordPaymentRequest {
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'ussd';
  reference?: string;
}
