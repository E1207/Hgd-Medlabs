import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PatientResultService } from '../../../services/patient-result.service';

@Component({
  selector: 'app-result-upload',
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
    MatCheckboxModule,
    MatProgressBarModule
  ],
  template: `
    <div class="upload-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>upload_file</mat-icon>
            Nouveau Résultat
          </mat-card-title>
          <mat-card-subtitle>Importez le PDF — les champs seront remplis automatiquement</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="drop-zone" 
               [class.has-file]="selectedFile"
               [class.extracting]="extracting"
               (click)="fileInput.click()"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)">
            <mat-icon class="upload-icon" *ngIf="!selectedFile && !extracting">cloud_upload</mat-icon>
            <mat-spinner diameter="48" *ngIf="extracting"></mat-spinner>
            <mat-icon class="upload-icon success" *ngIf="selectedFile && !extracting">check_circle</mat-icon>
            <p *ngIf="!selectedFile && !extracting">Glissez-déposez le PDF ici ou cliquez pour parcourir</p>
            <p *ngIf="extracting">Analyse du PDF en cours...</p>
            <p class="file-name" *ngIf="selectedFile && !extracting">
              <mat-icon>description</mat-icon>
              {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
            </p>
            <p class="extract-info" *ngIf="extractedInfo && !extracting">
              <mat-icon>auto_fix_high</mat-icon> Champs remplis automatiquement depuis le PDF
            </p>
            <input #fileInput type="file" accept=".pdf" (change)="onFileSelected($event)" hidden>
          </div>

          <form [formGroup]="resultForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Référence Dossier / Code Patient</mat-label>
              <input matInput formControlName="referenceDossier" placeholder="Ex: 2601122170">
              <mat-icon matPrefix>tag</mat-icon>
              <mat-error *ngIf="resultForm.get('referenceDossier')?.hasError('required')">
                La référence est obligatoire
              </mat-error>
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Nom du patient</mat-label>
                <input matInput formControlName="patientLastName">
                <mat-icon matPrefix>person</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Prénom du patient</mat-label>
                <input matInput formControlName="patientFirstName">
                <mat-icon matPrefix>person</mat-icon>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Date de Naissance</mat-label>
              <input matInput type="date" formControlName="patientBirthdate">
              <mat-icon matPrefix>cake</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email du patient</mat-label>
              <input matInput type="email" formControlName="patientEmail" placeholder="patient&#64;email.com">
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="resultForm.get('patientEmail')?.hasError('email')">
                Format d'email invalide
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Téléphone Mobile</mat-label>
              <input matInput formControlName="patientPhone" placeholder="+237XXXXXXXXX">
              <mat-icon matPrefix>phone</mat-icon>
            </mat-form-field>

            <mat-checkbox formControlName="sendImmediately" color="primary" class="send-checkbox">
              Envoyer immédiatement au patient après upload
            </mat-checkbox>

            <div class="actions">
              <button mat-stroked-button type="button" (click)="goBack()">
                <mat-icon>arrow_back</mat-icon>
                Annuler
              </button>
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="loading || !resultForm.valid || !selectedFile">
                <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
                <mat-icon *ngIf="!loading">upload</mat-icon>
                <span *ngIf="!loading">Enregistrer</span>
                <span *ngIf="loading">Envoi en cours...</span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .upload-container { max-width: 800px; margin: 0 auto; }
    mat-card-header { margin-bottom: 24px; }
    mat-card-title { display: flex; align-items: center; gap: 12px; font-size: 22px !important; }
    .drop-zone {
      border: 2px dashed #ccc;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      margin-bottom: 30px;
      transition: all 0.3s;
      background-color: #fafafa;
    }
    .drop-zone:hover, .drop-zone.dragover { 
      border-color: #1565c0; 
      background-color: #e3f2fd; 
    }
    .drop-zone.has-file {
      border-color: #4CAF50;
      background-color: #E8F5E9;
    }
    .drop-zone.extracting {
      border-color: #FF9800;
      background-color: #FFF3E0;
    }
    .upload-icon { 
      font-size: 64px; width: 64px; height: 64px; color: #1565c0; 
    }
    .upload-icon.success { color: #4CAF50; }
    .file-name { 
      color: #4CAF50; font-weight: 500; margin-top: 10px; 
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .extract-info {
      color: #1565C0; font-size: 13px; margin-top: 8px;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .full-width { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .send-checkbox { margin: 16px 0; display: block; }
    .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
    mat-spinner { display: inline-block; margin-right: 8px; }
  `]
})
export class ResultUploadComponent {
  resultForm: FormGroup;
  selectedFile?: File;
  loading = false;
  extracting = false;
  extractedInfo = false;

