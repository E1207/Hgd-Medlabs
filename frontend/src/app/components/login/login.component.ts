import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

interface ServiceConfig {
  name: string;
  icon: string;
  tagline: string;
  color: string;
  gradient: string;
  features: { icon: string; text: string }[];
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  otpForm: FormGroup;
  loading = false;
  hidePassword = true;
  
  // 2FA state
  requires2FA = false;
  sessionToken = '';
  userEmail = '';
  userName = '';
  
  // Service configuration
  currentService = 'medlabs';
  returnUrl = '';
  
  serviceConfigs: Record<string, ServiceConfig> = {
    medlabs: {
      name: 'MedLabs',
      icon: 'biotech',
      tagline: 'Système de Gestion des Résultats de Laboratoire',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      features: [
        { icon: 'speed', text: 'Résultats en temps réel' },
        { icon: 'security', text: 'Données sécurisées' },
        { icon: 'notifications_active', text: 'Notifications automatiques' }
      ]
    },
    medradio: {
      name: 'MedRadio',
      icon: 'radiology',
      tagline: 'Système de Gestion des Examens Radiologiques',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      features: [
        { icon: 'image', text: 'Imagerie haute résolution' },
        { icon: 'cloud_upload', text: 'Stockage DICOM sécurisé' },
        { icon: 'share', text: 'Partage inter-services' }
      ]
    },
    medpharma: {
      name: 'MedPharma',
      icon: 'medication',
      tagline: 'Gestion de la Pharmacie Hospitalière',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      features: [
        { icon: 'inventory', text: 'Gestion des stocks' },
        { icon: 'receipt_long', text: 'Prescriptions électroniques' },
        { icon: 'local_shipping', text: 'Suivi des commandes' }
      ]
    },
    medadmin: {
      name: 'MedAdmin',
      icon: 'admin_panel_settings',
      tagline: 'Administration Générale de l\'Hôpital',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      features: [
        { icon: 'people', text: 'Gestion des patients' },
        { icon: 'event', text: 'Planification rendez-vous' },
        { icon: 'payments', text: 'Facturation intégrée' }
      ]
    }
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    this.otpForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern('^[0-9]*$')]]
    });
  }

  ngOnInit(): void {
    // Get service from route data
    this.route.data.subscribe(data => {
      if (data['service']) {
        this.currentService = data['service'];
      }
    });
    
    // Get return URL from query params
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || `/${this.currentService}/dashboard`;
    });

    // If already authenticated, redirect to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate([`/${this.currentService}/dashboard`]);
    }
  }

  get config(): ServiceConfig {
    return this.serviceConfigs[this.currentService] || this.serviceConfigs['medlabs'];
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          // Vérifier si le 2FA est requis
          if (response.requires2FA) {
            this.requires2FA = true;
            this.sessionToken = response.sessionToken || '';
            this.userEmail = response.email;
            this.userName = response.firstName || '';
            this.loading = false;
            this.snackBar.open(
              'Un code de vérification a été envoyé à votre email',
              'OK',
              { duration: 5000 }
            );
          } else {
            // Connexion réussie sans 2FA
            this.router.navigateByUrl(this.returnUrl);
          }
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open(
            error.error?.message || 'Email ou mot de passe incorrect',
            'Fermer',
            { duration: 5000 }
          );
        }
      });
    }
  }

  onVerify2FA(): void {
    if (this.otpForm.valid) {
      this.loading = true;
      this.authService.verify2FA({
        email: this.userEmail,
        code: this.otpForm.value.code,
        sessionToken: this.sessionToken
      }).subscribe({
        next: () => {
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open(
            error.error?.message || 'Code de vérification invalide ou expiré',
            'Fermer',
            { duration: 5000 }
          );
        }
      });
    }
  }

  backToLogin(): void {
    this.requires2FA = false;
    this.sessionToken = '';
    this.userEmail = '';
    this.userName = '';
    this.otpForm.reset();
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }
}
