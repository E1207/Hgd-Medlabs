import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-viewer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="pdf-dialog">
      <div class="dialog-header">
        <h2>
          <mat-icon>picture_as_pdf</mat-icon>
          {{ data.fileName }}
        </h2>
        <button mat-icon-button (click)="close()" matTooltip="Fermer">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="pdf-container" *ngIf="pdfUrl; else loading">
        <iframe [src]="pdfUrl" width="100%" height="100%"></iframe>
      </div>
      
      <ng-template #loading>
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Chargement du PDF...</p>
        </div>
      </ng-template>
      
      <div class="dialog-actions">
        <button mat-stroked-button (click)="download()">
          <mat-icon>download</mat-icon> Télécharger
        </button>
        <button mat-raised-button color="primary" (click)="close()">
          Fermer
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .pdf-dialog {
      display: flex;
      flex-direction: column;
      height: 80vh;
      width: 100%;
      min-width: 300px;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
      background: linear-gradient(135deg, #1565C0 0%, #1976D2 100%);
      color: white;
    }
    .dialog-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
    }
    .dialog-header button {
      color: white;
    }
    .pdf-container {
      flex: 1;
      overflow: hidden;
      background: #525659;
    }
    .pdf-container iframe {
      border: none;
      background: white;
    }
    .loading-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 16px;
      color: #666;
      background: #f5f5f5;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 12px 16px;
      border-top: 1px solid #e0e0e0;
      background: #fafafa;
    }
    @media (max-width: 600px) {
      .pdf-dialog {
        height: 85vh;
      }
      .dialog-header h2 {
        font-size: 14px;
      }
      .dialog-actions {
        flex-direction: column;
        gap: 8px;
      }
      .dialog-actions button {
        width: 100%;
      }
    }
  `]
})
export class PdfViewerDialogComponent implements OnDestroy {
  pdfUrl: SafeResourceUrl | null = null;
  private objectUrl: string | null = null;

  constructor(
    private sanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<PdfViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { blob: Blob; fileName: string }
  ) {
    this.objectUrl = URL.createObjectURL(data.blob);
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
  }

  close(): void {
    this.dialogRef.close();
  }

  download(): void {
    if (this.objectUrl) {
      const link = document.createElement('a');
      link.href = this.objectUrl;
      link.download = this.data.fileName;
      link.click();
    }
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }
}
