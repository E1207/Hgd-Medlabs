import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { PatientResultService } from '../../services/patient-result.service';
import { DashboardStats, PatientResult } from '../../models/patient-result.model';

registerLocaleData(localeFr);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats?: DashboardStats;
  recentResults: PatientResult[] = [];
  displayedColumns = ['referenceDossier', 'patientName', 'status', 'date'];
  today = new Date();

  constructor(private resultService: PatientResultService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentResults();
  }

  loadStats(): void {
    this.resultService.getDashboardStats().subscribe({
      next: (stats) => this.stats = stats,
      error: (err) => console.error('Erreur chargement stats', err)
    });
  }

  loadRecentResults(): void {
    this.resultService.getRecentResults(10).subscribe({
      next: (results) => this.recentResults = results,
      error: (err) => console.error('Erreur chargement résultats récents', err)
    });
  }

  getPatientName(result: PatientResult): string {
    const name = `${result.patientFirstName || ''} ${result.patientLastName || ''}`.trim();
    return name || 'Non renseigné';
  }

  getPatientInitials(result: PatientResult): string {
    const first = result.patientFirstName?.charAt(0) || '';
    const last = result.patientLastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'IMPORTED': 'Importé',
      'COMPLETED': 'Complété',
      'SENT': 'Envoyé',
      'RECEIVED': 'Reçu',
      'OPENED': 'Consulté'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'IMPORTED': 'warn',
      'COMPLETED': 'accent',
      'SENT': 'primary',
      'OPENED': 'success'
    };
    return colors[status] || 'basic';
  }
}
