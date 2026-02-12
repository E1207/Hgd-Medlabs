import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BrandingService } from '../../services/branding.service';
import { BrandingConfig } from '../../models/branding.model';

@Component({
  selector: 'app-branding-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './branding-management.component.html',
  styleUrls: ['./branding-management.component.scss']
})
export class BrandingManagementComponent implements OnInit {
  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;
  
  config: BrandingConfig | null = null;
  loading = true;
  saving = false;
  
  // Preview
  emailPreviewHtml: SafeHtml = '';
  pdfPreviewHtml: SafeHtml = '';
  showEmailPreview = false;
  showPdfPreview = false;
  
  // Logo upload
  logoUploading = false;
  dragOver = false;

  constructor(
    private brandingService: BrandingService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading = true;
    this.brandingService.getBrandingConfig().subscribe({
      next: (config) => {
        this.config = { ...config };
        this.loading = false;
        this.updatePreviews();
      },
      error: () => {
        this.snackBar.open('Erreur de chargement de la configuration', 'OK', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  // Logo Management
  triggerLogoUpload(): void {
    this.logoInput.nativeElement.click();
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadLogo(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadLogo(event.dataTransfer.files[0]);
    }
  }

  uploadLogo(file: File): void {
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Veuillez sélectionner une image (PNG, JPG, SVG)', 'OK', { duration: 3000 });
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.snackBar.open('La taille du fichier ne doit pas dépasser 2 Mo', 'OK', { duration: 3000 });
      return;
    }

    this.logoUploading = true;
    this.brandingService.uploadLogo(file).subscribe({
      next: (result) => {
        if (this.config) {
          this.config.logoUrl = result.url;
          this.config.logoFileName = file.name;
        }
        this.logoUploading = false;
        this.updatePreviews();
        this.snackBar.open('Logo téléchargé avec succès', 'OK', { duration: 2000 });
      },
      error: () => {
        this.logoUploading = false;
        this.snackBar.open('Erreur lors du téléchargement', 'OK', { duration: 3000 });
      }
    });
  }

  removeLogo(): void {
    this.brandingService.removeLogo().subscribe({
      next: () => {
        if (this.config) {
          this.config.logoUrl = undefined;
          this.config.logoFileName = undefined;
        }
        this.updatePreviews();
        this.snackBar.open('Logo supprimé', 'OK', { duration: 2000 });
      }
    });
  }

  // Color Management
  onColorChange(colorType: string, value: string): void {
    if (this.config) {
      (this.config as any)[colorType] = value;
      this.updatePreviews();
    }
  }

  // Previews
  updatePreviews(): void {
    if (this.config) {
      this.emailPreviewHtml = this.sanitizer.bypassSecurityTrustHtml(
        this.brandingService.generateEmailPreview(this.config)
      );
      this.pdfPreviewHtml = this.sanitizer.bypassSecurityTrustHtml(
        this.brandingService.generatePdfPreview(this.config)
      );
    }
  }

  toggleEmailPreview(): void {
    this.showEmailPreview = !this.showEmailPreview;
    if (this.showEmailPreview) this.showPdfPreview = false;
  }

  togglePdfPreview(): void {
    this.showPdfPreview = !this.showPdfPreview;
    if (this.showPdfPreview) this.showEmailPreview = false;
  }

  // Save Configuration
  saveConfig(): void {
    if (!this.config) return;
    
    this.saving = true;
    this.brandingService.updateBrandingConfig(this.config).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Configuration sauvegardée avec succès', 'OK', { 
          duration: 3000,
          panelClass: 'success-snackbar'
        });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Erreur lors de la sauvegarde', 'OK', { duration: 3000 });
      }
    });
  }

  resetToDefaults(): void {
    this.brandingService.resetToDefaults().subscribe({
      next: (config) => {
        this.config = { ...config };
        this.updatePreviews();
        this.snackBar.open('Configuration réinitialisée', 'OK', { duration: 2000 });
      }
    });
  }

  // Predefined color palettes
  colorPalettes = [
    { name: 'Bleu Médical', primary: '#3b82f6', secondary: '#1e40af', accent: '#10b981' },
    { name: 'Vert Santé', primary: '#10b981', secondary: '#059669', accent: '#3b82f6' },
    { name: 'Violet Royal', primary: '#8b5cf6', secondary: '#6d28d9', accent: '#f59e0b' },
    { name: 'Orange Énergie', primary: '#f59e0b', secondary: '#d97706', accent: '#3b82f6' },
    { name: 'Rose Moderne', primary: '#ec4899', secondary: '#db2777', accent: '#10b981' },
    { name: 'Cyan Tech', primary: '#06b6d4', secondary: '#0891b2', accent: '#f59e0b' }
  ];

  applyPalette(palette: { primary: string; secondary: string; accent: string }): void {
    if (this.config) {
      this.config.primaryColor = palette.primary;
      this.config.secondaryColor = palette.secondary;
      this.config.accentColor = palette.accent;
      this.config.emailPrimaryColor = palette.primary;
      this.config.pdfPrimaryColor = palette.primary;
      this.updatePreviews();
    }
  }
}
