import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    <div class="security-container">
      <div class="page-header">
        <div class="header-icon">
          <mat-icon>security</mat-icon>
        </div>
        <div class="header-text">
          <h1>Sécurité & Authentification</h1>
          <p>Gérez les paramètres de sécurité de votre organisation</p>
        </div>
      </div>

      <div class="security-content">
        <mat-card class="security-card main-card">
          <div class="card-header">
            <div class="feature-icon">
              <mat-icon>verified_user</mat-icon>
            </div>
            <div class="feature-info">
              <h2>Authentification à Double Facteur (2FA)</h2>
              <p>Ajoute une couche de sécurité supplémentaire en demandant un code de vérification lors de la connexion</p>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="status-section">
            <div class="status-indicator" [class.active]="is2FAEnabled">
              <mat-icon>{{ is2FAEnabled ? 'check_circle' : 'cancel' }}</mat-icon>
              <span>{{ is2FAEnabled ? 'Activé' : 'Désactivé' }}</span>
            </div>
            
            <div class="action-buttons">
              <button mat-flat-button 
                      [color]="is2FAEnabled ? 'warn' : 'primary'"
                      (click)="toggle2FA()"
                      [disabled]="loading">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <span *ngIf="!loading">{{ is2FAEnabled ? 'Désactiver le 2FA' : 'Activer le 2FA' }}</span>
              </button>
            </div>
          </div>

          <div class="info-section">
            <h3>Comment ça fonctionne ?</h3>
            <div class="steps">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4>Connexion classique</h4>
                  <p>L'utilisateur entre son email et mot de passe</p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h4>Code par email</h4>
                  <p>Un code à 6 chiffres est envoyé à l'adresse email</p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h4>Vérification</h4>
                  <p>L'utilisateur saisit le code pour accéder au système</p>
                </div>
              </div>
            </div>
          </div>
        </mat-card>

        <mat-card class="security-card info-card">
          <h3><mat-icon>info</mat-icon> Informations importantes</h3>
          <ul>
            <li>Le 2FA s'applique à <strong>tous les utilisateurs</strong> de votre organisation</li>
            <li>Le code de vérification expire après <strong>5 minutes</strong></li>
            <li>Maximum <strong>3 tentatives</strong> avant expiration du code</li>
            <li>Assurez-vous que vos utilisateurs ont accès à leur email</li>
          </ul>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .security-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 32px;
    }

    .header-icon {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: white;
      }
    }

    .header-text {
      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: #1e293b;
      }

      p {
        margin: 4px 0 0;
        color: #64748b;
      }
    }

    .security-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .security-card {
      border-radius: 16px;
      padding: 24px;
    }

    .main-card .card-header {
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
    }

    .feature-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 30px;
        width: 30px;
        height: 30px;
        color: white;
      }
    }

    .feature-info {
      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #1e293b;
      }

      p {
        margin: 8px 0 0;
        color: #64748b;
        line-height: 1.5;
      }
    }

    .status-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 0;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 10px;
      font-weight: 600;

      &.active {
        background: #dcfce7;
        color: #16a34a;
      }

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .info-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;

      h3 {
        margin: 0 0 20px;
        font-size: 16px;
        font-weight: 600;
        color: #334155;
      }
    }

    .steps {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 20px;
      background: #f8fafc;
      border-radius: 12px;
    }

    .step-number {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      margin-bottom: 12px;
    }

    .step-content {
      h4 {
        margin: 0 0 4px;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #64748b;
      }
    }

    .info-card {
      background: #fffbeb;
      border: 1px solid #fde68a;

      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px;
        font-size: 16px;
        font-weight: 600;
        color: #92400e;

        mat-icon {
          color: #f59e0b;
        }
      }

      ul {
        margin: 0;
        padding-left: 20px;

        li {
          margin-bottom: 8px;
          color: #78350f;
          line-height: 1.5;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .steps {
        grid-template-columns: 1fr;
      }

      .status-section {
        flex-direction: column;
        gap: 16px;
      }
    }
  `]
})
export class SecuritySettingsComponent implements OnInit {
  is2FAEnabled = false;
  loading = false;

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load2FAStatus();
  }

  load2FAStatus(): void {
    this.authService.get2FAStatus().subscribe({
      next: (status) => {
        this.is2FAEnabled = status.globalEnabled;
      },
      error: (err) => {
        console.error('Erreur chargement statut 2FA', err);
      }
    });
  }

  toggle2FA(): void {
    this.loading = true;
    
    if (this.is2FAEnabled) {
      this.authService.disable2FAGlobal().subscribe({
        next: () => {
          this.is2FAEnabled = false;
          this.loading = false;
          this.snackBar.open('2FA désactivé pour tous les utilisateurs', 'OK', { duration: 3000 });
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open('Erreur lors de la désactivation du 2FA', 'Fermer', { duration: 5000 });
        }
      });
    } else {
      this.authService.enable2FAGlobal().subscribe({
        next: () => {
          this.is2FAEnabled = true;
          this.loading = false;
          this.snackBar.open('2FA activé pour tous les utilisateurs', 'OK', { duration: 3000 });
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open('Erreur lors de l\'activation du 2FA', 'Fermer', { duration: 5000 });
        }
      });
    }
  }
}
