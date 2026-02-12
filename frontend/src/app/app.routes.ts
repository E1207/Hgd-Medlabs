import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
  // Default redirect to home (service selector) - PUBLIC
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  
  // Home - Service Selector (PUBLIC - no auth required)
  {
    path: 'home',
    loadComponent: () => import('./components/home/service-selector.component').then(m => m.ServiceSelectorComponent)
  },

  // ========================================
  // MEDLABS - Laboratoire d'Analyses
  // ========================================
  {
    path: 'medlabs',
    children: [
      // Login page for MedLabs
      { path: 'login', component: LoginComponent, data: { service: 'medlabs' } },
      // Protected routes
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard],
        data: { service: 'medlabs' }
      },
      {
        path: 'results',
        loadComponent: () => import('./components/results/result-list/result-list.component').then(m => m.ResultListComponent),
        canActivate: [authGuard],
        data: { service: 'medlabs' }
      },
      {
        path: 'results/upload',
        loadComponent: () => import('./components/results/result-upload/result-upload.component').then(m => m.ResultUploadComponent),
        canActivate: [authGuard],
        data: { service: 'medlabs' }
      },
      {
        path: 'settings',
        loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [authGuard],
        data: { service: 'medlabs' }
      },
      {
        path: 'users',
        loadComponent: () => import('./components/users/user-management.component').then(m => m.UserManagementComponent),
        canActivate: [authGuard],
        data: { service: 'medlabs' }
      },
      {
        path: 'storage',
        loadComponent: () => import('./components/storage/storage-management.component').then(m => m.StorageManagementComponent),
        canActivate: [authGuard],
        data: { service: 'medlabs' }
      },
      {
        path: 'marketplace',
        loadComponent: () => import('./components/marketplace/marketplace.component').then(m => m.MarketplaceComponent),
        canActivate: [authGuard],
        data: { service: 'medlabs', adminOnly: true }
      },
      {
        path: 'branding',
        loadComponent: () => import('./components/branding/branding-management.component').then(m => m.BrandingManagementComponent),
        canActivate: [authGuard],
        data: { service: 'medlabs', adminOnly: true }
      }
    ]
  },

  // ========================================
  // MEDRADIO - Radiologie (Coming Soon)
  // ========================================
  {
    path: 'medradio',
    children: [
      // Login page for MedRadio
      { path: 'login', component: LoginComponent, data: { service: 'medradio' } },
      // Protected routes
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/medradio/dashboard/medradio-dashboard.component').then(m => m.MedRadioDashboardComponent),
        canActivate: [authGuard],
        data: { service: 'medradio' }
      }
    ]
  },

  // ========================================
  // PUBLIC ROUTES (No auth required)
  // ========================================
  {
    path: 'public/results/:id',
    loadComponent: () => import('./components/public/result-verification/result-verification.component').then(m => m.ResultVerificationComponent)
  },

  // Legacy redirects (for backwards compatibility)
  { path: 'login', redirectTo: '/home', pathMatch: 'full' },
  { path: 'dashboard', redirectTo: '/medlabs/dashboard', pathMatch: 'full' },
  { path: 'results', redirectTo: '/medlabs/results', pathMatch: 'full' },
  { path: 'results/upload', redirectTo: '/medlabs/results/upload', pathMatch: 'full' },
  { path: 'settings', redirectTo: '/medlabs/settings', pathMatch: 'full' },
  { path: 'users', redirectTo: '/medlabs/users', pathMatch: 'full' },
  { path: 'storage', redirectTo: '/medlabs/storage', pathMatch: 'full' },

  // Catch all - redirect to home
  { path: '**', redirectTo: '/home' }
];
