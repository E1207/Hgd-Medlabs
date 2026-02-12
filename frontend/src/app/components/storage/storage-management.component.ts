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
  templateUrl: './storage-management.component.html',
  styleUrls: ['./storage-management.component.scss']
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
