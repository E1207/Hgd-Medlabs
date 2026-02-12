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
  templateUrl: './result-upload.component.html',
  styleUrls: ['./result-upload.component.scss']
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
                this.router.navigate(['/medlabs/results']);
              },
              error: () => {
                this.snackBar.open('Résultat enregistré mais erreur lors de l\'envoi email', 'Fermer', { duration: 5000 });
                this.router.navigate(['/medlabs/results']);
              }
            });
          } else {
            this.router.navigate(['/medlabs/results']);
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
    this.router.navigate(['/medlabs/results']);
  }
}
