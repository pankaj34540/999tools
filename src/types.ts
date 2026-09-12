export type UserRole = 'user' | 'vle' | 'owner';

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
