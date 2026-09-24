export type UserRole = 'user' | 'vle' | 'owner';

export type UserPlan = 'free' | 'premium' | 'vle';
export type SubscriptionStatus = 'active' | 'expired' | 'pending' | 'cancelled';
export type BillingCycle = 'monthly' | 'yearly';

export interface VleData {
  vleId: string;
  centerName: string;
  operatorName: string;
  mobile: string;
  state: string;
  district: string;
  address?: string;
  cscId?: string;
  status: 'active' | 'suspended' | 'pending';
  kycVerified: boolean;
  totalOrdersCompleted: number;
  joinedDate: string;
  shopUpiId?: string;
  shopNoticeBanner?: string;
  shopWatermarkText?: string;
  shopWatermarkPurpose?: string;
  shopWatermarkStampEnabled?: boolean;
  shopStampColor?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  mobile?: string;
  plan: UserPlan;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  subscriptionStatus: SubscriptionStatus;
  createdAt: string;
  lastLoginAt?: string;
  vleData?: VleData;
}

// ============================================
// BILLING SOFTWARE TYPES
// ============================================
export interface BillItem {
  id: string;
  name: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  gstRate: number;
  discount?: number;
  amount: number;
}

export type PaymentMode = 'cash' | 'upi' | 'card' | 'credit' | 'mixed';
export type BillStatus = 'paid' | 'unpaid' | 'partial';

export interface Bill {
  id: string;
  billNumber: string;
  vleId: string;
  vleCenterName: string;
  vleMobile: string;
  vleAddress?: string;
  vleGstin?: string;
  
  customerName: string;
  customerMobile?: string;
  customerGstin?: string;
  customerAddress?: string;
  
  items: BillItem[];
  
  subtotal: number;
  itemDiscount: number;
  billDiscount: number;
  discountAmount: number;
  gstEnabled: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  roundOff: number;
  grandTotal: number;
  
  paymentMode: PaymentMode;
  status: BillStatus;
  paidAmount: number;
  balanceAmount: number;
  
