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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data.user ? 'edit' : 'person_add' }}</mat-icon>
      {{ data.user ? 'Modifier l\\'utilisateur' : 'Nouvel utilisateur' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <input matInput formControlName="lastName" placeholder="DUPONT">
            <mat-icon matPrefix>badge</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Prénom</mat-label>
            <input matInput formControlName="firstName" placeholder="Jean">
            <mat-icon matPrefix>person</mat-icon>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" placeholder="jean.dupont@hgd.cm">
          <mat-icon matPrefix>email</mat-icon>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Email invalide</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" *ngIf="!data.user">
          <mat-label>Mot de passe</mat-label>
          <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
          <mat-icon matPrefix>lock</mat-icon>
          <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
            <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-hint>Minimum 6 caractères</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Rôle</mat-label>
          <mat-select formControlName="role">
            <mat-option value="TECHNICIEN">
              <mat-icon>biotech</mat-icon> Technicien de laboratoire
            </mat-option>
            <mat-option value="ADMIN">
              <mat-icon>admin_panel_settings</mat-icon> Administrateur
            </mat-option>
          </mat-select>
          <mat-icon matPrefix>work</mat-icon>
        </mat-form-field>

        <mat-slide-toggle formControlName="isActive" color="primary" *ngIf="data.user">
          Compte actif
        </mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" (click)="save()" 
              [disabled]="!form.valid || saving">
        <mat-spinner diameter="18" *ngIf="saving"></mat-spinner>
        <mat-icon *ngIf="!saving">{{ data.user ? 'save' : 'person_add' }}</mat-icon>
        {{ saving ? 'En cours...' : (data.user ? 'Enregistrer' : 'Créer') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { 
      display: flex; 
      align-items: center; 
      gap: 12px;
      margin: 0;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1565C0, #1976D2);
      color: white;
      margin: -24px -24px 24px -24px;
    }
    .form-row { 
      display: flex; 
      gap: 16px; 
    }
    .form-row mat-form-field { 
      flex: 1; 
    }
    .full-width { 
      width: 100%; 
    }
    mat-slide-toggle { 
      margin: 16px 0; 
      display: block; 
    }
    mat-dialog-content {
      padding-top: 0 !important;
    }
    mat-dialog-actions {
      padding: 16px 24px !important;
      margin: 0 -24px -24px -24px !important;
      background: #f5f5f5;
    }
    mat-dialog-actions button mat-spinner { 
      display: inline-block; 
      margin-right: 8px; 
    }
    @media (max-width: 500px) {
      .form-row { 
        flex-direction: column; 
        gap: 0; 
      }
    }
  `]
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
