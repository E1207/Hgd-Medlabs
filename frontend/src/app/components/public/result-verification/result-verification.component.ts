import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { PublicResultService } from '../../../services/public-result.service';
import { PatientResult } from '../../../models/patient-result.model';

@Component({
  selector: 'app-result-verification',
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
    MatProgressSpinnerModule,
    MatStepperModule
  ],
  template: `
    <div class="verification-container">
      <mat-card class="verification-card">
        <mat-card-header>
          <div class="logo">
            <mat-icon class="hospital-icon">local_hospital</mat-icon>
          </div>
          <mat-card-title>Consultation Sécurisée</mat-card-title>
          <mat-card-subtitle>Hôpital Général de Douala - MedLab</mat-card-subtitle>
        </mat-card-header>

        <!-- ÉTAPE 1: Demande OTP WhatsApp -->
        <mat-card-content *ngIf="step === 'request-otp'">
          <div class="step-header">
            <mat-icon class="whatsapp-icon">smartphone</mat-icon>
            <h3>Vérification par WhatsApp</h3>
          </div>
          
          <p class="info-text">
            Pour accéder à vos résultats médicaux, un code de vérification sera envoyé 
            à votre numéro WhatsApp.
          </p>
          
          <div class="patient-info" *ngIf="resultInfo">
            <p><strong>Référence:</strong> {{ resultInfo.referenceDossier }}</p>
            <p><strong>Patient:</strong> {{ resultInfo.patientFirstName }} {{ resultInfo.patientLastName }}</p>
          </div>

          <button mat-raised-button color="primary" class="full-width whatsapp-btn"
                  (click)="requestOtp()" [disabled]="loading">
            <mat-icon *ngIf="!loading">send</mat-icon>
            <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
            <span *ngIf="!loading">Recevoir le code par WhatsApp</span>
            <span *ngIf="loading">Envoi en cours...</span>
          </button>
        </mat-card-content>

        <!-- ÉTAPE 2: Saisie du code OTP -->
        <mat-card-content *ngIf="step === 'verify-otp'">
          <div class="step-header">
            <mat-icon class="otp-icon">lock</mat-icon>
            <h3>Saisir le code</h3>
          </div>
          
          <p class="info-text">
            Un code à 6 chiffres a été envoyé au numéro 
            <strong>{{ maskedPhone }}</strong>
          </p>
          
          <form [formGroup]="otpForm" (ngSubmit)="verifyOtp()">
            <mat-form-field appearance="outline" class="full-width otp-field">
              <mat-label>Code de vérification</mat-label>
              <input matInput formControlName="otpCode" maxlength="6" 
                     placeholder="000000" autocomplete="one-time-code"
                     inputmode="numeric" pattern="[0-9]*">
              <mat-icon matPrefix>dialpad</mat-icon>
              <mat-hint>Code valide pendant {{ otpExpiresIn }} minutes</mat-hint>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" class="full-width"
                    [disabled]="loading || !otpForm.valid">
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              <span *ngIf="!loading">Vérifier le code</span>
              <span *ngIf="loading">Vérification...</span>
            </button>
          </form>

          <div class="resend-section">
            <p>Code non reçu ?</p>
            <button mat-button color="accent" (click)="resendOtp()" 
                    [disabled]="resendDisabled || loading">
              <mat-icon>refresh</mat-icon>
              Renvoyer le code {{ resendDisabled ? '(' + resendCountdown + 's)' : '' }}
            </button>
          </div>
        </mat-card-content>

        <!-- ÉTAPE 3: Accès au PDF -->
        <mat-card-content *ngIf="step === 'success'">
          <div class="success-message">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h2>Vérification réussie !</h2>
          </div>

          <div class="result-info">
            <p><strong>Référence:</strong> {{ resultInfo?.referenceDossier }}</p>
            <p><strong>Patient:</strong> {{ resultInfo?.patientFirstName }} {{ resultInfo?.patientLastName }}</p>
            <p *ngIf="resultInfo?.patientBirthdate">
              <strong>Date de naissance:</strong> {{ resultInfo?.patientBirthdate | date:'dd/MM/yyyy' }}
            </p>
          </div>

          <div class="pdf-actions">
            <button mat-raised-button color="primary" class="full-width" (click)="viewPdf()">
              <mat-icon>visibility</mat-icon>
              Voir le résultat
            </button>
            
            <button mat-stroked-button color="primary" class="full-width" (click)="downloadPdf()">
              <mat-icon>download</mat-icon>
              Télécharger le PDF
            </button>
          </div>
        </mat-card-content>

        <!-- ERREUR: Pas de numéro de téléphone -->
        <mat-card-content *ngIf="step === 'no-phone'">
          <div class="error-message">
            <mat-icon class="error-icon">error</mat-icon>
            <h3>Vérification impossible</h3>
            <p>Aucun numéro de téléphone n'est associé à ce résultat.</p>
            <p>Veuillez contacter le laboratoire de l'Hôpital Général de Douala.</p>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Footer -->
      <div class="footer">
        <p>🔒 Vos données sont protégées par chiffrement AES-256</p>
        <p>© 2024 MedLab - Hôpital Général de Douala</p>
      </div>
    </div>

    <!-- Modal PDF Viewer -->
    <div class="pdf-modal" *ngIf="showPdfViewer" (click)="closePdfViewer()">
      <div class="pdf-modal-content" (click)="$event.stopPropagation()">
        <button mat-icon-button class="close-btn" (click)="closePdfViewer()">
          <mat-icon>close</mat-icon>
        </button>
        <iframe [src]="pdfUrl" class="pdf-viewer"></iframe>
      </div>
    </div>
  `,
  styles: [`
    .verification-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0066CC 0%, #004499 100%);
      padding: 20px;
    }
    .verification-card { 
      max-width: 480px; 
      width: 100%; 
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
      padding-top: 20px;
    }
    .logo { margin-bottom: 15px; }
    .hospital-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #0066CC;
    }
    mat-card-title { 
      font-size: 24px; 
      color: #0066CC; 
      text-align: center;
    }
    mat-card-subtitle {
      text-align: center;
      font-size: 14px;
    }
    .step-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    .step-header mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .whatsapp-icon { color: #25D366; }
    .otp-icon { color: #0066CC; }
    .info-text {
      color: #666;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .patient-info {
      background-color: #e3f2fd;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .patient-info p { margin: 5px 0; }
    .full-width { width: 100%; margin-top: 10px; }
    .whatsapp-btn {
      background-color: #25D366 !important;
      height: 48px;
      font-size: 16px;
    }
    .otp-field input {
      font-size: 24px;
      letter-spacing: 8px;
      text-align: center;
    }
    .resend-section {
      text-align: center;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }
    .resend-section p {
      margin-bottom: 5px;
      color: #666;
      font-size: 14px;
    }
    .success-message {
      text-align: center;
      margin-bottom: 20px;
    }
    .success-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #4CAF50;
    }
    .error-message {
      text-align: center;
      padding: 20px;
    }
    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
    }
    .result-info {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .pdf-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      color: rgba(255,255,255,0.8);
      font-size: 12px;
    }
    .footer p { margin: 5px 0; }

    /* PDF Modal */
    .pdf-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .pdf-modal-content {
      width: 95%;
      height: 95%;
      position: relative;
    }
    .close-btn {
      position: absolute;
      top: -40px;
      right: 0;
      color: white;
    }
    .pdf-viewer {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 8px;
    }
  `]
})
export class ResultVerificationComponent implements OnInit {
  resultId!: string;
  otpForm: FormGroup;
  loading = false;
  step: 'request-otp' | 'verify-otp' | 'success' | 'no-phone' = 'request-otp';
  resultInfo?: PatientResult;
  maskedPhone = '';
  otpExpiresIn = 10;
  