  notes?: string;
  date: string;
  timestamp: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BillStats {
  vleId: string;
  todayBills: number;
  todayRevenue: number;
  todayPaid: number;
  todayUnpaid: number;
  monthBills: number;
  monthRevenue: number;
  monthPaid: number;
  monthUnpaid: number;
  totalBills: number;
  totalRevenue: number;
  averageBillValue: number;
}

// ============================================
// LEGACY VLE OPERATOR
// ============================================
export interface VleOperator {
  id: string;
  vleId: string;
  password?: string;
  centerName: string;
  operatorName: string;
  mobile: string;
  email: string;
  state: string;
  district: string;
  address?: string;
  walletBalance: number;
  membershipPlan?: 'lifetime_vip' | 'regular';
  status: 'active' | 'suspended' | 'pending';
  kycVerified: boolean;
  totalOrdersCompleted: number;
  joinedDate: string;
  shopUpiId?: string;
  shopNoticeBanner?: string;
  shopWatermarkText?: string;
  shopWatermarkPurpose?: string;
  shopWatermarkStampEnabled?: boolean;
  shopStampColor?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  subscriptionStatus?: SubscriptionStatus;
}

export interface ToolUsage {
  id: string;
  userId: string;
  toolId: string;
  date: string;
  count: number;
  lastUsedAt: string;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userMobile?: string;
  plan: 'premium' | 'vle';
  billingCycle: BillingCycle;
  amount: number;
  utr: string;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  validUntil?: string;
}

export interface PricingPlan {
  id: 'free' | 'premium' | 'vle';
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  premiumToolLimit: number;
  showAds: boolean;
}

export interface SubscriptionStats {
  totalFreeUsers: number;
  totalPremiumUsers: number;
  totalVleUsers: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  pendingPayments: number;
}

// ============================================
// KHATABOOK / LEDGER
// ============================================
export type LedgerEntryType = 
  | 'credit'
  | 'debit'
  | 'sale'
  | 'expense'
  | 'payment_in'
  | 'payment_out'
  | 'adjustment';

export interface LedgerEntry {
  id: string;
  vleId: string;
  vleCenterName: string;
  customerName: string;
  customerMobile: string;
  customerAddress?: string;
  type: LedgerEntryType;
  amount: number;
  description: string;
  category?: string;
  paidAmount?: number;
  pendingAmount?: number;
  date: string;
  timestamp: string;
  attachmentUrl?: string;
  notes?: string;
  billId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerLedgerSummary {
  customerMobile: string;
  customerName: string;
  customerAddress?: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  balanceType: 'receivable' | 'payable' | 'settled';
  totalTransactions: number;
  lastTransactionDate: string;
  lastTransactionAmount: number;
  lastTransactionType: LedgerEntryType;
  firstTransactionDate: string;
}

export interface KhatabookStats {
  vleId: string;
  totalCustomers: number;
  totalReceivable: number;
  totalPayable: number;
  netBalance: number;
  todayTransactions: number;
  todaySales: number;
  todayReceived: number;
  monthTransactions: number;
  monthSales: number;
  monthReceived: number;
  topCustomers: CustomerLedgerSummary[];
}

export interface LedgerFilterOptions {
  customerMobile?: string;
  type?: LedgerEntryType;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

// ============================================
// SITE CONFIG
// ============================================
export interface AdsterraConfig {
  enabled: boolean;
  headerBannerActive: boolean;
  headerBannerCode: string;
  toolBannerActive: boolean;
  toolBannerCode: string;
  sidebarAdActive: boolean;
  sidebarAdCode: string;
  nativeBannerActive: boolean;
  nativeBannerCode: string;
  directLinkActive: boolean;
  directLinkUrl: string;
  directLinkFrequency: number;
  socialBarActive: boolean;
  socialBarCode: string;
  testMode: boolean;
}

export interface SiteConfig {
  siteName: string;
  tagline: string;
  supportPhone: string;
  supportWhatsApp: string;
  supportEmail: string;
  upiId: string;
  upiQrUrl: string;
  noticeMarquee: string;
  noticeEnabled: boolean;
  maintenanceMode: boolean;
  defaultVleCommissionRate: number;
  allowPublicRegistrations: boolean;
  targetToolsGoal: number;
  adsterra: AdsterraConfig;
  vleOneTimeFee: number;
  ownerSecurityPin: string;
  ownerPassword?: string;
  premiumMonthlyPrice: number;
  premiumYearlyPrice: number;
  vleMonthlyPrice: number;
  vleYearlyPrice: number;
  freeUserDailyLimit: number;
}

export interface ImportantLink {
  id: string;
  title: string;
  desc: string;
  url: string;
  badge: string;
  category?: 'central_govt' | 'state_govt' | 'exam_jobs' | 'utility_csc';
  active: boolean;
}

export interface VleApplication {
  id: string;
  operatorName: string;
  centerName: string;
  mobile: string;
  email: string;
  state: string;
  district: string;
  address: string;
  cscId?: string;
  paymentUtr: string;
  paymentAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  generatedVleId?: string;
  generatedPassword?: string;
  approvedDate?: string;
  rejectionReason?: string;
}

export type ToolCategory =
  | 'photo_exam'
  | 'pvc_print'
  | 'pdf_doc'
  | 'calculators'
  | 'cyber_business'
  | 'generators_daily'
  | 'social_media'
  | 'text_dev'
  | 'qr_gen'
  | 'security_util';

export interface ToolDefinition {
  num: number;
  id: string;
  name: string;
  shortName?: string;
  category: ToolCategory;
  description: string;
  badge?: string;
  tags: string[];
  popular?: boolean;
  vleEssential?: boolean;
  isPremium?: boolean;
  iconName: string;
  componentKey: string;
  externalUrl?: string;
  isCustom?: boolean;
  active?: boolean;
}

export interface ToolRequestItem {
  id: string;
  toolName: string;
  category: string;
  description: string;
  requestedBy: string;
  votes: number;
  status: 'planned' | 'in_review' | 'building' | 'live';
  createdAt: string;
}

// ⚠️ Purana ServiceItem aur ServiceCategory — VLE Portal ke liye
export type ServiceCategory = 
  | 'photo_tools'
  | 'govt_schemes'
  | 'pan_aadhaar'
  | 'exam_admit'
  | 'certificates'
  | 'banking_utility';

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  userPrice: number;
  vlePrice: number;
  vleCommission: number;
  iconName: string;
  enabled: boolean;
  popular?: boolean;
  isExternalLink?: boolean;
  externalUrl?: string;
  requiresUpload?: boolean;
}

export interface CustomerOrder {
  id: string;
  tokenNumber: string;
  customerName: string;
  customerMobile: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  vleId?: string;
  vleCenterName?: string;
  status: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected';
  date: string;
  notes?: string;
  rejectionReason?: string;
  outputDocUrl?: string;
}

export interface WalletTransaction {
  id: string;
  vleId: string;
  vleName: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  timestamp: string;
  balanceAfter: number;
  status: 'completed' | 'pending' | 'rejected';
}

// ============================================
// SUPPORT SYSTEM TYPES
// ============================================
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportTicketCategory = 
  | 'technical'
  | 'billing'
  | 'account'
  | 'tool_request'
  | 'vle_issue'
  | 'payment'
  | 'other';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId?: string;
  userEmail: string;
  userName: string;
  userMobile?: string;
  userRole: UserRole;
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  message: string;
  attachments?: string[];
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  responses: SupportResponse[];
}

export interface SupportResponse {
  id: string;
  ticketId: string;
  responderId: string;
  responderName: string;
  responderRole: 'owner' | 'user' | 'staff';
  message: string;
  createdAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
}

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResponseTime?: string;
  todayTickets: number;
}

