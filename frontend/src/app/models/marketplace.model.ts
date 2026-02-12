// Marketplace Models

export interface ServicePack {
  id: string;
  serviceId: string;  // 'medlabs', 'medradio', etc.
  name: string;
  tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  description: string;
  price: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  features: PackFeature[];
  limits: PackLimits;
  popular?: boolean;
  color: string;
  icon: string;
}

export interface PackFeature {
  name: string;
  included: boolean;
  description?: string;
}

export interface PackLimits {
  maxUsers?: number;
  maxResultsPerMonth?: number;
  maxStorageGB?: number;
  maxPatients?: number;
  apiAccess?: boolean;
  supportLevel: 'EMAIL' | 'PRIORITY' | 'DEDICATED';
}

export interface Addon {
  id: string;
  serviceId: string;
  category: AddonCategory;
  name: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  currency: string;
  billingType: 'ONE_TIME' | 'MONTHLY' | 'YEARLY' | 'PER_USE';
  icon: string;
  color: string;
  features: string[];
  requirements?: string[];
  popular?: boolean;
  isNew?: boolean;
  screenshots?: string[];
}

export type AddonCategory = 
  | 'COMMUNICATION'
  | 'AUTOMATION'
  | 'INTEGRATION'
  | 'ANALYTICS'
  | 'SECURITY'
  | 'STORAGE'
  | 'SUPPORT'
  | 'CUSTOMIZATION';

export interface Subscription {
  id: string;
  organizationId: string;
  serviceId: string;
  packId: string;
  pack?: ServicePack;
  addons: SubscribedAddon[];
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';
  startDate: Date;
  endDate?: Date;
  nextBillingDate: Date;
  totalMonthlyPrice: number;
}

export interface SubscribedAddon {
  addonId: string;
  addon?: Addon;
  subscribedAt: Date;
  status: 'ACTIVE' | 'PENDING' | 'CANCELLED';
}

export interface MarketplaceStats {
  currentPack: ServicePack;
  activeAddons: number;
  totalMonthlySpend: number;
  nextBillingDate: Date;
  usageStats: UsageStats;
}

export interface UsageStats {
  usersUsed: number;
  usersLimit: number;
  storageUsedGB: number;
  storageLimitGB: number;
  resultsThisMonth: number;
  resultsLimit: number;
}
