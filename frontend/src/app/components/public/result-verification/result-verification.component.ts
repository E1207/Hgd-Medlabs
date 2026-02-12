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
  templateUrl: './result-verification.component.html',
  styleUrls: ['./result-verification.component.scss']
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
