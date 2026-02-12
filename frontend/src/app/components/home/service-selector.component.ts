import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

interface ServiceCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  gradient: string;
  available: boolean;
  roles: string[];
}

@Component({
  selector: 'app-service-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './service-selector.component.html',
  styleUrls: ['./service-selector.component.scss']
})
export class ServiceSelectorComponent implements OnInit {
  services: ServiceCard[] = [
    {
      id: 'medlabs',
      name: 'MedLabs',
      description: 'Gestion des résultats d\'analyses médicales. Envoi sécurisé par email et WhatsApp aux patients.',
      icon: 'biotech',
      route: '/medlabs',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      available: true,
      roles: ['ADMIN', 'TECHNICIEN']
    },
    {
      id: 'medradio',
      name: 'MedRadio',
      description: 'Module de radiologie. Gestion des examens d\'imagerie médicale et rapports radiologiques.',
      icon: 'radiology',
      route: '/medradio',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      available: false,
      roles: ['ADMIN', 'RADIOLOGUE']
    },
    {
      id: 'medpharma',
      name: 'MedPharma',
      description: 'Gestion de la pharmacie hospitalière. Stocks, prescriptions et distribution.',
      icon: 'medication',
      route: '/medpharma',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      available: false,
      roles: ['ADMIN', 'PHARMACIEN']
    },
    {
      id: 'medadmin',
      name: 'MedAdmin',
      description: 'Administration générale. Gestion des patients, rendez-vous et facturation.',
      icon: 'admin_panel_settings',
      route: '/medadmin',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      available: false,
      roles: ['ADMIN']
    }
  ];

  currentTime = '';
  currentDate = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  updateDateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    this.currentDate = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  hasAccessToService(service: ServiceCard): boolean {
    if (!this.isAuthenticated) return false;
    const userRole = this.currentUser?.role || '';
    return service.roles.includes(userRole);
  }

  navigateToService(service: ServiceCard): void {
    if (!service.available) {
      this.snackBar.open('Ce service sera bientôt disponible', 'OK', { duration: 3000 });
      return;
    }

    if (this.isAuthenticated) {
      // User is logged in - check permissions
      if (this.hasAccessToService(service)) {
        // Has access - go directly to dashboard
        this.router.navigate([`${service.route}/dashboard`]);
      } else {
        // No access - show error
        this.snackBar.open(
          `Vous n'avez pas les droits pour accéder à ${service.name}. Contactez l'administrateur.`,
          'Fermer',
          { duration: 5000, panelClass: 'error-snackbar' }
        );
      }
    } else {
      // Not logged in - redirect to service login
      this.router.navigate([`${service.route}/login`]);
    }
  }

  logout(): void {
    this.authService.logout();
    this.snackBar.open('Déconnexion réussie', 'OK', { duration: 2000 });
  }
}
