import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    // Get the service from route data or URL
    const service = route.data['service'] || getServiceFromUrl(state.url);
    
    // Redirect to service-specific login
    if (service) {
      router.navigate([`/${service}/login`], { 
        queryParams: { returnUrl: state.url } 
      });
    } else {
      router.navigate(['/home']);
    }
    return false;
  }

  const requiredRole = route.data['role'];
  if (requiredRole && !authService.hasRole(requiredRole)) {
    const service = route.data['service'] || 'medlabs';
    router.navigate([`/${service}/dashboard`]);
    return false;
  }

  return true;
};

// Helper function to extract service from URL
function getServiceFromUrl(url: string): string | null {
  const match = url.match(/^\/(medlabs|medradio|medpharma|medadmin)/);
  return match ? match[1] : null;
}
