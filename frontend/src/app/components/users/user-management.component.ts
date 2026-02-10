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
  template: `
    <div class="users-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <div class="icon-wrapper">
              <mat-icon>group</mat-icon>
            </div>
            <div>
              <h1>Gestion des Utilisateurs</h1>
              <p class="subtitle">Gérez les techniciens et membres de l'équipe du laboratoire</p>
            </div>
          </div>
          <button mat-raised-button color="primary" (click)="openCreateDialog()" class="add-btn">
            <mat-icon>person_add</mat-icon>
            Nouvel Utilisateur
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <mat-card class="mini-stat">
          <mat-icon class="stat-icon total">people</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ users.length }}</span>
            <span class="stat-label">Total</span>
          </div>
        </mat-card>
        <mat-card class="mini-stat">
          <mat-icon class="stat-icon admin">admin_panel_settings</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ getAdminCount() }}</span>
            <span class="stat-label">Admins</span>
          </div>
        </mat-card>
        <mat-card class="mini-stat">
          <mat-icon class="stat-icon tech">biotech</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ getTechCount() }}</span>
            <span class="stat-label">Techniciens</span>
          </div>
        </mat-card>
        <mat-card class="mini-stat">
          <mat-icon class="stat-icon active">check_circle</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ getActiveCount() }}</span>
            <span class="stat-label">Actifs</span>
          </div>
        </mat-card>
      </div>

      <!-- Users Table -->
      <mat-card class="users-card">
        <mat-card-content>
          <table mat-table [dataSource]="users" class="users-table" *ngIf="users.length > 0 && !loading">
            <ng-container matColumnDef="avatar">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let user">
                <div class="user-avatar" [class.inactive]="!user.isActive">
                  {{ getInitials(user) }}
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nom Complet</th>
              <td mat-cell *matCellDef="let user">
                <div class="user-name">
                  <strong>{{ user.lastName }} {{ user.firstName }}</strong>
                  <span class="user-email">{{ user.email }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Rôle</th>
              <td mat-cell *matCellDef="let user">
                <span class="role-badge" [ngClass]="user.role">
                  <mat-icon>{{ user.role === 'ADMIN' ? 'admin_panel_settings' : 'biotech' }}</mat-icon>
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let user">
                <span class="status-chip" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                  <mat-icon>{{ user.isActive ? 'check_circle' : 'cancel' }}</mat-icon>
                  {{ user.isActive ? 'Actif' : 'Inactif' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Inscrit le</th>
              <td mat-cell *matCellDef="let user">
                {{ user.createdAt | date:'dd/MM/yyyy' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="actions-header">Actions</th>
              <td mat-cell *matCellDef="let user">
                <button mat-icon-button [matMenuTriggerFor]="actionMenu" matTooltip="Actions">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #actionMenu="matMenu">
                  <button mat-menu-item (click)="openEditDialog(user)">
                    <mat-icon>edit</mat-icon>
                    <span>Modifier</span>
                  </button>
                  <button mat-menu-item (click)="toggleStatus(user)">
                    <mat-icon>{{ user.isActive ? 'block' : 'check_circle' }}</mat-icon>
                    <span>{{ user.isActive ? 'Désactiver' : 'Activer' }}</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="confirmDelete(user)" class="delete-action">
                    <mat-icon color="warn">delete</mat-icon>
                    <span>Supprimer</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns" 
                [class.inactive-row]="!row.isActive"></tr>
          </table>

          <!-- Loading -->
          <div class="loading-state" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Chargement des utilisateurs...</p>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="users.length === 0 && !loading">
            <mat-icon>person_add</mat-icon>
            <h3>Aucun utilisateur</h3>
            <p>Commencez par ajouter des membres de l'équipe</p>
            <button mat-raised-button color="primary" (click)="openCreateDialog()">
              <mat-icon>add</mat-icon> Ajouter un utilisateur
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .users-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      background: linear-gradient(135deg, #1565C0 0%, #0D47A1 100%);
      border-radius: 16px;
      padding: 28px 32px;
      margin-bottom: 24px;
      color: white;
      box-shadow: 0 4px 20px rgba(21, 101, 192, 0.3);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .icon-wrapper {
      width: 56px;
      height: 56px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 32px; width: 32px; height: 32px; }
    }

    h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .subtitle { margin: 4px 0 0; opacity: 0.9; font-size: 14px; }

    .add-btn {
      height: 44px;
      padding: 0 24px;
      font-weight: 500;
      mat-icon { margin-right: 8px; }
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .mini-stat {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-radius: 12px;
      border: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      font-size: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      &.total { background: #E3F2FD; color: #1565C0; }
      &.admin { background: #F3E5F5; color: #7B1FA2; }
      &.tech { background: #E8F5E9; color: #388E3C; }
      &.active { background: #E0F7FA; color: #00897B; }
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value { font-size: 24px; font-weight: 700; color: #333; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }

    .users-card {
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .users-table {
      width: 100%;
    }

    .user-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1565C0, #42A5F5);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      &.inactive { background: #9E9E9E; }
    }

    .user-name {
      display: flex;
      flex-direction: column;
      strong { font-size: 14px; }
      .user-email { font-size: 12px; color: #666; }
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &.ADMIN { background: #F3E5F5; color: #7B1FA2; }
      &.TECHNICIEN { background: #E8F5E9; color: #388E3C; }
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &.active { color: #388E3C; }
      &.inactive { color: #F44336; }
    }

    .inactive-row { background: #FAFAFA; opacity: 0.8; }
    .actions-header { width: 60px; text-align: center; }

    .delete-action { color: #F44336; }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state {
      mat-icon { font-size: 64px; width: 64px; height: 64px; color: #ccc; margin-bottom: 16px; }
      h3 { margin: 0 0 8px; color: #333; }
      p { margin: 0 0 20px; }
    }

    @media (max-width: 768px) {
      .header-content { flex-direction: column; align-items: flex-start; }
      .add-btn { width: 100%; }
    }
  `]
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
