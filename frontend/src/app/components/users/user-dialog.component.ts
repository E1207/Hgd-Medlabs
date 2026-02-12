import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService, UserRequest } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.scss']
})
export class UserDialogComponent {
  form: FormGroup;
  saving = false;
  hidePassword = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { user: User | null; form: FormGroup },
    private dialogRef: MatDialogRef<UserDialogComponent>,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.form = data.form;
  }

  save(): void {
    if (!this.form.valid) return;
    this.saving = true;

    const formValue = this.form.value;
    const request: UserRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      role: formValue.role,
      isActive: formValue.isActive ?? true
    };

    if (!this.data.user && formValue.password) {
      request.password = formValue.password;
    }

    const operation = this.data.user
      ? this.userService.updateUser(this.data.user.id, request)
      : this.userService.createUser(request);

    operation.subscribe({
      next: () => {
        this.snackBar.open(
          this.data.user ? 'Utilisateur mis à jour' : 'Utilisateur créé avec succès',
          'OK',
          { duration: 3000 }
        );
        this.saving = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Erreur lors de l\'opération', 'Fermer', { duration: 5000 });
      }
    });
  }
}
