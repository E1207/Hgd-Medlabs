import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { PatientResultService } from '../../../services/patient-result.service';
import { PatientResult } from '../../../models/patient-result.model';
import { CompleteDialogComponent } from './complete-dialog.component';
import { PdfViewerDialogComponent } from './pdf-viewer-dialog.component';

@Component({
  selector: 'app-result-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    RouterLink
  ],
  template: `
    <div class="list-container">
      <!-- Modern Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <div class="icon-wrapper">
              <mat-icon>folder_open</mat-icon>
            </div>
            <div>
              <h1>Historique des Résultats</h1>
              <p class="subtitle">Gérez et suivez tous les résultats de laboratoire</p>
            </div>
          </div>
          <div class="header-actions">
            <div class="search-wrapper">
              <mat-icon>search</mat-icon>
              <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="onSearch()" placeholder="Rechercher...">
            </div>
            <button mat-flat-button color="primary" routerLink="/results/upload" class="add-btn">
              <mat-icon>add</mat-icon> Nouveau
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Pills -->
      <div class="filter-pills">
        <button [class.active]="!statusFilter" (click)="filterByStatus(undefined)">
          Tous <span class="count">{{ totalElements }}</span>
        </button>
        <button [class.active]="statusFilter === 'IMPORTED'" (click)="filterByStatus('IMPORTED')">
          <span class="dot imported"></span> Importés
        </button>
        <button [class.active]="statusFilter === 'COMPLETED'" (click)="filterByStatus('COMPLETED')">
          <span class="dot completed"></span> Complétés
        </button>
        <button [class.active]="statusFilter === 'SENT'" (click)="filterByStatus('SENT')">
          <span class="dot sent"></span> Envoyés
        </button>
        <button [class.active]="statusFilter === 'OPENED'" (click)="filterByStatus('OPENED')">
          <span class="dot opened"></span> Consultés
        </button>
      </div>

      <!-- Results Table -->
      <div class="table-card">
        <table mat-table [dataSource]="results" class="results-table" *ngIf="results.length > 0">
          <ng-container matColumnDef="referenceDossier">
            <th mat-header-cell *matHeaderCellDef>Référence</th>
            <td mat-cell *matCellDef="let result">
              <span class="reference-badge">{{ result.referenceDossier }}</span>
              <div class="import-method" *ngIf="result.importMethod">
                <mat-icon class="mini-icon">{{ result.importMethod === 'AUTO' ? 'autorenew' : 'person' }}</mat-icon>
                {{ result.importMethod === 'AUTO' ? 'Auto' : 'Manuel' }}
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="patient">
            <th mat-header-cell *matHeaderCellDef>Patient</th>
            <td mat-cell *matCellDef="let result">
              <div class="patient-cell" *ngIf="result.patientLastName || result.patientFirstName">
                <div class="patient-avatar">{{ getPatientInitials(result) }}</div>
                <span>{{ result.patientLastName || '' }} {{ result.patientFirstName || '' }}</span>
              </div>
              <span *ngIf="!result.patientFirstName && !result.patientLastName" class="incomplete-tag">
                <mat-icon>edit</mat-icon> À compléter
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let result" class="email-cell">
              {{ result.patientEmail || '—' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let result">
              <span class="status-chip" [ngClass]="result.status">
                <span class="status-dot"></span>
                {{ getStatusLabel(result.status) }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let result" class="date-cell">
              {{ result.createdAt | date:'dd/MM/yyyy HH:mm' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let result">
              <div class="action-buttons">
                <button mat-icon-button matTooltip="Compléter" class="action-btn edit"
                        *ngIf="result.status === 'IMPORTED'" (click)="openCompleteDialog(result)">
                  <mat-icon>edit_note</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Envoyer" class="action-btn send"
                        *ngIf="result.status === 'COMPLETED'" (click)="sendResult(result)">
                  <mat-icon>send</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Visualiser" class="action-btn view" (click)="viewPdf(result)">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Télécharger" class="action-btn download" (click)="downloadPdf(result)">
                  <mat-icon>download</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Supprimer" class="action-btn delete" (click)="deleteResult(result)">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns" [class.imported-row]="row.status === 'IMPORTED'"></tr>
        </table>

        <div class="empty-state" *ngIf="results.length === 0 && !loading">
          <mat-icon>inbox</mat-icon>
          <h3>Aucun résultat trouvé</h3>
          <p>Commencez par importer un nouveau résultat</p>
          <button mat-flat-button color="primary" routerLink="/results/upload">
            <mat-icon>add</mat-icon> Ajouter un résultat
          </button>
        </div>

        <div class="loading-state" *ngIf="loading">
          <mat-icon>hourglass_empty</mat-icon>
          <p>Chargement en cours...</p>
        </div>

        <mat-paginator *ngIf="totalElements > 0"
          [length]="totalElements" [pageSize]="pageSize"
          [pageSizeOptions]="[5, 10, 25, 50]"
          (page)="onPageChange($event)" showFirstLastButtons>
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .list-container { max-width: 1400px; margin: 0 auto; }

    /* Modern Header */
    .page-header {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%);
      border-radius: 20px;
      padding: 28px 32px;
      margin-bottom: 24px;
      color: white;
      box-shadow: 0 10px 40px rgba(59, 130, 246, 0.25);
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
      backdrop-filter: blur(10px);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-wrapper mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .subtitle { margin: 4px 0 0; opacity: 0.9; font-size: 14px; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .search-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      padding: 10px 16px;
    }
    .search-wrapper mat-icon { opacity: 0.8; font-size: 20px; width: 20px; height: 20px; }
    .search-wrapper input {
      background: transparent;
      border: none;
      outline: none;
      color: white;
      font-size: 14px;
      width: 180px;
    }
    .search-wrapper input::placeholder { color: rgba(255,255,255,0.6); }
    .add-btn {
      border-radius: 12px !important;
      padding: 0 20px !important;
      height: 44px !important;
      background: white !important;
      color: #1d4ed8 !important;
      font-weight: 600 !important;
    }

    /* Filter Pills */
    .filter-pills {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .filter-pills button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border: 1px solid #e2e8f0;
      border-radius: 50px;
      background: white;
      font-size: 13px;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-pills button:hover { border-color: #3b82f6; color: #3b82f6; }
    .filter-pills button.active {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border-color: transparent;
    }
    .filter-pills .count {
      background: rgba(0,0,0,0.1);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
    .filter-pills button.active .count { background: rgba(255,255,255,0.2); }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot.imported { background: #f59e0b; }
    .dot.completed { background: #3b82f6; }
    .dot.sent { background: #10b981; }
    .dot.opened { background: #06b6d4; }

    /* Table Card */
    .table-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }
    .results-table { width: 100%; }
    .results-table th {
      font-weight: 600;
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 16px 20px !important;
      background: #fafbfc;
    }
    .results-table td {
      padding: 16px 20px !important;
      border-bottom: 1px solid #f1f5f9;
    }
    .results-table tr:hover { background: #f8fafc; }
    .imported-row { background: #fffbeb !important; }

    .reference-badge {
      font-family: 'JetBrains Mono', monospace;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      color: #1d4ed8;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      border: 1px solid #bfdbfe;
    }
    .import-method {
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
    }
    .mini-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }

    .patient-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .patient-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #a855f7, #9333ea);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 12px;
    }
    .incomplete-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #f59e0b;
      font-size: 13px;
      font-weight: 500;
    }
    .incomplete-tag mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .email-cell { color: #64748b; font-size: 13px; }
    .date-cell { color: #64748b; font-size: 13px; }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .status-chip.IMPORTED { background: #fef3c7; color: #d97706; border: 1px solid #fcd34d; }
    .status-chip.COMPLETED { background: #dbeafe; color: #2563eb; border: 1px solid #93c5fd; }
    .status-chip.SENT { background: #d1fae5; color: #059669; border: 1px solid #6ee7b7; }
    .status-chip.RECEIVED { background: #f3e8ff; color: #9333ea; border: 1px solid #c4b5fd; }
    .status-chip.OPENED { background: #cffafe; color: #0891b2; border: 1px solid #67e8f9; }

    .action-buttons { display: flex; gap: 4px; }
    .action-btn {
      width: 36px !important;
      height: 36px !important;
      border-radius: 10px !important;
      transition: all 0.2s;
    }
    .action-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .action-btn.edit { color: #f59e0b; }
    .action-btn.edit:hover { background: #fef3c7; }
    .action-btn.send { color: #10b981; }
    .action-btn.send:hover { background: #d1fae5; }
    .action-btn.view { color: #3b82f6; }
    .action-btn.view:hover { background: #dbeafe; }
    .action-btn.download { color: #8b5cf6; }
    .action-btn.download:hover { background: #f3e8ff; }
    .action-btn.delete { color: #ef4444; }
    .action-btn.delete:hover { background: #fee2e2; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      text-align: center;
    }
    .empty-state mat-icon { font-size: 72px; width: 72px; height: 72px; color: #cbd5e1; margin-bottom: 16px; }
    .empty-state h3 { margin: 0 0 8px; font-size: 18px; color: #334155; }
    .empty-state p { margin: 0 0 24px; color: #64748b; }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      color: #64748b;
    }
    .loading-state mat-icon { font-size: 48px; width: 48px; height: 48px; animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .header-content { flex-direction: column; align-items: flex-start; }
      .header-actions { width: 100%; flex-wrap: wrap; }
      .search-wrapper { flex: 1; }
      .search-wrapper input { width: 100%; }
    }
  `]
})
export class ResultListComponent implements OnInit {
  results: PatientResult[] = [];
  displayedColumns = ['referenceDossier', 'patient', 'email', 'status', 'date', 'actions'];
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;
  loading = false;
  searchQuery = '';
  statusFilter?: string;

