import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
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
    RouterLink,
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats?: DashboardStats;
  recentResults: PatientResult[] = [];
  displayedColumns = ['referenceDossier', 'patientName', 'status', 'date'];
  today = new Date();

  // ===== CHART CONFIGURATIONS =====
  
  // Donut Chart - Distribution des statuts
  statusChartType = 'doughnut' as const;
  statusChartData: ChartData<'doughnut'> = {
    labels: ['Importés', 'Complétés', 'Envoyés', 'Consultés'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: [
        '#f59e0b',  // Orange - Importés
        '#8b5cf6',  // Violet - Complétés
        '#3b82f6',  // Bleu - Envoyés
        '#10b981'   // Vert - Consultés
      ],
      borderWidth: 0,
      hoverOffset: 8
    }]
  };
  statusChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: 500 }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 13, weight: 600 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return ` ${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Bar Chart - Résultats par jour (7 derniers jours)
  weeklyChartType = 'bar' as const;
  weeklyChartData: ChartData<'bar'> = {
    labels: ['', '', '', '', '', '', ''],
    datasets: [{
      label: 'Résultats importés',
      data: [0, 0, 0, 0, 0, 0, 0],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 28
    }, {
      label: 'Résultats envoyés',
      data: [0, 0, 0, 0, 0, 0, 0],
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 28
    }]
  };
  weeklyChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { 
          stepSize: 1,
          font: { size: 11 }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 13, weight: 600 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8
      }
    }
  };

  // Line Chart - Taux d'ouverture (7 derniers jours)
  openRateChartType = 'line' as const;
  openRateChartData: ChartData<'line'> = {
    labels: ['', '', '', '', '', '', ''],
    datasets: [{
      label: 'Taux d\'ouverture (%)',
      data: [0, 0, 0, 0, 0, 0, 0],
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#06b6d4',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7
    }]
  };
  openRateChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#f1f5f9' },
        ticks: { 
          callback: (value) => value + '%',
          font: { size: 11 }
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 13, weight: 600 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` Taux: ${context.parsed.y}%`
        }
      }
    }
  };

  constructor(private resultService: PatientResultService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentResults();
  }

  loadStats(): void {
    this.resultService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.updateCharts(stats);
      },
      error: (err) => console.error('Erreur chargement stats', err)
    });
  }

  loadRecentResults(): void {
    this.resultService.getRecentResults(5).subscribe({
      next: (results) => {
        this.recentResults = results;
      },
      error: (err) => console.error('Erreur chargement résultats récents', err)
    });
  }

  private updateCharts(stats: DashboardStats): void {
    // Mise à jour du graphique des statuts (Donut)
    if (stats.statusDistribution) {
      const imported = stats.statusDistribution['IMPORTED'] || 0;
      const completed = stats.statusDistribution['COMPLETED'] || 0;
      const sent = stats.statusDistribution['SENT'] || 0;
      const opened = stats.statusDistribution['OPENED'] || 0;
      
      this.statusChartData = {
        ...this.statusChartData,
        datasets: [{
          ...this.statusChartData.datasets[0],
          data: [imported, completed, sent, opened]
        }]
      };
    }

    // Mise à jour du graphique hebdomadaire (Bar) avec les vraies données
    if (stats.weeklyStats && stats.weeklyStats.length > 0) {
      const labels = stats.weeklyStats.map(d => d.dayLabel);
      const importedData = stats.weeklyStats.map(d => d.importedCount);
      const sentData = stats.weeklyStats.map(d => d.sentCount);
      const openRateData = stats.weeklyStats.map(d => Math.round(d.openRate));

      this.weeklyChartData = {
        labels: labels,
        datasets: [
          {
            ...this.weeklyChartData.datasets[0],
            data: importedData
          },
          {
            ...this.weeklyChartData.datasets[1],
            data: sentData
          }
        ]
      };

      // Mise à jour du graphique du taux d'ouverture (Line) avec les vraies données
      this.openRateChartData = {
        labels: labels,
        datasets: [{
          ...this.openRateChartData.datasets[0],
          data: openRateData
        }]
      };
    }
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
