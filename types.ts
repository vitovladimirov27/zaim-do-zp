export interface MfoBrand {
  id: string;
  name: string;
  rating: number;
  maxAmount: number;
  minAmount: number;
  dailyRate: number; // Daily percentage, e.g. 0.8
  minTerm: number; // Days
  maxTerm: number; // Days
  approvalRate: number; // % e.g. 98
  ageMin: number;
  ageMax: number;
  documents: string[];
  cbLicense: string;
  cbDate: string;
  partnerUrl: string;
  logoColor: string; // Tailwind bg-gradient or color
  logoText: string;
  isFirstPromoZero: boolean;
  payoutMethods: string[];
  isActive: boolean;
  features: string[];
  seoDescription: string;
  psk?: number; // Custom Full Cost of Credit percentage, e.g. 292
}

export interface SeoCategory {
  id: string;
  tag: string;
  title: string;
  metaDescription: string;
  h1: string;
  keywords: string;
  seoText: string;
  faqs: { q: string; a: string }[];
}

export interface ClickLog {
  id: string;
  brandId: string;
  brandName: string;
  timestamp: string;
  subId: string;
  converted: boolean;
  commission: number;
}

export interface WebmasterStats {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  epc: number;
}
