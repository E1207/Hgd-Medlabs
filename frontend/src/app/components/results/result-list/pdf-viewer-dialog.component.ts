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
  templateUrl: './pdf-viewer-dialog.component.html',
  styleUrls: ['./pdf-viewer-dialog.component.scss']
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
