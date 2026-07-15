// ==========================================
// Domain Models — aligned with API types.ts
// ==========================================

export type UiThemeVariant = 'current' | 'legacy';

export interface User {
  id: string;
  businessId?: string;
  fullName: string;
  email: string;
  role: 'owner' | 'waiter' | 'supervisor' | 'chef' | 'super_admin';
  pin?: string;
  avatarUrl?: string;
  isActive?: boolean;
  uiThemeVariant?: UiThemeVariant;
}

export type Waiter = User;

export interface Business {
  id: string;
  name: string;
  slug?: string;
  type: string;
  email?: string;
  phone?: string;
  address?: string;
  currency: string;
  taxRate?: number;
  timezone?: string;
  subscriptionPlan?: string;
  logoUrl?: string;
  brandPrimaryColor?: string;
  brandAccentColor?: string;
  isActive?: boolean;
  branches?: Branch[];
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
  price_kobo?: number;
  unit?: string;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  isAvailable: boolean;
  quantityInStock: number;
  reorderLevel: number;
  costPriceKobo?: number;
  trackStock: boolean;
  supplierId?: string;
  supplier?: Supplier;
}

export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface Table {
  id: string;
  branchId: string;
  tableNumber: string;
  capacity: number;
  label?: string;
  status: TableStatus;
  isVip?: boolean;
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
  waiterId?: string;
  shiftId?: string;
  orderItems?: OrderItem[];
}

export interface OrderItem {
  id: string;
  tabId: string;
  tab_id?: string;
  menuItemId: string;
  menu_item_id?: string;
  menuItemName: string;
  menu_item_name?: string;
  priceKobo: number;
  price_kobo?: number;
  unit_price_kobo?: number;
  quantity: number;
  qty?: number;
  notes?: string;
}

export interface Bill {
  id: string;
  tabId: string;
  branchId: string;
  subtotalKobo: number;
  serviceChargeKobo: number;
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

export interface WaiterPerformance {
  waiter: { id: string; fullName: string; email: string; avatarUrl?: string };
  tabsCount: number;
  revenueKobo: number;
}

export interface RecentOrder {
  id: string;
  menuItemName: string;
  menuItemId: string;
  priceKobo: number;
  subtotalKobo: number;
  quantity: number;
  tabId: string;
  createdAt: Date;
  tab?: { tableId?: string; table?: { tableNumber?: string } };
}

export interface DashboardStats {
  realTimeSales: number;
  activeTables: number;
  totalTables: number;
  openTabs: number;
  dailyRevenue: number;
  todayTabsCount: number;
  waiterPerformance: WaiterPerformance[];
  recentOrders: RecentOrder[];
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
  email?: string;
  phone?: string;
  branchId: string;
  role?: string;
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
  quantityInStock?: number;
  reorderLevel?: number;
  costPriceKobo?: number;
  trackStock?: boolean;
  supplierId?: string;
  barcode?: string;
}

export interface CreateTableRequest {
  branchId: string;
  tableNumber: string;
  capacity: number;
  label?: string;
  isVip?: boolean;
}

export interface OpenTabRequest {
  table_id: string;
  party_size: number;
  customer_name?: string;
  notes?: string;
}

export interface AddOrderItemsRequest {
  menu_item_id: string;
  quantity: number;
  notes?: string;
}

export interface GenerateBillRequest {
  serviceChargePercent?: number;
  discountKobo?: number;
}

export interface ApplyDiscountRequest {
  discountKobo: number;
  reason?: string;
}

export interface RecordPaymentRequest {
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'ussd' | 'pos';
  terminal_id?: string;
  reference?: string;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  otp: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  password?: string;
}

export interface PeakHoursEntry {
  hour: number;
  orderCount: number;
  revenueKobo: number;
}

export interface TableVelocityEntry {
  tableId: string;
  tableNumber: string;
  avgDurationMinutes: number;
  totalCovers: number;
}

export interface PeakEfficiencyEntry {
  hour: number;
  totalCovers: number;
  avgDurationMinutes: number;
}

// ===== Suppliers =====
export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  createdAt: Date;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
}

