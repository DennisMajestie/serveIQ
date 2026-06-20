import { Request } from 'express';

// ==========================================
// Database Models
// ==========================================

export interface User {
  id: string;
  businessId: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'owner' | 'waiter';
  pin?: string;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  logoUrl?: string;
  cacDocumentUrl?: string;
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

export interface Table {
  id: string;
  branchId: string;
  tableNumber: string;
  capacity: number;
  label?: string;
  status: 'available' | 'occupied' | 'reserved';
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
}

// ==========================================
// Request & Response Types
// ==========================================

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    businessId: string;
    role: string;
  };
}

export interface JWTPayload {
  userId: string;
  businessId: string;
  role: string;
}

// ==========================================
// Database Store
// ==========================================

export interface Database {
  users: Map<string, User>;
  businesses: Map<string, Business>;
  branches: Map<string, Branch>;
  menuItems: Map<string, MenuItem>;
  tables: Map<string, Table>;
  tabs: Map<string, Tab>;
  orderItems: Map<string, OrderItem>;
  bills: Map<string, Bill>;
  emails: Map<string, string>; // email -> userId
}
