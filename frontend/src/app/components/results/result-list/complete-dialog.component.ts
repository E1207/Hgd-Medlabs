import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PatientResultService } from '../../../services/patient-result.service';
import { PatientResult } from '../../../models/patient-result.model';

@Component({
  selector: 'app-complete-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>edit_note</mat-icon>
      Compléter le dossier {{ data.result.referenceDossier }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom du patient</mat-label>
          <input matInput formControlName="patientLastName">
          <mat-icon matPrefix>person</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Prénom du patient</mat-label>
          <input matInput formControlName="patientFirstName">
          <mat-icon matPrefix>person</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date de naissance</mat-label>
          <input matInput type="date" formControlName="patientBirthdate">
          <mat-icon matPrefix>cake</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email du patient</mat-label>
          <input matInput type="email" formControlName="patientEmail" placeholder="patient@email.com">
          <mat-icon matPrefix>email</mat-icon>
          <mat-error *ngIf="form.get('patientEmail')?.hasError('email')">Format invalide</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Téléphone</mat-label>
          <input matInput formControlName="patientPhone" placeholder="+237XXXXXXXXX">
          <mat-icon matPrefix>phone</mat-icon>
        </mat-form-field>

        <mat-checkbox formControlName="sendAfterComplete" color="primary">
          Envoyer au patient après complétion
        </mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" (click)="onComplete()"
              [disabled]="loading || !form.get('referenceDossier')?.value">
        <mat-spinner diameter="18" *ngIf="loading"></mat-spinner>
        <mat-icon *ngIf="!loading">check</mat-icon>
        {{ loading ? 'En cours...' : 'Compléter et Enregistrer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { display: flex; align-items: center; gap: 8px; }
    .full-width { width: 100%; }
    mat-dialog-content { min-width: 400px; }
    mat-checkbox { display: block; margin: 12px 0; }
    mat-spinner { display: inline-block; margin-right: 6px; }
  `]
})
export class CompleteDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private resultService: PatientResultService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CompleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { result: PatientResult }
  ) {
    const r = data.result;
    this.form = this.fb.group({
      referenceDossier: [r.referenceDossier, Validators.required],
      patientFirstName: [r.patientFirstName || ''],
      patientLastName: [r.patientLastName || ''],
      patientBirthdate: [r.patientBirthdate || ''],
      patientEmail: [r.patientEmail || '', Validators.email],
      patientPhone: [r.patientPhone || ''],
      sendAfterComplete: [false]
    });
  }

  onComplete(): void {
    if (!this.form.valid) return;
    this.loading = true;

    const formValue = { ...this.form.value };
    const sendAfter = formValue.sendAfterComplete;
    delete formValue.sendAfterComplete;

    this.resultService.completeResult(this.data.result.id, formValue).subscribe({
      next: (completed) => {
        if (sendAfter && completed.patientEmail) {
          this.resultService.sendResult(completed.id).subscribe({
            next: () => {
              this.snackBar.open('Dossier complété et envoyé au patient!', 'OK', { duration: 3000 });
              this.loading = false;
              this.dialogRef.close(true);
            },
            error: () => {
              this.snackBar.open('Dossier complété mais erreur d\'envoi', 'Fermer', { duration: 5000 });
              this.loading = false;
              this.dialogRef.close(true);
            }
          });
        } else {
          this.snackBar.open('Dossier complété avec succès!', 'OK', { duration: 3000 });
          this.loading = false;
          this.dialogRef.close(true);
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Erreur lors de la complétion', 'Fermer', { duration: 5000 });
      }
    });
  }
}
