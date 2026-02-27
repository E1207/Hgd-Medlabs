import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { PatientResultService } from '../../services/patient-result.service';
import { DashboardStats } from '../../models/patient-result.model';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    FormsModule,
    BaseChartDirective
  ],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  loading = true;
  stats?: DashboardStats;
  
  // Période sélectionnée
  selectedPeriod = '7days';
  periods = [
    { value: '7days', label: '7 derniers jours' },
    { value: '30days', label: '30 derniers jours' },
    { value: '90days', label: '3 derniers mois' },
    { value: 'year', label: 'Cette année' }
  ];

  // KPIs calculés
  kpis = {
    avgProcessingTime: 0,
    peakHour: '',
    bestDay: '',
    conversionRate: 0,
    growthRate: 0
  };

  // Graphique - Répartition par type d'analyse (mock)
  analysisTypeChartType = 'pie' as const;
  analysisTypeChartData: ChartData<'pie'> = {
    labels: ['Hématologie', 'Biochimie', 'Microbiologie', 'Sérologie', 'Parasitologie'],
    datasets: [{
      data: [35, 28, 18, 12, 7],
      backgroundColor: [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#ef4444'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };
  analysisTypeChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 16,
          usePointStyle: true,
          font: { size: 12 }
        }
      }
    }
  };

  // Graphique - Évolution mensuelle
  monthlyTrendChartType = 'line' as const;
  monthlyTrendChartData: ChartData<'line'> = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: 'Résultats importés',
        data: [120, 145, 180, 165, 200, 220, 195, 210, 240, 280, 310, 350],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Résultats envoyés',
        data: [100, 130, 165, 150, 185, 200, 180, 195, 220, 260, 290, 330],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };
  monthlyTrendChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { usePointStyle: true }
      }
    }
  };

  // Graphique - Heure de pointe
  hourlyChartType = 'bar' as const;
  hourlyChartData: ChartData<'bar'> = {
    labels: ['6h', '7h', '8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'],
    datasets: [{
      label: 'Résultats traités',
      data: [5, 15, 45, 80, 95, 70, 30, 25, 55, 85, 75, 40, 10],
      backgroundColor: '#3b82f6',
      borderRadius: 6
    }]
  };
  hourlyChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } }
    },
    plugins: { legend: { display: false } }
  };

  // Graphique - Performance par jour de la semaine
  weekdayChartType = 'radar' as const;
  weekdayChartData: ChartData<'radar'> = {
    labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    datasets: [{
      label: 'Volume',
      data: [85, 90, 95, 88, 78, 40, 15],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: '#3b82f6',
      pointBackgroundColor: '#3b82f6'
    }]
  };
  weekdayChartOptions: ChartConfiguration<'radar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        grid: { color: '#e2e8f0' },
        ticks: { display: false }
      }
    },
    plugins: { legend: { display: false } }
  };

  constructor(private resultService: PatientResultService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    this.resultService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.calculateKPIs(stats);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  calculateKPIs(stats: DashboardStats): void {
    // Calculs basés sur les données réelles
    const totalSent = stats.statusDistribution?.['SENT'] || 0;
    const totalOpened = stats.statusDistribution?.['OPENED'] || 0;
    
    this.kpis = {
      avgProcessingTime: 2.5, // heures (mock)
      peakHour: '10h - 11h',
      bestDay: 'Mercredi',
      conversionRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
      growthRate: 15 // % (mock)
    };
  }

  onPeriodChange(): void {
    this.loadData();
  }

  exportPDF(): void {
    // TODO: Implémenter l'export PDF
    console.log('Export PDF');
  }

  exportExcel(): void {
    // TODO: Implémenter l'export Excel
    console.log('Export Excel');
  }

  scheduleReport(): void {
    // TODO: Implémenter la planification
    console.log('Schedule report');
  }
}
