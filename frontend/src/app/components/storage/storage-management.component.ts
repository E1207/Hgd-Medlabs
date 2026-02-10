import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { StorageService, StorageStats, IntegrityCheckResult } from '../../services/storage.service';

@Component({
  selector: 'app-storage-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="storage-container">
      <div class="page-header">
        <h1>
          <mat-icon>storage</mat-icon>
          Gestion du Stockage Local
        </h1>
        <p class="subtitle">Surveillance et maintenance du stockage des fichiers PDF</p>
      </div>

      <!-- Statistiques principales -->
      <div class="stats-grid" *ngIf="stats; else loadingStats">
        <!-- Espace disque -->
        <mat-card class="stat-card disk-usage">
          <mat-card-header>
            <mat-icon mat-card-avatar [class]="stats.alertLevel.toLowerCase()">
              {{ stats.alertLevel === 'OK' ? 'check_circle' : stats.alertLevel === 'WARNING' ? 'warning' : 'error' }}
            </mat-icon>
            <mat-card-title>Espace Disque</mat-card-title>
            <mat-card-subtitle>{{ stats.alertMessage }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="usage-info">
              <span class="usage-text">{{ stats.usagePercentage | number:'1.1-1' }}% utilisé</span>
              <span class="free-text">{{ stats.freeSpaceGB }} Go libres sur {{ stats.totalSpaceGB }} Go</span>
            </div>
            <mat-progress-bar 
              [mode]="'determinate'" 
              [value]="stats.usagePercentage"
              [class]="stats.alertLevel.toLowerCase()">
            </mat-progress-bar>
          </mat-card-content>
        </mat-card>

        <!-- Fichiers -->
        <mat-card class="stat-card files-count">
          <mat-card-header>
            <mat-icon mat-card-avatar class="primary">picture_as_pdf</mat-icon>
            <mat-card-title>Fichiers PDF</mat-card-title>
            <mat-card-subtitle>Total des résultats stockés</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="big-number">{{ stats.totalFiles | number }}</div>
            <div class="stat-detail">fichiers dans le système</div>
          </mat-card-content>
        </mat-card>

        <!-- Espace utilisé -->
        <mat-card class="stat-card space-used">
          <mat-card-header>
            <mat-icon mat-card-avatar class="accent">folder</mat-icon>
            <mat-card-title>Espace Utilisé</mat-card-title>
            <mat-card-subtitle>Par les fichiers MedLab</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="big-number">{{ stats.totalUsedMB | number }} Mo</div>
            <div class="stat-detail">total utilisé</div>
          </mat-card-content>
        </mat-card>
      </div>

      <ng-template #loadingStats>
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <span>Chargement des statistiques...</span>
        </div>
      </ng-template>

      <!-- Détails des répertoires -->
      <mat-card class="directories-card" *ngIf="stats">
        <mat-card-header>
          <mat-icon mat-card-avatar>folder_open</mat-icon>
          <mat-card-title>Répertoires de Stockage</mat-card-title>
          <mat-card-subtitle>Chemins configurés sur le serveur</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="directory-list">
            <div class="directory-item">
              <mat-icon>cloud_upload</mat-icon>
              <div class="directory-info">
                <span class="directory-label">Uploads (résultats manuels)</span>
                <code class="directory-path">{{ stats.uploadsDirPath }}</code>
              </div>
              <span class="directory-size">{{ stats.uploadsDirSizeMB }} Mo</span>
            </div>
            <mat-divider></mat-divider>
            <div class="directory-item">
              <mat-icon>visibility</mat-icon>
              <div class="directory-info">
                <span class="directory-label">Incoming (import automatique)</span>
                <code class="directory-path">{{ stats.watchDirPath }}</code>
              </div>
              <span class="directory-size">{{ stats.watchDirSizeMB }} Mo</span>
            </div>
            <mat-divider *ngIf="stats.archiveDirPath"></mat-divider>
            <div class="directory-item" *ngIf="stats.archiveDirPath">
              <mat-icon>archive</mat-icon>
              <div class="directory-info">
                <span class="directory-label">Archives (fichiers anciens)</span>
                <code class="directory-path">{{ stats.archiveDirPath }}</code>
              </div>
              <span class="directory-size">{{ stats.archiveDirSizeMB }} Mo</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Actions de maintenance -->
      <mat-card class="actions-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>build</mat-icon>
          <mat-card-title>Actions de Maintenance</mat-card-title>
          <mat-card-subtitle>Opérations administratives</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="actions-grid">
            <!-- Rafraîchir -->
            <button mat-raised-button color="primary" (click)="loadStats()" [disabled]="loading">
              <mat-icon>refresh</mat-icon>
              Actualiser les statistiques
            </button>

            <!-- Vérifier l'intégrité -->
            <button mat-raised-button (click)="checkIntegrity()" [disabled]="checkingIntegrity">
              <mat-icon>verified_user</mat-icon>
              {{ checkingIntegrity ? 'Vérification...' : 'Vérifier l\\'intégrité' }}
            </button>

            <!-- Créer une sauvegarde -->
            <button mat-raised-button color="accent" (click)="createBackup()" [disabled]="creatingBackup">
              <mat-icon>backup</mat-icon>
              {{ creatingBackup ? 'Sauvegarde en cours...' : 'Créer une sauvegarde' }}
            </button>

            <!-- Archiver -->
            <button mat-raised-button (click)="triggerArchive()" [disabled]="archiving">
              <mat-icon>archive</mat-icon>
              {{ archiving ? 'Archivage...' : 'Archiver les anciens fichiers' }}
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Résultat de la vérification d'intégrité -->
      <mat-card class="integrity-card" *ngIf="integrityResult">
        <mat-card-header>
          <mat-icon mat-card-avatar [class]="integrityResult.success ? 'ok' : 'critical'">
            {{ integrityResult.success ? 'check_circle' : 'error' }}
          </mat-icon>
          <mat-card-title>Résultat de la Vérification</mat-card-title>
          <mat-card-subtitle>
            {{ integrityResult.totalFiles }} fichiers vérifiés
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="integrityResult.success" class="success-message">
            <mat-icon>check</mat-icon>
            Tous les fichiers sont intègres. Aucun problème détecté.
          </div>
          <div *ngIf="!integrityResult.success" class="error-details">
            <div *ngIf="integrityResult.corruptedFiles.length > 0">
              <strong>Fichiers corrompus ({{ integrityResult.corruptedFiles.length }}):</strong>
              <ul>
                <li *ngFor="let file of integrityResult.corruptedFiles">{{ file }}</li>
              </ul>
            </div>
            <div *ngIf="integrityResult.emptyFiles.length > 0">
              <strong>Fichiers vides ({{ integrityResult.emptyFiles.length }}):</strong>
              <ul>
                <li *ngFor="let file of integrityResult.emptyFiles">{{ file }}</li>
              </ul>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .storage-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 28px;
      font-weight: 600;
      color: #1a365d;
      margin: 0 0 8px 0;
    }

    .page-header h1 mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #2563eb;
    }

    .subtitle {
      color: #64748b;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .stat-card {
      border-radius: 12px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
    }

    .stat-card mat-card-header {
      padding: 16px 16px 0;
    }

    .stat-card mat-icon[mat-card-avatar] {
      background: #e8f4fd;
      border-radius: 50%;
      padding: 8px;
      font-size: 24px;
      width: 40px;
      height: 40px;
    }

    .stat-card mat-icon.ok, .stat-card mat-icon.primary {
      color: #10b981;
      background: #d1fae5;
    }

    .stat-card mat-icon.warning {
      color: #f59e0b;
      background: #fef3c7;
    }

    .stat-card mat-icon.critical {
      color: #ef4444;
      background: #fee2e2;
    }

    .stat-card mat-icon.accent {
      color: #2563eb;
      background: #dbeafe;
    }

    .usage-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .usage-text {
      font-weight: 600;
      font-size: 18px;
    }

    .free-text {
      color: #64748b;
      font-size: 14px;
    }

    mat-progress-bar.ok ::ng-deep .mdc-linear-progress__bar-inner {
      border-color: #10b981;
    }

    mat-progress-bar.warning ::ng-deep .mdc-linear-progress__bar-inner {
      border-color: #f59e0b;
    }

    mat-progress-bar.critical ::ng-deep .mdc-linear-progress__bar-inner {
      border-color: #ef4444;
    }

    .big-number {
      font-size: 36px;
      font-weight: 700;
      color: #1a365d;
      line-height: 1;
    }

    .stat-detail {
      color: #64748b;
      margin-top: 4px;
    }

    .directories-card, .actions-card, .integrity-card {
      border-radius: 12px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
      margin-bottom: 24px;
    }

    .directory-list {
      padding: 8px 0;
    }

    .directory-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
    }

    .directory-item mat-icon {
      color: #64748b;
    }

    .directory-info {
      flex: 1;
    }

    .directory-label {
      display: block;
      font-weight: 500;
      color: #1a365d;
    }

    .directory-path {
      display: block;
      font-size: 12px;
      color: #64748b;
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: 4px;
      margin-top: 4px;
    }

    .directory-size {
      font-weight: 600;
      color: #2563eb;
      white-space: nowrap;
    }

    .actions-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .actions-grid button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 48px;
      color: #64748b;
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #10b981;
      font-weight: 500;
    }

    .error-details {
      color: #ef4444;
    }

    .error-details ul {
      margin: 8px 0;
      padding-left: 24px;
    }

    .error-details li {
      font-family: monospace;
      font-size: 12px;
      margin: 4px 0;
    }
  `]
})
export class StorageManagementComponent implements OnInit {
  stats: StorageStats | null = null;
  integrityResult: IntegrityCheckResult | null = null;
  loading = false;
  checkingIntegrity = false;
  creatingBackup = false;
  archiving = false;

  constructor(
    private storageService: StorageService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.storageService.getStorageStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des stats:', error);
        this.snackBar.open('Erreur lors du chargement des statistiques', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  checkIntegrity(): void {
    this.checkingIntegrity = true;
    this.integrityResult = null;
    
    this.storageService.checkIntegrity().subscribe({
      next: (result) => {
        this.integrityResult = result;
        this.checkingIntegrity = false;
        
        if (result.success) {
          this.snackBar.open('✓ Tous les fichiers sont intègres', 'Fermer', { duration: 3000 });
        } else {
          this.snackBar.open('⚠ Problèmes détectés - voir les détails', 'Fermer', { duration: 5000 });
        }
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.snackBar.open('Erreur lors de la vérification', 'Fermer', { duration: 3000 });
        this.checkingIntegrity = false;
      }
    });
  }

  createBackup(): void {
    this.creatingBackup = true;
    
    this.storageService.createBackup().subscribe({
      next: (response) => {
        this.creatingBackup = false;
        if (response.status === 'success') {
          this.snackBar.open(`✓ Sauvegarde créée: ${response.backupPath}`, 'Fermer', { duration: 5000 });
        } else {
          this.snackBar.open(`Erreur: ${response.message}`, 'Fermer', { duration: 5000 });
        }
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        this.creatingBackup = false;
      }
    });
  }

  triggerArchive(): void {
    this.archiving = true;
    
    this.storageService.triggerArchive().subscribe({
      next: (response) => {
        this.archiving = false;
        this.snackBar.open(`✓ ${response.message}`, 'Fermer', { duration: 3000 });
        this.loadStats(); // Refresh stats
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.snackBar.open('Erreur lors de l\'archivage', 'Fermer', { duration: 3000 });
        this.archiving = false;
      }
    });
  }
}