  resendDisabled = false;
  resendCountdown = 60;
  
  showPdfViewer = false;
  pdfUrl: SafeResourceUrl | null = null;
  private rawPdfUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private publicResultService: PublicResultService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {
    this.otpForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  ngOnInit(): void {
    this.resultId = this.route.snapshot.paramMap.get('id')!;
    this.loadResultInfo();
  }

  loadResultInfo(): void {
    this.publicResultService.getResultInfo(this.resultId).subscribe({
      next: (result) => {
        this.resultInfo = result;
      },
      error: (err) => {
        this.snackBar.open('Résultat non trouvé', 'Fermer', { duration: 5000 });
      }
    });
  }

  requestOtp(): void {
    this.loading = true;
    this.publicResultService.requestOtp(this.resultId).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          this.maskedPhone = response.maskedPhone;
          this.otpExpiresIn = response.expiresInMinutes || 10;
          this.step = 'verify-otp';
          this.startResendCountdown();
          
          if (!response.whatsappEnabled) {
            this.snackBar.open(
              '⚠️ Mode test: le code apparaît dans les logs du serveur',
              'OK',
              { duration: 10000 }
            );
          }
        } else if (response.error === 'NO_PHONE') {
          this.step = 'no-phone';
        } else {
          this.snackBar.open(response.message || 'Erreur', 'Fermer', { duration: 5000 });
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.error?.error === 'NO_PHONE') {
          this.step = 'no-phone';
        } else {
          this.snackBar.open(
            err.error?.message || 'Erreur lors de l\'envoi du code',
            'Fermer',
            { duration: 5000 }
          );
        }
      }
    });
  }

  verifyOtp(): void {
    if (this.otpForm.valid) {
      this.loading = true;
      this.publicResultService.verifyOtp(this.resultId, this.otpForm.value.otpCode).subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.success) {
            this.step = 'success';
            this.snackBar.open('Vérification réussie !', 'OK', { duration: 3000 });
          } else {
            this.snackBar.open(response.message || 'Code invalide', 'Fermer', { duration: 5000 });
          }
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(
            err.error?.message || 'Code invalide ou expiré',
            'Fermer',
            { duration: 5000 }
          );
        }
      });
    }
  }

  resendOtp(): void {
    this.otpForm.reset();
    this.requestOtp();
  }

  startResendCountdown(): void {
    this.resendDisabled = true;
    this.resendCountdown = 60;
    
    const interval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        this.resendDisabled = false;
        clearInterval(interval);
      }
    }, 1000);
  }

  viewPdf(): void {
    this.publicResultService.downloadPdf(this.resultId).subscribe({
      next: (blob) => {
        this.rawPdfUrl = window.URL.createObjectURL(blob);
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdfUrl);
        this.showPdfViewer = true;
      },
      error: (err) => {
        this.snackBar.open('Erreur lors du chargement du PDF', 'Fermer', { duration: 5000 });
      }
    });
  }

  closePdfViewer(): void {
    this.showPdfViewer = false;
    if (this.rawPdfUrl) {
      window.URL.revokeObjectURL(this.rawPdfUrl);
      this.rawPdfUrl = null;
      this.pdfUrl = null;
    }
  }

  downloadPdf(): void {
    this.publicResultService.downloadPdf(this.resultId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resultat-${this.resultInfo?.referenceDossier}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.snackBar.open('Erreur lors du téléchargement', 'Fermer', { duration: 5000 });
      }
    });
  }
}
