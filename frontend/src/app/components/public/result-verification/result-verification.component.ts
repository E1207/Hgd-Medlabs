import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatSnackBarModule
  ],
  template: `
    <div class="verification-container">
      <mat-card class="verification-card">
        <mat-card-header>
          <div class="logo">
            <mat-icon class="hospital-icon">local_hospital</mat-icon>
          </div>
          <mat-card-title>Consultation Sécurisée</mat-card-title>
          <mat-card-subtitle>Hôpital Général de Douala</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content *ngIf="!verified">
          <p>Un code d'accès vous a été envoyé par email. Veuillez le saisir ci-dessous :</p>
          
          <form [formGroup]="codeForm" (ngSubmit)="verifyCode()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Code d'accès</mat-label>
              <input matInput formControlName="accessCode" maxlength="8" autocomplete="off">
              <mat-icon matPrefix>lock</mat-icon>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" class="full-width"
                    [disabled]="loading || !codeForm.valid">
              <span *ngIf="!loading">Vérifier</span>
              <span *ngIf="loading">Vérification...</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-content *ngIf="verified && result">
          <div class="success-message">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h2>Accès autorisé</h2>
          </div>

          <div class="result-info">
            <p><strong>Référence:</strong> {{ result.referenceDossier }}</p>
            <p><strong>Patient:</strong> {{ result.patientFirstName }} {{ result.patientLastName }}</p>
            <p><strong>Date de naissance:</strong> {{ result.patientBirthdate | date:'dd/MM/yyyy' }}</p>
          </div>

          <button mat-raised-button color="primary" class="full-width" (click)="downloadPdf()">
            <mat-icon>download</mat-icon>
            Télécharger le PDF
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .verification-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .verification-card { max-width: 500px; width: 100%; }
    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
    }
    .logo { margin-bottom: 15px; }
    .hospital-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #0066CC;
    }
    mat-card-title { font-size: 28px; color: #0066CC; }
    .full-width { width: 100%; margin-top: 10px; }
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
    .result-info {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
  `]
})
export class ResultVerificationComponent implements OnInit {
  resultId!: string;
  codeForm: FormGroup;
  loading = false;
  verified = false;
  result?: PatientResult;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private publicResultService: PublicResultService,
    private snackBar: MatSnackBar
  ) {
    this.codeForm = this.fb.group({
      accessCode: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    this.resultId = this.route.snapshot.paramMap.get('id')!;
  }

  verifyCode(): void {
    if (this.codeForm.valid) {
      this.loading = true;
      this.publicResultService.verifyAccessCode(this.resultId, this.codeForm.value).subscribe({
        next: (response) => {
          this.verified = true;
          this.result = response.result;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(
            err.error?.message || 'Code d\'accès invalide',
            'Fermer',
            { duration: 5000 }
          );
        }
      });
    }
  }

  downloadPdf(): void {
    this.publicResultService.downloadPdf(this.resultId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resultat-${this.result?.referenceDossier}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.snackBar.open('Erreur lors du téléchargement', 'Fermer', { duration: 5000 });
      }
    });
  }
}
