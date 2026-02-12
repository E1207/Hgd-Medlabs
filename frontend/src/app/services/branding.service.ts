import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, delay, tap } from 'rxjs';
import { BrandingConfig, DEFAULT_BRANDING } from '../models/branding.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BrandingService {
  private apiUrl = `${environment.apiUrl}/branding`;
  
  private brandingConfig$ = new BehaviorSubject<BrandingConfig | null>(null);
  
  // Mock data - à remplacer par des appels API réels
  private mockConfig: BrandingConfig = {
    id: 'branding-001',
    organizationId: 'hgd-001',
    serviceId: 'medlabs',
    logoUrl: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    accentColor: '#10b981',
    headerBackgroundColor: '#ffffff',
    headerTextColor: '#1e293b',
    sidebarBackgroundColor: '#1e293b',
    sidebarTextColor: '#94a3b8',
    emailPrimaryColor: '#3b82f6',
    emailHeaderHtml: '',
    emailFooterHtml: '<p style="text-align: center; color: #64748b; font-size: 12px;">© 2026 Hôpital Général de Douala - Tous droits réservés</p>',
    pdfHeaderEnabled: true,
    pdfHeaderLogoPosition: 'left',
    pdfHeaderText: 'Hôpital Général de Douala - Laboratoire d\'Analyses Médicales',
    pdfFooterText: 'Document généré automatiquement - Ne pas modifier',
    pdfPrimaryColor: '#3b82f6',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date()
  };

  constructor(private http: HttpClient) {
    this.loadBrandingConfig();
  }

  private loadBrandingConfig(): void {
    // Charger la config depuis localStorage ou API
    const saved = localStorage.getItem('brandingConfig');
    if (saved) {
      try {
        this.mockConfig = { ...this.mockConfig, ...JSON.parse(saved) };
      } catch (e) {}
    }
    this.brandingConfig$.next(this.mockConfig);
  }

  getBrandingConfig(): Observable<BrandingConfig> {
    return of(this.mockConfig).pipe(delay(300));
  }

  getBrandingConfigSync(): BrandingConfig | null {
    return this.brandingConfig$.value;
  }

  watchBrandingConfig(): Observable<BrandingConfig | null> {
    return this.brandingConfig$.asObservable();
  }

  updateBrandingConfig(config: Partial<BrandingConfig>): Observable<BrandingConfig> {
    this.mockConfig = {
      ...this.mockConfig,
      ...config,
      updatedAt: new Date()
    };
    
    // Sauvegarder en localStorage
    localStorage.setItem('brandingConfig', JSON.stringify(this.mockConfig));
    
    // Appliquer les couleurs personnalisées immédiatement
    this.applyBrandingStyles(this.mockConfig);
    
    this.brandingConfig$.next(this.mockConfig);
    
    return of(this.mockConfig).pipe(delay(500));
  }

  uploadLogo(file: File): Observable<{ url: string }> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.mockConfig.logoBase64 = base64;
        this.mockConfig.logoFileName = file.name;
        this.mockConfig.logoUrl = base64; // En prod, ce serait une URL serveur
        localStorage.setItem('brandingConfig', JSON.stringify(this.mockConfig));
        this.brandingConfig$.next(this.mockConfig);
        observer.next({ url: base64 });
        observer.complete();
      };
      reader.onerror = () => observer.error(new Error('Erreur de lecture du fichier'));
      reader.readAsDataURL(file);
    });
  }

  removeLogo(): Observable<void> {
    this.mockConfig.logoBase64 = undefined;
    this.mockConfig.logoFileName = undefined;
    this.mockConfig.logoUrl = undefined;
    localStorage.setItem('brandingConfig', JSON.stringify(this.mockConfig));
    this.brandingConfig$.next(this.mockConfig);
    return of(undefined).pipe(delay(300));
  }

  resetToDefaults(): Observable<BrandingConfig> {
    this.mockConfig = {
      ...this.mockConfig,
      ...DEFAULT_BRANDING,
      updatedAt: new Date()
    };
    localStorage.setItem('brandingConfig', JSON.stringify(this.mockConfig));
    this.applyBrandingStyles(this.mockConfig);
    this.brandingConfig$.next(this.mockConfig);
    return of(this.mockConfig).pipe(delay(300));
  }

  applyBrandingStyles(config: BrandingConfig): void {
    const root = document.documentElement;
    
    // Appliquer les variables CSS
    root.style.setProperty('--brand-primary', config.primaryColor);
    root.style.setProperty('--brand-secondary', config.secondaryColor);
    root.style.setProperty('--brand-accent', config.accentColor);
    root.style.setProperty('--brand-header-bg', config.headerBackgroundColor);
    root.style.setProperty('--brand-header-text', config.headerTextColor);
    root.style.setProperty('--brand-sidebar-bg', config.sidebarBackgroundColor);
    root.style.setProperty('--brand-sidebar-text', config.sidebarTextColor);
  }

  generateEmailPreview(config: BrandingConfig): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .email-container { max-width: 600px; margin: 0 auto; }
          .email-header { background: ${config.emailPrimaryColor}; padding: 20px; text-align: center; }
          .email-header img { max-height: 60px; }
          .email-body { padding: 30px; background: #ffffff; }
          .email-footer { padding: 20px; background: #f8fafc; text-align: center; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${config.logoUrl ? `<img src="${config.logoUrl}" alt="Logo">` : '<h2 style="color: white; margin: 0;">Votre Logo</h2>'}
          </div>
          <div class="email-body">
            <h1 style="color: ${config.emailPrimaryColor};">Vos résultats sont disponibles</h1>
            <p>Bonjour <strong>John Doe</strong>,</p>
            <p>Vos résultats d'analyses médicales sont maintenant disponibles.</p>
            <p>Référence: <strong>LAB-2026-001234</strong></p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: ${config.emailPrimaryColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Consulter mes résultats
              </a>
            </div>
            <p>Votre code OTP: <strong style="font-size: 24px; color: ${config.emailPrimaryColor};">123456</strong></p>
          </div>
          <div class="email-footer">
            ${config.emailFooterHtml || '<p style="color: #64748b; font-size: 12px;">© 2026 - Tous droits réservés</p>'}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generatePdfPreview(config: BrandingConfig): string {
    const logoPosition = config.pdfHeaderLogoPosition;
    const logoAlign = logoPosition === 'left' ? 'flex-start' : logoPosition === 'right' ? 'flex-end' : 'center';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .pdf-container { border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto; }
          .pdf-header { 
            display: flex; 
            align-items: center; 
            justify-content: ${logoAlign}; 
            padding: 20px; 
            border-bottom: 3px solid ${config.pdfPrimaryColor};
            gap: 20px;
          }
          .pdf-header img { max-height: 50px; }
          .pdf-header-text { color: ${config.pdfPrimaryColor}; font-size: 14px; }
          .pdf-body { padding: 30px; min-height: 300px; }
          .pdf-footer { padding: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <div class="pdf-header">
            ${config.logoUrl ? `<img src="${config.logoUrl}" alt="Logo">` : '<div style="width: 50px; height: 50px; background: #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #94a3b8;">Logo</div>'}
            ${config.pdfHeaderText ? `<span class="pdf-header-text">${config.pdfHeaderText}</span>` : ''}
          </div>
          <div class="pdf-body">
            <h2 style="color: ${config.pdfPrimaryColor}; margin-top: 0;">RÉSULTATS D'ANALYSES MÉDICALES</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Patient:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">John DOE</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">12/02/2026</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Référence:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">LAB-2026-001234</td>
              </tr>
            </table>
            <p style="margin-top: 30px; color: #64748b;">Contenu du résultat d'analyse...</p>
          </div>
          <div class="pdf-footer">
            ${config.pdfFooterText || 'Document généré automatiquement'}
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