// ===== Shifts =====
export interface Shift {
  id: string;
  branchId: string;
  openedAt: Date;
  closedAt?: Date;
  startingCashKobo: number;
  expectedCashKobo?: number;
  actualCashKobo?: number;
  varianceKobo?: number;
  note?: string;
  status: 'open' | 'closed';
}

export interface OpenShiftRequest {
  starting_cash_kobo: number;
  note?: string;
}

export interface CloseShiftRequest {
  actual_cash_kobo: number;
  note?: string;
}

// ===== Stock Movement (read-only from API) =====
export interface StockMovement {
  id: string;
  branchId: string;
  menuItemId: string;
  type: string;
  quantityChange: number;
  quantityAfter: number;
  orderId?: string;
  notes?: string;
  costAtPurchaseKobo?: number;
  createdAt: Date;
}

// ===== Inventory (menu-item stock model) =====
export interface RestockRequest {
  added_quantity: number;
  cost_price_kobo?: number;
  barcode?: string;
}

export interface AuditEntry {
  id: string;
  itemName: string;
  initialStock: number;
  totalRestocked: number;
  totalIn: number;
  totalSold: number;
  bookBalance: number;
  actualBalance: number;
  slippage: number;
  lastRestockDate: string;
  status: 'Balanced' | 'Shortage' | 'Surplus' | 'Unreviewed';
}

export interface ReconcileRequest {
  reconciliation_id: string;
  counts: Array<{ menu_item_id: string; physical_count: number }>;
}

export interface ReconcileAdjustment {
  menuItemId: string;
  delta: number;
  movementId: string;
}

export interface DailyTallySummary {
  date: string;
  summaryStatement: string;
  totalOpeningValue: number;
  totalRevenue: number;
  totalClosingValue: number;
  totalItemsSold: number;
  totalItemsRestocked: number;
  isAllBalanced: boolean;
}

export interface DailyTallyItem {
  id: string;
  itemName: string;
  openingStock: number;
  restockedToday: number;
  soldToday: number;
  closingStock: number;
  revenueToday: number;
  unitPrice: number;
  openingValue: number;
  closingValue: number;
  isTallyValid: boolean;
  explanation: string;
}

export interface DailyTallyReport {
  summary: DailyTallySummary;
  items: DailyTallyItem[];
}

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
export type BillingInterval = 'monthly' | 'yearly';

export interface PlanFeatures {
  maxTables: number;
  maxWaiters: number;
  reportingEnabled: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingInterval: BillingInterval;
  features: PlanFeatures;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  branchId: string;
  planId: string | null;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  gracePeriodEndsAt: string | null;
  canceledAt: string | null;
  plan: SubscriptionPlan | null;
}

export interface InitializeSubscriptionResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

// ===== Reports =====
export interface SalesEntry {
  date: string;
  revenueKobo: number;
  orderCount: number;
  paymentMethod: string;
}

export interface TopItemEntry {
  menuItemId: string;
  name: string;
  quantitySold: number;
  revenueKobo: number;
  category: string;
}

// ===== Supervisor Workflow =====
export type OrderStatus =
  | 'PENDING_SUPERVISOR_APPROVAL'
  | 'APPROVED'
  | 'ASSIGNED_TO_DEPARTMENT'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DECLINED';

export interface Department {
  id: string;
  branchId: string;
  name: string;
  description?: string;
}

export interface Order {
  id: string;
  tabId: string;
  branchId: string;
  waiterId: string;
  waiter?: { id: string; fullName: string };
  tab?: { id: string; tableId: string; table?: { tableNumber: string } };
  items?: OrderItem[];
  status: OrderStatus;
  timerEndsAt?: string;
  declineReason?: string;
  departmentId?: string;
  department?: Department;
  createdAt: string;
}

export interface ApproveOrderRequest {
  departmentId: string;
  estimatedTime: number;
}

export interface DeclineOrderRequest {
  declineReason: string;
}

// ===== Notifications =====
export type NotificationType = 'low_stock' | 'shift_reminder' | 'payment' | 'system' | 'order_ready';

export interface Notification {
  id: string;
  branchId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}
