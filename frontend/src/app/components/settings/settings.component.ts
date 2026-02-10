import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { SettingsService } from '../../services/settings.service';
import { AppSetting } from '../../models/patient-result.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatDividerModule
  ],
  template: `
    <div class="settings-container">
      <h1><mat-icon>settings</mat-icon> Paramètres</h1>

      <div *ngIf="loading" class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Chargement des paramètres...</p>
      </div>

      <div *ngIf="!loading" class="settings-grid">
        <!-- Répertoire surveillé -->
        <mat-card class="setting-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="setting-icon">folder_open</mat-icon>
            <mat-card-title>Répertoire Surveillé</mat-card-title>
            <mat-card-subtitle>Dossier scanné automatiquement pour importer les PDF</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Chemin du répertoire</mat-label>
              <input matInput [(ngModel)]="watchDir" placeholder="/chemin/vers/le/dossier">
              <mat-icon matPrefix>folder</mat-icon>
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-raised-button color="primary" (click)="saveSetting('watch_directory', watchDir)"
                    [disabled]="savingKey === 'watch_directory'">
              <mat-spinner diameter="18" *ngIf="savingKey === 'watch_directory'"></mat-spinner>
              <mat-icon *ngIf="savingKey !== 'watch_directory'">save</mat-icon>
              Enregistrer
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Import automatique -->
        <mat-card class="setting-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="setting-icon">schedule</mat-icon>
            <mat-card-title>Import Automatique</mat-card-title>
            <mat-card-subtitle>Active le scan automatique du répertoire surveillé</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-slide-toggle
              [(ngModel)]="schedulerEnabled"
              color="primary"
              (change)="saveSetting('scheduler_enabled', schedulerEnabled ? 'true' : 'false')">
              {{ schedulerEnabled ? 'Activé' : 'Désactivé' }}
            </mat-slide-toggle>
          </mat-card-content>
        </mat-card>

        <!-- Nom de l'hôpital -->
        <mat-card class="setting-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="setting-icon">local_hospital</mat-icon>
            <mat-card-title>Nom de l'Établissement</mat-card-title>
            <mat-card-subtitle>Affiché dans l'interface et les emails</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nom de l'hôpital</mat-label>
              <input matInput [(ngModel)]="hospitalName" placeholder="Hôpital Général de Douala">
              <mat-icon matPrefix>business</mat-icon>
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-raised-button color="primary" (click)="saveSetting('hospital_name', hospitalName)"
                    [disabled]="savingKey === 'hospital_name'">
              <mat-spinner diameter="18" *ngIf="savingKey === 'hospital_name'"></mat-spinner>
              <mat-icon *ngIf="savingKey !== 'hospital_name'">save</mat-icon>
              Enregistrer
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .settings-container { max-width: 900px; margin: 0 auto; }
    h1 {
      display: flex; align-items: center; gap: 12px;
      font-size: 24px; margin-bottom: 24px;
    }
    .loading-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 60px 0; color: #666;
      p { margin-top: 16px; }
    }
    .settings-grid { display: flex; flex-direction: column; gap: 20px; }
    .setting-card {
      mat-card-header { margin-bottom: 16px; }
      mat-card-title { font-size: 18px !important; }
    }
    .setting-icon {
      font-size: 32px !important;
      width: 48px !important;
      height: 48px !important;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: #E3F2FD;
      color: #1565C0;
    }
    .full-width { width: 100%; }
    mat-card-actions { padding: 0 16px 16px !important; }
    mat-spinner { display: inline-block; margin-right: 6px; }
  `]
})
export class SettingsComponent implements OnInit {
  loading = true;
  savingKey: string | null = null;
  
  watchDir = '';
  schedulerEnabled = true;
  hospitalName = 'Hôpital Général de Douala';

  constructor(
    private settingsService: SettingsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.settingsService.getAllSettings().subscribe({
      next: (settings) => {
        settings.forEach(s => {
          switch (s.settingKey) {
            case 'watch_directory': this.watchDir = s.settingValue; break;
            case 'scheduler_enabled': this.schedulerEnabled = s.settingValue === 'true'; break;
            case 'hospital_name': this.hospitalName = s.settingValue; break;
          }
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement des paramètres', 'Fermer', { duration: 5000 });
      }
    });
  }

  saveSetting(key: string, value: string): void {
    this.savingKey = key;
    this.settingsService.updateSetting(key, value).subscribe({
      next: () => {
        this.savingKey = null;
        this.snackBar.open('Paramètre enregistré ✓', 'OK', { duration: 2000 });
      },
      error: () => {
        this.savingKey = null;
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 5000 });
      }
    });
  }
}
