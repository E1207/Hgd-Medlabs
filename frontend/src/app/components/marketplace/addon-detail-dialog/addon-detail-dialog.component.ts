import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Addon } from '../../../models/marketplace.model';
import { MarketplaceService } from '../../../services/marketplace.service';

export interface AddonDetailDialogData {
  addon: Addon;
  isSubscribed: boolean;
}

@Component({
  selector: 'app-addon-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './addon-detail-dialog.component.html',
  styleUrls: ['./addon-detail-dialog.component.scss']
})
export class AddonDetailDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddonDetailDialogData,
    private dialogRef: MatDialogRef<AddonDetailDialogComponent>,
    private marketplaceService: MarketplaceService
  ) {}

  getCategoryLabel(category: string): string {
    return this.marketplaceService.getCategoryLabel(category as any);
  }

  formatPrice(price: number): string {
    return this.marketplaceService.formatPrice(price);
  }

  getBillingLabel(): string {
    switch (this.data.addon.billingType) {
      case 'MONTHLY':
        return '/mois';
      case 'YEARLY':
        return '/an';
      case 'ONE_TIME':
        return '(paiement unique)';
      default:
        return '';
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  subscribe(): void {
    this.dialogRef.close('subscribe');
  }

  unsubscribe(): void {
    this.dialogRef.close('unsubscribe');
  }
}