  constructor(
    private resultService: PatientResultService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadResults();
  }

  loadResults(): void {
    this.loading = true;
    this.resultService.getAllResults(
      this.statusFilter, undefined, undefined,
      this.searchQuery || undefined,
      this.currentPage, this.pageSize
    ).subscribe({
      next: (response) => {
        this.results = response.content;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement résultats', err);
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement des résultats', 'Fermer', { duration: 5000 });
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadResults();
  }

  filterByStatus(status?: string): void {
    this.statusFilter = status;
    this.currentPage = 0;
    this.loadResults();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadResults();
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

  getPatientInitials(result: PatientResult): string {
    const firstName = result.patientFirstName || '';
    const lastName = result.patientLastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  }

  openCompleteDialog(result: PatientResult): void {
    const dialogRef = this.dialog.open(CompleteDialogComponent, {
      data: { result },
      panelClass: 'complete-dialog-panel',
      autoFocus: true,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(completed => {
      if (completed) {
        this.loadResults();
      }
    });
  }

  sendResult(result: PatientResult): void {
    if (!result.patientEmail) {
      this.snackBar.open('Email du patient requis pour envoyer', 'Fermer', { duration: 4000 });
      return;
    }
    this.resultService.sendResult(result.id).subscribe({
      next: () => {
        this.snackBar.open('Résultat envoyé au patient!', 'Fermer', { duration: 3000 });
        this.loadResults();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Erreur lors de l\'envoi', 'Fermer', { duration: 5000 });
      }
    });
  }

  viewPdf(result: PatientResult): void {
    this.resultService.downloadPdf(result.id).subscribe({
      next: (blob) => {
        this.dialog.open(PdfViewerDialogComponent, {
          data: { blob, fileName: result.pdfFileName || 'resultat.pdf' },
          panelClass: 'pdf-viewer-dialog-panel'
        });
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'ouverture du PDF', 'Fermer', { duration: 5000 });
      }
    });
  }

  downloadPdf(result: PatientResult): void {
    this.resultService.downloadPdf(result.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.pdfFileName || 'resultat.pdf';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.snackBar.open('Erreur lors du téléchargement', 'Fermer', { duration: 5000 });
      }
    });
  }

  deleteResult(result: PatientResult): void {
    if (confirm(`Supprimer le dossier ${result.referenceDossier} ?`)) {
      this.resultService.deleteResult(result.id).subscribe({
        next: () => {
          this.snackBar.open('Résultat supprimé', 'OK', { duration: 3000 });
          this.loadResults();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Erreur lors de la suppression', 'Fermer', { duration: 5000 });
        }
      });
    }
  }
}
