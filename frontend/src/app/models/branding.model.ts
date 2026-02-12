// Branding Configuration Models

export interface BrandingConfig {
  id: string;
  organizationId: string;
  serviceId: string;
  
  // Logo
  logoUrl?: string;
  logoBase64?: string;
  logoFileName?: string;
  
  // Couleurs
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  sidebarBackgroundColor: string;
  sidebarTextColor: string;
  
  // Email Templates
  emailHeaderHtml?: string;
  emailFooterHtml?: string;
  emailPrimaryColor: string;
  emailLogoUrl?: string;
  
  // PDF Configuration
  pdfHeaderEnabled: boolean;
  pdfHeaderLogoPosition: 'left' | 'center' | 'right';
  pdfHeaderText?: string;
  pdfFooterText?: string;
  pdfPrimaryColor: string;
  
  // Meta
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandingPreview {
  type: 'interface' | 'email' | 'pdf';
  html?: string;
}

export const DEFAULT_BRANDING: Partial<BrandingConfig> = {
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  accentColor: '#10b981',
  headerBackgroundColor: '#ffffff',
  headerTextColor: '#1e293b',
  sidebarBackgroundColor: '#1e293b',
  sidebarTextColor: '#94a3b8',
  emailPrimaryColor: '#3b82f6',
  pdfHeaderEnabled: true,
  pdfHeaderLogoPosition: 'left',
  pdfPrimaryColor: '#3b82f6',
  isActive: true
};
