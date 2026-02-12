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
  templateUrl: './complete-dialog.component.html',
  styleUrls: ['./complete-dialog.component.scss']
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
