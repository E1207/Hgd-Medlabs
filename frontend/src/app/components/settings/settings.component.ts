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
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
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
