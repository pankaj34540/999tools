export type UserRole = 'user' | 'vle' | 'owner';

export interface AdsterraConfig {
  enabled: boolean;
  headerBannerActive: boolean;
  headerBannerCode: string; // e.g. 728x90 banner or iframe
  toolBannerActive: boolean;
  toolBannerCode: string; // e.g. 300x250 or 468x60 inside tool
  sidebarAdActive: boolean;
  sidebarAdCode: string; // sticky 160x600 or 300x250
  directLinkActive: boolean;
  directLinkUrl: string; // Popunder / Direct link URL
  directLinkFrequency: number; // e.g. 1 = every click, 2 = every 2nd download click
  socialBarActive: boolean;
  socialBarCode: string; // Social Bar / In-page Push code
  testMode: boolean; // Show test placeholders if real code is empty
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
  defaultVleCommissionRate: number; // percentage or fixed
  allowPublicRegistrations: boolean;
  targetToolsGoal: number; // 999
  adsterra: AdsterraConfig;
  vleOneTimeFee: number; // One-time lifetime registration fee (e.g. ₹299)
  ownerSecurityPin: string; // Master security PIN for Owner Panel (e.g. "9999")
  ownerPassword?: string; // Master password for Owner Panel (e.g. "admin@999")
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
  | 'generators_daily';

export interface ToolDefinition {
  num: number; // e.g. 1, 2, ..., 50 (display as #001, #002)
  id: string;
  name: string;
  shortName?: string;
  category: ToolCategory;
  description: string;
  badge?: string; // e.g. 'Hot', '4x6 Lab', 'Govt Form', 'CSC Favorite'
  tags: string[];
  popular?: boolean;
  vleEssential?: boolean;
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
  requestedBy: string; // 'Cyber Cafe VLE' or 'Student'
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
  userPrice: number; // ₹ (0 for free)
  vlePrice: number; // cost to VLE
  vleCommission: number; // ₹ earned by VLE
  iconName: string;
  enabled: boolean;
  popular?: boolean;
  isExternalLink?: boolean;
  externalUrl?: string;
  requiresUpload?: boolean;
}

export interface VleOperator {
  id: string;
  vleId: string; // e.g. VLE-999-102
  password?: string; // Operator login password
  centerName: string; // e.g. Maa Durga Cyber Cafe & CSC
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
}

export interface CustomerOrder {
  id: string;
  tokenNumber: string; // e.g. 999-2026-0042
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
