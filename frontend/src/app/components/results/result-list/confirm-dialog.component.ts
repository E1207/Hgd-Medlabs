import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-icon" [ngClass]="data.type || 'warning'">
        <mat-icon>{{ getIcon() }}</mat-icon>
      </div>
      
      <h2 class="dialog-title">{{ data.title }}</h2>
      <p class="dialog-message">{{ data.message }}</p>
      
      <div class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn">
          {{ data.cancelText || 'Annuler' }}
        </button>
        <button mat-flat-button [color]="getButtonColor()" (click)="onConfirm()" class="confirm-btn">
          <mat-icon>{{ getConfirmIcon() }}</mat-icon>
          {{ data.confirmText || 'Confirmer' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 24px;
      text-align: center;
      max-width: 400px;
    }

    .dialog-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      &.danger {
        background: #fef2f2;
        color: #dc2626;
      }

      &.warning {
        background: #fffbeb;
        color: #d97706;
      }

      &.info {
        background: #eff6ff;
        color: #2563eb;
      }
    }

    .dialog-title {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
    }

    .dialog-message {
      margin: 0 0 24px;
      color: #64748b;
      font-size: 14px;
      line-height: 1.5;
    }

    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: center;

      button {
        min-width: 120px;
        height: 44px;
        border-radius: 10px;
        font-weight: 500;
      }

      .cancel-btn {
        border-color: #e2e8f0;
        color: #64748b;

        &:hover {
          background: #f8fafc;
        }
      }

      .confirm-btn {
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-right: 6px;
        }
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  getIcon(): string {
    switch (this.data.type) {
      case 'danger': return 'delete_forever';
      case 'info': return 'info';
      default: return 'warning';
    }
  }

  getConfirmIcon(): string {
    switch (this.data.type) {
      case 'danger': return 'delete';
      default: return 'check';
    }
  }

  getButtonColor(): string {
    switch (this.data.type) {
      case 'danger': return 'warn';
      case 'info': return 'primary';
      default: return 'warn';
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
