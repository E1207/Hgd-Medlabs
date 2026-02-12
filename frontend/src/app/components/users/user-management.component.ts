import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { UserService, UserRequest } from '../../services/user.service';
import { User, UserRole } from '../../models/user.model';
import { UserDialogComponent } from './user-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  displayedColumns = ['avatar', 'name', 'role', 'status', 'createdAt', 'actions'];
  loading = false;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement des utilisateurs', 'Fermer', { duration: 5000 });
      }
    });
  }

  getInitials(user: User): string {
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getRoleLabel(role: string): string {
    return role === 'ADMIN' ? 'Administrateur' : 'Technicien';
  }

  getAdminCount(): number {
    return this.users.filter(u => u.role === UserRole.ADMIN).length;
  }

  getTechCount(): number {
    return this.users.filter(u => u.role === UserRole.TECHNICIEN).length;
  }

  getActiveCount(): number {
    return this.users.filter(u => u.isActive).length;
  }

  openCreateDialog(): void {
    const form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['TECHNICIEN', Validators.required],
      isActive: [true]
    });

    const dialogRef = this.dialog.open(UserDialogComponent, {
      data: { user: null, form },
      panelClass: 'user-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadUsers();
    });
  }

  openEditDialog(user: User): void {
    const form = this.fb.group({
      firstName: [user.firstName, Validators.required],
      lastName: [user.lastName, Validators.required],
      email: [user.email, [Validators.required, Validators.email]],
      password: [''],
      role: [user.role, Validators.required],
      isActive: [user.isActive]
    });

    const dialogRef = this.dialog.open(UserDialogComponent, {
      data: { user, form },
      panelClass: 'user-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadUsers();
    });
  }

  toggleStatus(user: User): void {
    const request: UserRequest = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: !user.isActive
    };

    this.userService.updateUser(user.id, request).subscribe({
      next: () => {
        this.snackBar.open(
          user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé',
          'OK',
          { duration: 3000 }
        );
        this.loadUsers();
      },
      error: () => {
        this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 5000 });
      }
    });
  }

  confirmDelete(user: User): void {
    if (confirm(`Supprimer définitivement ${user.firstName} ${user.lastName} ?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.snackBar.open('Utilisateur supprimé', 'OK', { duration: 3000 });
          this.loadUsers();
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 5000 });
        }
      });
    }
  }
}
