export type UserRole = 'user' | 'vle' | 'owner';

export type UserPlan = 'free' | 'premium' | 'vle';
export type SubscriptionStatus = 'active' | 'expired' | 'pending' | 'cancelled';
export type BillingCycle = 'monthly' | 'yearly';

// ============================================
// UNIFIED USER ACCOUNT
// Har user (free/premium/vle) ka ek hi account
// VLE data alag object mein nested hoga
// ============================================
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
  // 🆕 VLE Data (agar plan === 'vle' hai)
  vleData?: VleData;
}

// ============================================
// LEGACY VLE OPERATOR
// (backward compatibility ke liye rakha hai)
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

// ============================================
// TOOL USAGE (Daily Limits)
// ============================================
export interface ToolUsage {
  id: string;
  userId: string;
  toolId: string;
  date: string;
  count: number;
  lastUsedAt: string;
}

// ============================================
// PAYMENT REQUEST
// ============================================
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

// ============================================
// PRICING & STATS
// ============================================
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
// SITE CONFIG & ADSTERRA
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

// ============================================
// LINKS, APPLICATIONS, SERVICES
// ============================================
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
  | 'generators_daily';

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
