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
import { ConfirmDialogComponent } from './confirm-dialog.component';

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
  templateUrl: './result-list.component.html',
  styleUrls: ['./result-list.component.scss']
})
export class ResultListComponent implements OnInit {
  results: PatientResult[] = [];
  displayedColumns = ['referenceDossier', 'patient', 'email', 'status', 'date', 'actions'];
  totalElements = 0;
  pageSize = 5;
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer ce résultat ?',
        message: `Vous êtes sur le point de supprimer définitivement le dossier ${result.referenceDossier}. Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      },
      panelClass: 'confirm-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.resultService.deleteResult(result.id).subscribe({
          next: () => {
            this.snackBar.open('Résultat supprimé avec succès', 'OK', { 
              duration: 3000,
              panelClass: 'success-snackbar'
            });
            this.loadResults();
          },
          error: (err) => {
            console.error('Erreur suppression:', err);
            this.snackBar.open(
              err.error?.message || 'Erreur lors de la suppression', 
              'Fermer', 
              { duration: 5000, panelClass: 'error-snackbar' }
            );
          }
        });
      }
    });
  }
}