export interface GovtExamPreset {
  id: string;
  examName: string;
  category: string;
  photoWidth: number;
  photoHeight: number;
  photoMinKb: number;
  photoMaxKb: number;
  signWidth: number;
  signHeight: number;
  signMinKb: number;
  signMaxKb: number;
  bgColor?: string;
  notes: string;
}

// ============================================
// CUSTOMER CRM TYPES (Phase 1)
// ============================================
export type CustomerTag = 'regular' | 'vip' | 'defaulter' | 'new' | 'wholesale' | 'followup';

export interface Customer {
  id: string;
  vleId: string;
  name: string;
  mobile: string;
  altMobile?: string;
  email?: string;
  address?: string;
  dob?: string;
  anniversary?: string;
  
  tags: CustomerTag[];
  notes?: string;
  whatsappOptIn: boolean;
  
  totalOrders: number;
  totalSpent: number;
  firstVisitDate: string;
  lastVisitDate?: string;
  
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerStats {
  vleId: string;
  totalCustomers: number;
  newThisMonth: number;
  activeThisMonth: number;
  topCustomers: Customer[];
  birthdaysThisWeek: Customer[];
  followups: Customer[];
}

export interface CustomerFilterOptions {
  searchQuery?: string;
  tag?: CustomerTag | 'all';
  sortBy?: 'name' | 'recent' | 'spent' | 'orders';
  dateFrom?: string;
  dateTo?: string;
}

// ============================================
// RECHARGE ORDERS (Phase 2)
// ============================================
export type RechargeType = 'mobile' | 'dth' | 'utility';

export type MobileOperator = 
  | 'Airtel' 
  | 'Jio' 
  | 'Vi' 
  | 'BSNL' 
  | 'MTNL';

export type DthOperator = 
  | 'Tata Play' 
  | 'Airtel Digital TV' 
  | 'Dish TV' 
  | 'Sun Direct' 
  | 'd2h' 
  | 'DD Free Dish';

export type UtilityType = 
  | 'electricity' 
  | 'water' 
  | 'gas' 
  | 'broadband' 
  | 'landline';

export type RechargeStatus = 
  | 'pending_payment'
  | 'payment_submitted'
  | 'payment_verified'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'refunded';

export interface RechargeOrder {
  id: string;
  tokenNumber: string;
  
  placedBy: 'user' | 'vle';
  userId?: string;
  vleId?: string;
  vleCenterName?: string;
  vleMobile?: string;
  
