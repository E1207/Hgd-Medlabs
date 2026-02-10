import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'results',
    loadComponent: () => import('./components/results/result-list/result-list.component').then(m => m.ResultListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'results/upload',
    loadComponent: () => import('./components/results/result-upload/result-upload.component').then(m => m.ResultUploadComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./components/users/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [authGuard]
  },
  {
    path: 'public/results/:id',
    loadComponent: () => import('./components/public/result-verification/result-verification.component').then(m => m.ResultVerificationComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];
