import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, delay, tap } from 'rxjs';
import { 
  ServicePack, 
  Addon, 
  Subscription, 
  MarketplaceStats,
  AddonCategory 
} from '../models/marketplace.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MarketplaceService {
  private apiUrl = `${environment.apiUrl}/marketplace`;
  
  // BehaviorSubject pour écouter les changements d'abonnement
  private subscriptionSubject = new BehaviorSubject<Subscription | null>(null);

  // Données de démonstration - à remplacer par des appels API réels
  private mockPacks: ServicePack[] = [
    // MedLabs Packs
    {
      id: 'medlabs-starter',
      serviceId: 'medlabs',
      name: 'Starter',
      tier: 'STARTER',
      description: 'Idéal pour les petits laboratoires débutant avec la digitalisation',
      price: 49000,
      currency: 'XAF',
      billingCycle: 'MONTHLY',
      color: '#64748b',
      icon: 'rocket_launch',
      features: [
        { name: 'Import manuel des résultats', included: true },
        { name: 'Envoi par email', included: true },
        { name: 'Envoi par WhatsApp', included: false },
        { name: 'Import automatique (scanner)', included: false },
        { name: 'Rapports & statistiques', included: false },
        { name: 'Multi-utilisateurs', included: false },
        { name: 'API externe', included: false },
        { name: 'Support dédié', included: false }
      ],
      limits: {
        maxUsers: 2,
        maxResultsPerMonth: 100,
        maxStorageGB: 5,
        supportLevel: 'EMAIL'
      }
    },
    {
      id: 'medlabs-pro',
      serviceId: 'medlabs',
      name: 'Professional',
      tier: 'PROFESSIONAL',
      description: 'Pour les laboratoires en croissance avec des besoins avancés',
      price: 149000,
      currency: 'XAF',
      billingCycle: 'MONTHLY',
      popular: true,
      color: '#3b82f6',
      icon: 'verified',
      features: [
        { name: 'Import manuel des résultats', included: true },
        { name: 'Envoi par email', included: true },
        { name: 'Envoi par WhatsApp', included: true },
        { name: 'Import automatique (scanner)', included: true },
        { name: 'Rapports & statistiques', included: true },
        { name: 'Multi-utilisateurs', included: true },
        { name: 'API externe', included: false },
        { name: 'Support dédié', included: false }
      ],
      limits: {
        maxUsers: 10,
        maxResultsPerMonth: 500,
        maxStorageGB: 50,
        supportLevel: 'PRIORITY'
      }
    },
    {
      id: 'medlabs-enterprise',
      serviceId: 'medlabs',
      name: 'Enterprise',
      tier: 'ENTERPRISE',
      description: 'Solution complète pour les grands établissements hospitaliers',
      price: 349000,
      currency: 'XAF',
      billingCycle: 'MONTHLY',
      color: '#8b5cf6',
      icon: 'diamond',
      features: [
        { name: 'Import manuel des résultats', included: true },
        { name: 'Envoi par email', included: true },
        { name: 'Envoi par WhatsApp', included: true },
        { name: 'Import automatique (scanner)', included: true },
        { name: 'Rapports & statistiques avancés', included: true },
        { name: 'Multi-utilisateurs illimités', included: true },
        { name: 'API externe complète', included: true },
        { name: 'Support dédié 24/7', included: true }
      ],
      limits: {
        maxUsers: -1, // illimité
        maxResultsPerMonth: -1,
        maxStorageGB: 500,
        apiAccess: true,
        supportLevel: 'DEDICATED'
      }
    }
  ];

  private mockAddons: Addon[] = [
    // Communication
    {
      id: 'addon-whatsapp-bulk',
      serviceId: 'medlabs',
      category: 'COMMUNICATION',
      name: 'WhatsApp Bulk Sender',
      shortDescription: 'Envoi en masse de notifications WhatsApp',
      fullDescription: 'Envoyez des notifications WhatsApp à plusieurs patients simultanément. Parfait pour les rappels de rendez-vous ou les campagnes d\'information.',
      price: 25000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'send',
      color: '#25D366',
      popular: true,
      features: [
        'Envoi jusqu\'à 1000 messages/jour',
        'Templates personnalisables',
        'Planification des envois',
        'Rapports de délivrabilité'
      ]
    },
    {
      id: 'addon-sms-gateway',
      serviceId: 'medlabs',
      category: 'COMMUNICATION',
      name: 'SMS Gateway',
      shortDescription: 'Notifications SMS pour les patients sans WhatsApp',
      fullDescription: 'Atteignez tous vos patients avec des notifications SMS. Idéal pour les zones avec faible couverture internet.',
      price: 35000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'sms',
      color: '#f59e0b',
      features: [
        '500 SMS inclus/mois',
        'SMS supplémentaires à 25 XAF',
        'Accusés de réception',
        'Numéros courts personnalisés'
      ]
    },
    // Automation
    {
      id: 'addon-auto-reminder',
      serviceId: 'medlabs',
      category: 'AUTOMATION',
      name: 'Auto Reminder Pro',
      shortDescription: 'Rappels automatiques intelligents',
      fullDescription: 'Système de rappels automatiques pour les résultats non récupérés et les rendez-vous de suivi.',
      price: 20000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'schedule_send',
      color: '#10b981',
      isNew: true,
      features: [
        'Rappels J+1, J+3, J+7 automatiques',
        'Escalade vers le médecin',
        'Règles personnalisables',
        'Tableau de bord de suivi'
      ]
    },
    {
      id: 'addon-ocr-scanner',
      serviceId: 'medlabs',
      category: 'AUTOMATION',
      name: 'OCR Scanner Avancé',
      shortDescription: 'Extraction automatique des données patient',
      fullDescription: 'Technologie OCR avancée pour extraire automatiquement les informations patient des résultats scannés.',
      price: 45000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'document_scanner',
      color: '#6366f1',
      features: [
        'Reconnaissance de 50+ formats',
        'Extraction nom, prénom, date',
        'Détection automatique du type d\'analyse',
        'Taux de précision >95%'
      ]
    },
    // Integration
    {
      id: 'addon-lis-connect',
      serviceId: 'medlabs',
      category: 'INTEGRATION',
      name: 'LIS Connect',
      shortDescription: 'Intégration avec votre système LIS existant',
      fullDescription: 'Connectez MedLabs à votre système d\'information de laboratoire (LIS) existant pour une synchronisation automatique.',
      price: 75000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'hub',
      color: '#ec4899',
      features: [
        'Compatibilité HL7 & FHIR',
        'Sync bidirectionnelle',
        'Mapping de champs personnalisé',
        'Support technique inclus'
      ]
    },
    {
      id: 'addon-api-premium',
      serviceId: 'medlabs',
      category: 'INTEGRATION',
      name: 'API Premium',
      shortDescription: 'Accès API complet avec rate limits élevés',
      fullDescription: 'API REST complète pour intégrer MedLabs à vos propres applications et systèmes.',
      price: 50000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'api',
      color: '#14b8a6',
      features: [
        '10,000 requêtes/jour',
        'Webhooks temps réel',
        'Documentation complète',
        'Sandbox de test'
      ]
    },
    // Analytics
    {
      id: 'addon-analytics-pro',
      serviceId: 'medlabs',
      category: 'ANALYTICS',
      name: 'Analytics Pro',
      shortDescription: 'Tableaux de bord et rapports avancés',
      fullDescription: 'Visualisez vos données avec des tableaux de bord interactifs et des rapports personnalisables.',
      price: 30000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'insights',
      color: '#f97316',
      popular: true,
      features: [
        'Tableaux de bord personnalisables',
        'Export PDF/Excel',
        'Rapports planifiés par email',
        'Analyse des tendances'
      ]
    },
    {
      id: 'addon-bi-connector',
      serviceId: 'medlabs',
      category: 'ANALYTICS',
      name: 'BI Connector',
      shortDescription: 'Connexion à Power BI, Tableau, etc.',
      fullDescription: 'Connectez vos données MedLabs à votre outil de Business Intelligence préféré.',
      price: 40000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'analytics',
      color: '#8b5cf6',
      features: [
        'Compatible Power BI, Tableau, Metabase',
        'Données en temps réel',
        'Modèles de rapports inclus',
        'Sécurité SSO'
      ]
    },
    // Security
    {
      id: 'addon-2fa',
      serviceId: 'medlabs',
      category: 'SECURITY',
      name: 'Authentification 2FA',
      shortDescription: 'Double authentification pour tous les utilisateurs',
      fullDescription: 'Renforcez la sécurité avec l\'authentification à deux facteurs obligatoire.',
      price: 15000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'security',
      color: '#ef4444',
      features: [
        'SMS, Email ou App Authenticator',
        'Gestion des appareils de confiance',
        'Logs de connexion détaillés',
        'Alertes de sécurité'
      ]
    },
    {
      id: 'addon-audit-trail',
      serviceId: 'medlabs',
      category: 'SECURITY',
      name: 'Audit Trail Complet',
      shortDescription: 'Traçabilité complète de toutes les actions',
      fullDescription: 'Journal d\'audit détaillé pour la conformité réglementaire et la traçabilité.',
      price: 25000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'history',
      color: '#64748b',
      features: [
        'Log de toutes les actions',
        'Rétention 5 ans',
        'Export pour audit',
        'Alertes anomalies'
      ]
    },
    // Storage
    {
      id: 'addon-storage-100',
      serviceId: 'medlabs',
      category: 'STORAGE',
      name: 'Stockage +100 Go',
      shortDescription: '100 Go de stockage supplémentaire',
      fullDescription: 'Augmentez votre capacité de stockage pour archiver plus de résultats.',
      price: 20000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'cloud_upload',
      color: '#0ea5e9',
      features: [
        '100 Go supplémentaires',
        'Backup automatique',
        'Chiffrement AES-256',
        'Accès rapide'
      ]
    },
    {
      id: 'addon-archive-cold',
      serviceId: 'medlabs',
      category: 'STORAGE',
      name: 'Archive Longue Durée',
      shortDescription: 'Archivage économique pour vieux résultats',
      fullDescription: 'Archivez les résultats anciens à moindre coût tout en maintenant l\'accès.',
      price: 10000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'inventory_2',
      color: '#06b6d4',
      features: [
        'Stockage illimité',
        'Rétention 10 ans',
        'Accès sous 24h',
        'Conformité légale'
      ]
    },
    // Support
    {
      id: 'addon-support-premium',
      serviceId: 'medlabs',
      category: 'SUPPORT',
      name: 'Support Premium',
      shortDescription: 'Support prioritaire avec temps de réponse garanti',
      fullDescription: 'Obtenez une assistance prioritaire avec des SLA garantis.',
      price: 35000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'support_agent',
      color: '#a855f7',
      features: [
        'Réponse < 2h garantie',
        'Support téléphonique',
        'Account manager dédié',
        'Formation trimestrielle'
      ]
    },
    {
      id: 'addon-onsite-training',
      serviceId: 'medlabs',
      category: 'SUPPORT',
      name: 'Formation Sur Site',
      shortDescription: 'Formation personnalisée dans vos locaux',
      fullDescription: 'Un expert se déplace pour former votre équipe sur place.',
      price: 150000,
      currency: 'XAF',
      billingType: 'ONE_TIME',
      icon: 'school',
      color: '#84cc16',
      features: [
        'Journée complète de formation',
        'Jusqu\'à 15 participants',
        'Support de cours inclus',
        'Certification'
      ]
    },
    // Customization
    {
      id: 'addon-custom-branding',
      serviceId: 'medlabs',
      category: 'CUSTOMIZATION',
      name: 'Branding Personnalisé',
      shortDescription: 'Votre logo et couleurs sur tous les documents',
      fullDescription: 'Personnalisez l\'interface et les documents avec votre identité visuelle.',
      price: 25000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'palette',
      color: '#f43f5e',
      features: [
        'Logo sur l\'interface',
        'Couleurs personnalisées',
        'Templates email brandés',
        'PDF avec en-tête'
      ]
    },
    {
      id: 'addon-custom-domain',
      serviceId: 'medlabs',
      category: 'CUSTOMIZATION',
      name: 'Domaine Personnalisé',
      shortDescription: 'Utilisez votre propre nom de domaine',
      fullDescription: 'Accédez à MedLabs via votre propre URL (ex: resultats.votrehopital.cm).',
      price: 30000,
      currency: 'XAF',
      billingType: 'MONTHLY',
      icon: 'language',
      color: '#0891b2',
      isNew: true,
      features: [
        'URL personnalisée',
        'Certificat SSL inclus',
        'Configuration DNS assistée',
        'Redirection automatique'
      ]
    }
  ];

  private currentSubscription: Subscription = {
    id: 'sub-001',
    organizationId: 'hgd-001',
    serviceId: 'medlabs',
    packId: 'medlabs-pro',
    addons: [],
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    nextBillingDate: new Date('2026-03-01'),
    totalMonthlyPrice: 149000
  };

  constructor(private http: HttpClient) {
    this.loadSubscriptionFromStorage();
  }
  
  private loadSubscriptionFromStorage(): void {
    const saved = localStorage.getItem('marketplaceSubscription');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.currentSubscription = {
          ...this.currentSubscription,
          ...parsed,
          startDate: new Date(parsed.startDate),
          nextBillingDate: new Date(parsed.nextBillingDate),
          addons: (parsed.addons || []).map((a: any) => ({
            ...a,
            subscribedAt: new Date(a.subscribedAt)
          }))
        };
      } catch (e) {}
    }
    this.subscriptionSubject.next(this.currentSubscription);
  }
  
  private saveSubscriptionToStorage(): void {
    localStorage.setItem('marketplaceSubscription', JSON.stringify(this.currentSubscription));
    this.subscriptionSubject.next(this.currentSubscription);
  }
  
  // Observable pour écouter les changements
  watchSubscription(): Observable<Subscription | null> {
    return this.subscriptionSubject.asObservable();
  }
  
  // Vérifier si un add-on spécifique est actif
  isAddonActive(addonId: string): boolean {
    return this.currentSubscription.addons.some(
      a => a.addonId === addonId && a.status === 'ACTIVE'
    );
  }
  
  // Vérifier si le branding est actif
  isBrandingActive(): boolean {
    return this.isAddonActive('addon-custom-branding');
  }

  // Vérifier si Analytics Pro est actif
  isAnalyticsProActive(): boolean {
    return this.isAddonActive('addon-analytics-pro');
  }

  // Vérifier si Audit Trail est actif
  isAuditTrailActive(): boolean {
    return this.isAddonActive('addon-audit-trail');
  }

  // Vérifier si le 2FA est actif
  is2FAActive(): boolean {
    return this.isAddonActive('addon-2fa');
  }

  // Packs
  getPacks(serviceId: string): Observable<ServicePack[]> {
    // Mock - remplacer par: return this.http.get<ServicePack[]>(`${this.apiUrl}/packs?serviceId=${serviceId}`);
    return of(this.mockPacks.filter(p => p.serviceId === serviceId)).pipe(delay(300));
  }

  getPackById(packId: string): Observable<ServicePack | undefined> {
    return of(this.mockPacks.find(p => p.id === packId)).pipe(delay(200));
  }

  // Addons
  getAddons(serviceId: string, category?: AddonCategory): Observable<Addon[]> {
    let addons = this.mockAddons.filter(a => a.serviceId === serviceId);
    if (category) {
      addons = addons.filter(a => a.category === category);
    }
    return of(addons).pipe(delay(300));
  }

  getAddonById(addonId: string): Observable<Addon | undefined> {
    return of(this.mockAddons.find(a => a.id === addonId)).pipe(delay(200));
  }

  getAddonCategories(): AddonCategory[] {
    return [
      'COMMUNICATION',
      'AUTOMATION',
      'INTEGRATION',
      'ANALYTICS',
      'SECURITY',
      'STORAGE',
      'SUPPORT',
      'CUSTOMIZATION'
    ];
  }

  getCategoryLabel(category: AddonCategory): string {
    const labels: Record<AddonCategory, string> = {
      'COMMUNICATION': 'Communication',
      'AUTOMATION': 'Automatisation',
      'INTEGRATION': 'Intégrations',
      'ANALYTICS': 'Analytique',
      'SECURITY': 'Sécurité',
      'STORAGE': 'Stockage',
      'SUPPORT': 'Support',
      'CUSTOMIZATION': 'Personnalisation'
    };
    return labels[category];
  }

  getCategoryIcon(category: AddonCategory): string {
    const icons: Record<AddonCategory, string> = {
      'COMMUNICATION': 'forum',
      'AUTOMATION': 'auto_fix_high',
      'INTEGRATION': 'hub',
      'ANALYTICS': 'bar_chart',
      'SECURITY': 'shield',
      'STORAGE': 'cloud',
      'SUPPORT': 'support_agent',
      'CUSTOMIZATION': 'brush'
    };
    return icons[category];
  }

  // Subscription
  getCurrentSubscription(): Observable<Subscription> {
    const sub = { ...this.currentSubscription };
    sub.pack = this.mockPacks.find(p => p.id === sub.packId);
    sub.addons = sub.addons.map(a => ({
      ...a,
      addon: this.mockAddons.find(ad => ad.id === a.addonId)
    }));
    return of(sub).pipe(delay(300));
  }

  getMarketplaceStats(): Observable<MarketplaceStats> {
    const pack = this.mockPacks.find(p => p.id === this.currentSubscription.packId)!;
    return of({
      currentPack: pack,
      activeAddons: this.currentSubscription.addons.length,
      totalMonthlySpend: this.currentSubscription.totalMonthlyPrice,
      nextBillingDate: this.currentSubscription.nextBillingDate,
      usageStats: {
        usersUsed: 5,
        usersLimit: pack.limits.maxUsers || 999,
        storageUsedGB: 12.5,
        storageLimitGB: pack.limits.maxStorageGB || 999,
        resultsThisMonth: 234,
        resultsLimit: pack.limits.maxResultsPerMonth || 999
      }
    }).pipe(delay(300));
  }

  // Actions
  upgradePack(newPackId: string): Observable<Subscription> {
    this.currentSubscription.packId = newPackId;
    const newPack = this.mockPacks.find(p => p.id === newPackId);
    if (newPack) {
      this.currentSubscription.totalMonthlyPrice = newPack.price;
    }
    return this.getCurrentSubscription();
  }

  subscribeToAddon(addonId: string): Observable<Subscription> {
    const addon = this.mockAddons.find(a => a.id === addonId);
    if (addon && !this.currentSubscription.addons.find(a => a.addonId === addonId)) {
      this.currentSubscription.addons.push({
        addonId,
        subscribedAt: new Date(),
        status: 'ACTIVE'
      });
      if (addon.billingType === 'MONTHLY') {
        this.currentSubscription.totalMonthlyPrice += addon.price;
      }
      
      // Si c'est le 2FA, activer côté backend
      if (addonId === 'addon-2fa') {
        this.http.post(`${environment.apiUrl}/auth/2fa/enable-global`, {}).subscribe();
      }
    }
    this.saveSubscriptionToStorage();
    return this.getCurrentSubscription();
  }

  unsubscribeFromAddon(addonId: string): Observable<Subscription> {
    const index = this.currentSubscription.addons.findIndex(a => a.addonId === addonId);
    if (index > -1) {
      const addon = this.mockAddons.find(a => a.id === addonId);
      this.currentSubscription.addons.splice(index, 1);
      if (addon && addon.billingType === 'MONTHLY') {
        this.currentSubscription.totalMonthlyPrice -= addon.price;
      }
      
      // Si c'est le 2FA, désactiver côté backend
      if (addonId === 'addon-2fa') {
        this.http.post(`${environment.apiUrl}/auth/2fa/disable-global`, {}).subscribe();
      }
    }
    this.saveSubscriptionToStorage();
    return this.getCurrentSubscription();
  }

  isAddonSubscribed(addonId: string): boolean {
    return this.currentSubscription.addons.some(a => a.addonId === addonId);
  }

  formatPrice(price: number, currency: string = 'XAF'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(price);
  }
}