  constructor(
    private fb: FormBuilder,
    private resultService: PatientResultService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.resultForm = this.fb.group({
      referenceDossier: ['', Validators.required],
      patientFirstName: [''],
      patientLastName: [''],
      patientBirthdate: [''],
      patientEmail: ['', Validators.email],
      patientPhone: [''],
      sendImmediately: [false]
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    this.handleFile(file);
  }

  private handleFile(file: File): void {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      this.snackBar.open('Seuls les fichiers PDF sont acceptés', 'Fermer', { duration: 3000 });
      return;
    }
    this.selectedFile = file;
    this.autoExtractMetadata(file);
  }

  private autoExtractMetadata(file: File): void {
    this.extracting = true;
    this.extractedInfo = false;
    this.resultService.extractMetadata(file).subscribe({
      next: (metadata) => {
        this.extracting = false;
        let filled = false;
        if (metadata.referenceDossier) {
          this.resultForm.patchValue({ referenceDossier: metadata.referenceDossier });
          filled = true;
        }
        if (metadata.lastName) {
          this.resultForm.patchValue({ patientLastName: metadata.lastName });
          filled = true;
        }
        if (metadata.firstName) {
          this.resultForm.patchValue({ patientFirstName: metadata.firstName });
          filled = true;
        }
        if (metadata.birthdate) {
          this.resultForm.patchValue({ patientBirthdate: metadata.birthdate });
          filled = true;
        }
        if (metadata.email) {
          this.resultForm.patchValue({ patientEmail: metadata.email });
          filled = true;
        }
        if (metadata.phone) {
          this.resultForm.patchValue({ patientPhone: metadata.phone });
          filled = true;
        }
        this.extractedInfo = filled;
        if (filled) {
          this.snackBar.open('Informations extraites du PDF avec succès!', 'OK', { duration: 3000 });
        }
      },
      error: () => {
        this.extracting = false;
        // Pas grave si l'extraction échoue, le formulaire reste disponible
      }
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.add('dragover');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('dragover');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.remove('dragover');
    if (event.dataTransfer?.files.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  onSubmit(): void {
    if (this.resultForm.valid && this.selectedFile) {
      this.loading = true;
      const formValue = { ...this.resultForm.value };
      const sendImmediately = formValue.sendImmediately;
      delete formValue.sendImmediately;

      this.resultService.uploadResult(this.selectedFile, formValue).subscribe({
        next: (result) => {
          this.snackBar.open('Résultat enregistré avec succès!', 'Fermer', { duration: 3000 });
          
          if (sendImmediately && result.patientEmail) {
            this.resultService.sendResult(result.id).subscribe({
              next: () => {
                this.snackBar.open('Résultat envoyé au patient!', 'Fermer', { duration: 3000 });
                this.router.navigate(['/results']);
              },
              error: () => {
                this.snackBar.open('Résultat enregistré mais erreur lors de l\'envoi email', 'Fermer', { duration: 5000 });
                this.router.navigate(['/results']);
              }
            });
          } else {
            this.router.navigate(['/results']);
          }
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(
            err.error?.message || 'Erreur lors de l\'upload',
            'Fermer',
            { duration: 5000 }
          );
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/results']);
  }
}