  type: RechargeType;
  operator: string;
  accountNumber: string;
  accountName?: string;
  amount: number;
  commission: number;
  
  utilityType?: UtilityType;
  circle?: string;
  notes?: string;
  
  paymentMode: 'upi' | 'cash';
  utr?: string;
  screenshotUrl?: string;
  paidAmount?: number;
  
  rechargeRefNumber?: string;
  rechargeDate?: string;
  
  status: RechargeStatus;
  rejectionReason?: string;
  
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface RechargeOrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  rejected: number;
  totalRevenue: number;
  totalCommission: number;
  todayCount: number;
  todayAmount: number;
}

export interface RechargeOperatorPreset {
  id: string;
  type: RechargeType;
  name: string;
  logo?: string;
  popular?: boolean;
}

// ============================================
// STAFF MANAGEMENT (Phase 2 — Admin Panel)
// ============================================
export type StaffRole = 'support' | 'vle' | 'payment' | 'recharge' | 'content';

export type StaffPermission = 
  | 'tickets_view' | 'tickets_reply' | 'tickets_close'
  | 'vle_view' | 'vle_approve' | 'vle_reject' | 'vle_suspend'
  | 'payments_view' | 'payments_approve' | 'payments_reject'
  | 'recharge_view' | 'recharge_verify' | 'recharge_process' | 'recharge_complete'
  | 'tools_view' | 'tools_edit'
  | 'links_view' | 'links_edit'
  | 'services_view' | 'services_edit'
  | 'customers_view'
  | 'analytics_view';

export interface Staff {
  id: string;
  uid: string;
  email: string;
  name: string;
  mobile?: string;
  role: StaffRole;
  permissions: StaffPermission[];
  active: boolean;
  createdBy: string;
  createdAt: string;
  lastLoginAt?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffRole: StaffRole;
  action: string;
  targetType: 'payment' | 'vle' | 'recharge' | 'ticket' | 'content' | 'staff' | 'other';
  targetId?: string;
  targetName?: string;
  details?: string;
  timestamp: string;
}

export const STAFF_ROLE_PERMISSIONS: Record<StaffRole, StaffPermission[]> = {
  support: [
    'tickets_view', 'tickets_reply', 'tickets_close',
    'customers_view',
  ],
  vle: [
    'vle_view', 'vle_approve', 'vle_reject', 'vle_suspend',
    'customers_view',
  ],
  payment: [
    'payments_view', 'payments_approve', 'payments_reject',
    'customers_view',
  ],
  recharge: [
    'recharge_view', 'recharge_verify', 'recharge_process', 'recharge_complete',
    'customers_view',
  ],
  content: [
    'tools_view', 'tools_edit',
    'links_view', 'links_edit',
    'services_view', 'services_edit',
  ],
};

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  support: '🎧 Support Admin',
  vle: '🏪 VLE Admin',
  payment: '💳 Payment Admin',
  recharge: '📱 Recharge Admin',
  content: '📝 Content Admin',
};

// ============================================
// 🆕 SERVICE ORDER SYSTEM (NEW — separate from VLE ServiceItem)
// Ye user-facing service orders ke liye hai (Google Form + Payment)
// ============================================

export interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  category: string;          // 'govt_id' | 'certificate' | 'utility' | 'other'
  price: number;             // in INR
  processingDays: number;
  icon: string;              // lucide icon name
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: string;
  serviceId: string;
  serviceName: string;
  price: number;
  
  // Customer details
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  aadhaarNumber: string;
  panNumber: string;
  dateOfBirth: string;
  fatherName: string;
  motherName: string;
  gender: string;
  category: string;          // General/OBC/SC/ST
  additionalData: Record<string, string>;
  
  // Documents (Google Drive links from form)
  documentLinks: string[];
  
  // Payment
  paymentMethod: 'upi' | 'instamojo' | 'cash';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentReference: string;
  paymentAmount: number;
  
  // Order status
  orderStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  ownerNotes: string;
  
  // Meta
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceSettings {
  googleFormUrl: string;
  serviceFieldId: string;
  ownerUpiId: string;
  ownerWhatsapp: string;
  updatedAt: string;
}
