// ==========================================
// Domain Models — aligned with API types.ts
// ==========================================

export type UiThemeVariant = 'current' | 'legacy';

export type UserRole =
  | 'owner'
  | 'waiter'
  | 'supervisor'
  | 'chef'
  | 'manager'
  | 'super_admin'
  | 'rider';

export interface User {
  id: string;
  businessId?: string;
  fullName: string;
  email: string;
  role: UserRole;
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
  country?: string;
  currency: string;
  taxRate?: number;
  vipSurchargePercent?: number;
  serviceChargePercent?: number;
  discountMinOrderAmount?: number;
  timezone?: string;
  subscriptionPlan?: string;
  logoUrl?: string;
  brandPrimaryColor?: string;
  brandAccentColor?: string;
  businessCode?: string;
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
  settings?: any;
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
  prepType?: 'instant' | 'cook';
  prep_type?: 'instant' | 'cook';
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'inactive';

export interface Table {
  id: string;
  branchId: string;
  tableNumber: string;
  capacity: number;
  label?: string;
  status: TableStatus;
  isVip?: boolean;
  isVirtual?: boolean;
}

export type TabStatus = 'open' | 'billed' | 'paid' | 'voided';

export type PickupMode = 'self' | 'dispatch';

export type DeliveryStatus =
  | 'pending'
  | 'accepted'
  | 'out_for_delivery'
  | 'handed_over'
  | 'delivered'
  | 'cancelled';

export interface DeliveryDetails {
  full_name?: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface DeliveryData {
  id: string;
  status: DeliveryStatus;
  fee_kobo: number;
  rider_name?: string | null;
  rider_phone?: string | null;
  accepted_at?: string | null;
  delivered_at?: string | null;
}

export interface Rider {
  id: string;
  userId: string;
  branchId: string;
  businessId: string;
  isOnline: boolean;
  vehicle: string | null;
  avatarUrl: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface RiderPendingPayout {
  riderId: string;
  riderName: string;
  pendingDeliveries: number;
  totalPayoutKobo: number;
}

export interface RiderPayoutDetail {
  deliveries: DeliveryJob[];
  totalPayoutKobo: number;
}

export enum LedgerType {
  DELIVERY_EARNING = 'delivery_earning',
  PAYOUT = 'payout',
  ADJUSTMENT = 'adjustment',
}

export enum LedgerRefType {
  DELIVERY = 'delivery',
  MANUAL_PAYOUT = 'manual_payout',
  BATCH_PAYOUT = 'batch_payout',
}

export interface RiderLedgerEntry {
  id: string;
  riderId: string;
  businessId: string;
  type: LedgerType;
  amountKobo: number;
  refType: LedgerRefType | null;
  refId: string | null;
  description: string | null;
  createdAt: string;
}

export enum PayoutBatchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum PayoutProvider {
  PAYSTACK = 'paystack',
  FLUTTERWAVE = 'flutterwave',
  MANUAL = 'manual',
}

export interface PayoutBatch {
  id: string;
  businessId: string;
  riderId: string;
  provider: PayoutProvider;
  providerBatchId: string | null;
  totalKobo: number;
  status: PayoutBatchStatus;
  failureReason: string | null;
  createdBy: string | null;
  createdAt: string;
  completedAt: string | null;
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SEATED = 'seated',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum ReservationSource {
  PUBLIC = 'public',
  WALKIN = 'walkin',
  PHONE = 'phone',
  ADMIN = 'admin',
}

export interface Reservation {
  id: string;
  businessId: string;
  branchId: string;
  tableId: string | null;
  tableNumber: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  partySize: number;
  reservationTime: string;
  durationMinutes: number;
  endTime: string;
  status: ReservationStatus;
  specialRequests: string | null;
  source: ReservationSource;
  confirmationCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  reservationTime: string;
  durationMinutes?: number;
  specialRequests?: string;
  source?: ReservationSource;
}

export interface UpdateReservationRequest {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  partySize?: number;
  reservationTime?: string;
  durationMinutes?: number;
  status?: ReservationStatus;
  specialRequests?: string;
  cancellationReason?: string;
}

export interface ReservationQuery {
  branchId?: string;
  tableId?: string;
  status?: ReservationStatus;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AvailabilityQuery {
  date: string;
  partySize: number;
  branchId?: string;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
  availableTables: number;
}

export interface AvailabilityResponse {
  date: string;
  slots: AvailabilitySlot[];
}

export interface WalkinReservationRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  durationMinutes?: number;
  tableId?: string;
  specialRequests?: string;
}

export interface ConfirmReservationRequest {
  confirmationCode: string;
}

export interface DeliveryJob {
  id: string;
  tabId: string;
  branchId: string;
  status: DeliveryStatus;
  feeKobo: number;
  payoutKobo: number;
  createdAt: string;
  acceptedAt?: string | null;
  deliveredAt?: string | null;
  customerName?: string | null;
  deliveryDetails?: DeliveryDetails | null;
  riderUserId?: string | null;
  riderName?: string | null;
  riderPhone?: string | null;
  orderIds?: string[];
}

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
  tabType?: string;
  pickupMode?: PickupMode;
  deliveryFeeKobo?: number;
  deliveryDetails?: DeliveryDetails;
  delivery?: DeliveryData | null;
  orderItems?: OrderItem[];
  trackingCode?: string;
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
  unitPriceKobo?: number;
  unit_price_kobo?: number;
  quantity: number;
  qty?: number;
  notes?: string;
  orderStatus?: string;
  order_status?: string;
}

export interface Bill {
  id: string;
  tabId: string;
  branchId: string;
  subtotalKobo: number;
  serviceChargeKobo: number;
  serviceChargePercent: number;
  discountKobo: number;
  deliveryFeeKobo?: number;
  totalKobo: number;
  paymentAmountKobo?: number;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: Date;
  createdAt: Date;
  orderItems?: OrderItem[];
  paymentStatus?: string;
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
  role?: 'waiter' | 'supervisor';
  password?: string;
  pin?: string;
}

export interface CreateBranchRequest {
  name: string;
  address: string;
  phone_number: string;
  location?: string;
  settings?: any;
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
  prepType?: 'instant' | 'cook';
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
  tab_type?: string;
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
  idempotency_key?: string;
  bill_id?: string;
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
export type ShiftType = 'morning' | 'evening' | 'night' | 'split' | 'custom';

export interface ShiftTemplate {
  id: string;
  branchId: string;
  name: string;
  type: ShiftType;
  scheduledStartTime: string; // HH:mm format (e.g., "07:00")
  scheduledEndTime: string;   // HH:mm format (e.g., "15:00")
  daysOfWeek: number[];       // 0=Sun, 1=Mon, ..., 6=Sat
  color: string;              // Hex color for UI
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShiftTemplateRequest {
  name: string;
  type: ShiftType;
  scheduledStartTime: string;
  scheduledEndTime: string;
  daysOfWeek: number[];
  color: string;
}

export interface Shift {
  id: string;
  branchId: string;
  templateId?: string;           // Reference to shift template
  template?: ShiftTemplate;      // Populated template info
  assignedStaffIds: string[];    // Staff assigned to this shift
  assignedStaff?: { id: string; fullName: string; role: string }[]; // Populated staff info
  openedAt: Date;
  closedAt?: Date;
  scheduledStartTime: string;    // HH:mm
  scheduledEndTime: string;      // HH:mm
  startingCashKobo: number;
  expectedCashKobo?: number;
  actualCashKobo?: number;
  varianceKobo?: number;
  note?: string;
  status: 'scheduled' | 'open' | 'closed' | 'cancelled';
  shiftType: ShiftType;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpenShiftRequest {
  templateId?: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  starting_cash_kobo: number;
  assigned_staff_ids?: string[];
  note?: string;
}

export interface CloseShiftRequest {
  actual_cash_kobo: number;
  note?: string;
}

export interface ShiftReport {
  shift: Shift;
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  paymentBreakdown: Record<string, number>; // method -> amount in kobo
  staffPerformance: { staffId: string; staffName: string; orders: number; revenue: number }[];
}

export interface ShiftSummary {
  date: string;
  shifts: Shift[];
  totalRevenue: number;
  totalOrders: number;
  totalVariance: number;
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

// ===== Business KPIs (Multi-branch) =====
export interface BranchKPI {
  branchId: string;
  branchName: string;
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  activeTables: number;
  openTabs: number;
  tableVelocity: number;
  rank?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export interface BusinessKPIs {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  branchComparison: BranchKPI[];
  trends: { date: string; branches: { branchId: string; revenue: number }[] }[];
}

// ===== Supervisor Workflow =====
export type OrderStatus =
  | 'PENDING_SUPERVISOR_APPROVAL'
  | 'APPROVED'
  | 'ASSIGNED_TO_DEPARTMENT'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DECLINED';

export interface Department {
  id: string;
  branchId: string;
  name: string;
  isActive?: boolean;
  description?: string;
  createdAt?: string;
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
  approvedAt?: string;
  preparingAt?: string;
  actualReadyTime?: string;
  deliveredAt?: string;
  trackingCode?: string;
}

export interface OrderGroup {
  tabId: string;
  createdAt: string;
  tableId: string;
  tableNumber: string;
  waiterId: string;
  waiterName: string;
  totalKobo: number;
  billTotalKobo?: number;
  timerEndsAt?: string;
  departmentId?: string;
  departmentName?: string;
  tabType?: string;
  trackingCode?: string;
  items: OrderGroupItem[];
}

export interface OrderGroupItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPriceKobo: number;
  subtotalKobo: number;
  notes?: string;
  modifiers?: any;
  orderStatus?: string;
  timerEndsAt?: string;
  trackingCode?: string;
  declineReason?: string;
  createdAt?: string;
  _actionDone?: boolean;
}

export interface ApproveOrderRequest {
  department: string;
  estimatedPreparationTimeSeconds: number;
}

export interface DeclineOrderRequest {
  declineReason: string;
}

// ===== Notifications =====
export type NotificationType = 'low_stock' | 'shift_reminder' | 'payment' | 'system' | 'order_ready' | 'order_approved';

export interface Notification {
  id: string;
  branchId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  data?: { orderId?: string; tabId?: string };
}

export interface AuditLog {
  id: string;
  branchId: string;
  userId?: string;
  action: string;
  entityId?: string;
  entityType?: string;
  payload?: any;
  createdAt: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==========================================
// Country → Currency + Timezone mapping
// ==========================================

export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', currencySymbol: '₦', timezone: 'Africa/Lagos' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', currencySymbol: 'GH₵', timezone: 'Africa/Accra' },
  { code: 'KE', name: 'Kenya', currency: 'KES', currencySymbol: 'KSh', timezone: 'Africa/Nairobi' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', currencySymbol: 'R', timezone: 'Africa/Johannesburg' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', currencySymbol: 'E£', timezone: 'Africa/Cairo' },
  { code: 'MA', name: 'Morocco', currency: 'MAD', currencySymbol: 'MAD', timezone: 'Africa/Casablanca' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', currencySymbol: 'TSh', timezone: 'Africa/Dar_es_Salaam' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', currencySymbol: 'USh', timezone: 'Africa/Kampala' },
  { code: 'US', name: 'United States', currency: 'USD', currencySymbol: '$', timezone: 'America/New_York' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', currencySymbol: '£', timezone: 'Europe/London' },
  { code: 'DE', name: 'Germany', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Berlin' },
  { code: 'FR', name: 'France', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Paris' },
  { code: 'CA', name: 'Canada', currency: 'CAD', currencySymbol: 'C$', timezone: 'America/Toronto' },
  { code: 'AE', name: 'UAE', currency: 'AED', currencySymbol: 'AED', timezone: 'Asia/Dubai' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', currencySymbol: 'SR', timezone: 'Asia/Riyadh' },
  { code: 'IN', name: 'India', currency: 'INR', currencySymbol: '₹', timezone: 'Asia/Kolkata' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', currencySymbol: 'R$', timezone: 'America/Sao_Paulo' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', currencySymbol: 'MX$', timezone: 'America/Mexico_City' },
];

export function getCountryByCode(code: string): CountryInfo | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export function getCountryByCurrency(currency: string): CountryInfo | undefined {
  return COUNTRIES.find(c => c.currency === currency);
}
