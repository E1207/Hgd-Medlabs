import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './services/auth.service';
import { MarketplaceService } from './services/marketplace.service';
import { BrandingService } from './services/branding.service';
import { BrandingConfig } from './models/branding.model';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'SIL - HGD';
  currentService: 'home' | 'medlabs' | 'medradio' | null = null;
  isBrandingActive = false;
  isAnalyticsProActive = false;
  isAuditTrailActive = false;
  is2FAActive = false;
  brandingConfig: BrandingConfig | null = null;
  private subscriptionWatcher?: Subscription;
  private brandingWatcher?: Subscription;
  
  @ViewChild('drawer') drawer!: MatSidenav;

  constructor(
    public authService: AuthService,
    private marketplaceService: MarketplaceService,
    private brandingService: BrandingService,
    private router: Router
  ) {
    // Track current route to determine active service
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateCurrentService(event.url);
    });
  }

  ngOnInit(): void {
    // Watch for subscription changes to update add-on statuses
    this.subscriptionWatcher = this.marketplaceService.watchSubscription().subscribe(() => {
      this.isBrandingActive = this.marketplaceService.isBrandingActive();
      this.isAnalyticsProActive = this.marketplaceService.isAnalyticsProActive();
      this.isAuditTrailActive = this.marketplaceService.isAuditTrailActive();
      this.is2FAActive = this.marketplaceService.is2FAActive();
      // Appliquer le branding si l'add-on est actif
      if (this.isBrandingActive) {
        this.loadAndApplyBranding();
      }
    });
    
    // Watch for branding config changes
    this.brandingWatcher = this.brandingService.watchBrandingConfig().subscribe(config => {
      if (config && this.isBrandingActive) {
        this.brandingConfig = config;
        this.brandingService.applyBrandingStyles(config);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptionWatcher?.unsubscribe();
    this.brandingWatcher?.unsubscribe();
  }
  
  private loadAndApplyBranding(): void {
    this.brandingService.getBrandingConfig().subscribe(config => {
      this.brandingConfig = config;
      this.brandingService.applyBrandingStyles(config);
    });
  }

  private updateCurrentService(url: string): void {
    if (url.startsWith('/medlabs')) {
      this.currentService = 'medlabs';
    } else if (url.startsWith('/medradio')) {
      this.currentService = 'medradio';
    } else if (url === '/home' || url === '/') {
      this.currentService = 'home';
    } else {
      this.currentService = null;
    }
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get isPublicRoute(): boolean {
    return this.router.url.startsWith('/public');
  }

  get isLoginRoute(): boolean {
    return this.router.url.includes('/login');
  }

  get isHomeRoute(): boolean {
    return this.router.url === '/home' || this.router.url === '/';
  }

  get isServiceRoute(): boolean {
    // Service route but NOT login page
    return (this.currentService === 'medlabs' || this.currentService === 'medradio') && !this.isLoginRoute;
  }

  get showSidebar(): boolean {
    return this.isLoggedIn && this.isServiceRoute && !this.isPublicRoute;
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getServiceName(): string {
    switch (this.currentService) {
      case 'medlabs': return 'MedLabs';
      case 'medradio': return 'MedRadio';
      default: return 'SIL';
    }
  }

  getServiceIcon(): string {
    switch (this.currentService) {
      case 'medlabs': return 'biotech';
      case 'medradio': return 'radiology';
      default: return 'local_hospital';
    }
  }

  getUserInitials(): string {
    const user = this.currentUser;
    if (!user) return '?';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getRoleLabel(): string {
    const user = this.currentUser;
    if (!user) return '';
    return user.role === 'ADMIN' ? 'Administrateur' : 'Technicien';
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  logout(): void {
    this.authService.logout();
  }
}
