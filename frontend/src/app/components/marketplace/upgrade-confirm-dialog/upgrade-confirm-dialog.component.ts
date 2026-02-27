import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ServicePack } from '../../../models/marketplace.model';
import { MarketplaceService } from '../../../services/marketplace.service';

export interface UpgradeConfirmDialogData {
  pack: ServicePack;
  currentPack: ServicePack | null;
}

@Component({
  selector: 'app-upgrade-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './upgrade-confirm-dialog.component.html',
  styleUrls: ['./upgrade-confirm-dialog.component.scss']
})
export class UpgradeConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UpgradeConfirmDialogData,
    private dialogRef: MatDialogRef<UpgradeConfirmDialogComponent>,
    private marketplaceService: MarketplaceService
  ) {}

  formatPrice(price: number): string {
    return this.marketplaceService.formatPrice(price);
  }

  getPriceDifference(): number {
    return this.data.pack.price - (this.data.currentPack?.price || 0);
  }

  getNewFeatures(): { name: string; included: boolean }[] {
    if (!this.data.currentPack) return this.data.pack.features;
    
    const currentFeatures = new Set(
      this.data.currentPack.features
        .filter(f => f.included)
        .map(f => f.name)
    );
    
    return this.data.pack.features.filter(
      f => f.included && !currentFeatures.has(f.name)
    );
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
