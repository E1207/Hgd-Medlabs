import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MarketplaceService } from '../../services/marketplace.service';
import { 
  ServicePack, 
  Addon, 
  Subscription, 
  MarketplaceStats, 
  AddonCategory 
} from '../../models/marketplace.model';
import { AddonDetailDialogComponent } from './addon-detail-dialog/addon-detail-dialog.component';
import { UpgradeConfirmDialogComponent } from './upgrade-confirm-dialog/upgrade-confirm-dialog.component';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.scss']
})
export class MarketplaceComponent implements OnInit {
  serviceId = 'medlabs';
  packs: ServicePack[] = [];
  addons: Addon[] = [];
  filteredAddons: Addon[] = [];
  subscription: Subscription | null = null;
  stats: MarketplaceStats | null = null;
  
  categories: AddonCategory[] = [];
  selectedCategory: AddonCategory | 'ALL' = 'ALL';
  
  loading = true;

  constructor(
    private marketplaceService: MarketplaceService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.categories = this.marketplaceService.getAddonCategories();
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    // Load packs
    this.marketplaceService.getPacks(this.serviceId).subscribe(packs => {
      this.packs = packs;
    });

    // Load addons
    this.marketplaceService.getAddons(this.serviceId).subscribe(addons => {
      this.addons = addons;
      this.filterAddons();
    });

    // Load subscription
    this.marketplaceService.getCurrentSubscription().subscribe(sub => {
      this.subscription = sub;
    });

    // Load stats
    this.marketplaceService.getMarketplaceStats().subscribe(stats => {
      this.stats = stats;
      this.loading = false;
    });
  }

  filterAddons(): void {
    if (this.selectedCategory === 'ALL') {
      this.filteredAddons = this.addons;
    } else {
      this.filteredAddons = this.addons.filter(a => a.category === this.selectedCategory);
    }
  }

  selectCategory(category: AddonCategory | 'ALL'): void {
    this.selectedCategory = category;
    this.filterAddons();
  }

  getCategoryLabel(category: AddonCategory): string {
    return this.marketplaceService.getCategoryLabel(category);
  }

  getCategoryIcon(category: AddonCategory): string {
    return this.marketplaceService.getCategoryIcon(category);
  }

  formatPrice(price: number): string {
    return this.marketplaceService.formatPrice(price);
  }

  isCurrentPack(packId: string): boolean {
    return this.subscription?.packId === packId;
  }

  isAddonSubscribed(addonId: string): boolean {
    return this.marketplaceService.isAddonSubscribed(addonId);
  }

  canUpgradeTo(pack: ServicePack): boolean {
    const currentPack = this.packs.find(p => p.id === this.subscription?.packId);
    if (!currentPack) return true;
    
    const tierOrder = { 'STARTER': 0, 'PROFESSIONAL': 1, 'ENTERPRISE': 2 };
    return tierOrder[pack.tier] > tierOrder[currentPack.tier];
  }

  upgradePack(pack: ServicePack): void {
    const dialogRef = this.dialog.open(UpgradeConfirmDialogComponent, {
      width: '500px',
      data: { pack, currentPack: this.stats?.currentPack }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.marketplaceService.upgradePack(pack.id).subscribe(sub => {
          this.subscription = sub;
          this.loadData();
          this.snackBar.open(`Félicitations ! Vous êtes maintenant sur le pack ${pack.name}`, 'OK', {
            duration: 5000,
            panelClass: 'success-snackbar'
          });
        });
      }
    });
  }

  openAddonDetails(addon: Addon): void {
    const dialogRef = this.dialog.open(AddonDetailDialogComponent, {
      width: '600px',
      data: { addon, isSubscribed: this.isAddonSubscribed(addon.id) }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'subscribe') {
        this.subscribeToAddon(addon);
      } else if (result === 'unsubscribe') {
        this.unsubscribeFromAddon(addon);
      }
    });
  }

  subscribeToAddon(addon: Addon): void {
    this.marketplaceService.subscribeToAddon(addon.id).subscribe(sub => {
      this.subscription = sub;
      this.loadData();
      this.snackBar.open(`${addon.name} a été ajouté à votre abonnement`, 'OK', {
        duration: 3000,
        panelClass: 'success-snackbar'
      });
    });
  }

  unsubscribeFromAddon(addon: Addon): void {
    this.marketplaceService.unsubscribeFromAddon(addon.id).subscribe(sub => {
      this.subscription = sub;
      this.loadData();
      this.snackBar.open(`${addon.name} a été retiré de votre abonnement`, 'OK', {
        duration: 3000
      });
    });
  }

  getUsagePercentage(used: number, limit: number): number {
    if (limit <= 0) return 0;
    return Math.min(100, (used / limit) * 100);
  }

  getUsageColor(percentage: number): string {
    if (percentage >= 90) return 'warn';
    if (percentage >= 70) return 'accent';
    return 'primary';
  }

  getAddonsCountByCategory(category: AddonCategory): number {
    return this.addons.filter(a => a.category === category).length;
  }
}
