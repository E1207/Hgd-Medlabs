import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName: string;
  ipAddress: string;
  userAgent: string;
  details: string;
  success: boolean;
}

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'CREATE' 
  | 'READ' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'SEND' 
  | 'DOWNLOAD' 
  | 'EXPORT'
  | 'IMPORT';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    FormsModule
  ],
  templateUrl: './audit-trail.component.html',
  styleUrls: ['./audit-trail.component.scss']
})
export class AuditTrailComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = true;
  displayedColumns = ['timestamp', 'user', 'action', 'entity', 'ipAddress', 'success', 'details'];
  dataSource = new MatTableDataSource<AuditLog>();
  
  // Filtres
  searchQuery = '';
  selectedAction: AuditAction | '' = '';
  selectedEntityType = '';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;

  actions: { value: AuditAction; label: string; icon: string; color: string }[] = [
    { value: 'LOGIN', label: 'Connexion', icon: 'login', color: '#10b981' },
    { value: 'LOGOUT', label: 'Déconnexion', icon: 'logout', color: '#64748b' },
    { value: 'CREATE', label: 'Création', icon: 'add_circle', color: '#3b82f6' },
    { value: 'READ', label: 'Lecture', icon: 'visibility', color: '#06b6d4' },
    { value: 'UPDATE', label: 'Modification', icon: 'edit', color: '#f59e0b' },
    { value: 'DELETE', label: 'Suppression', icon: 'delete', color: '#ef4444' },
    { value: 'SEND', label: 'Envoi', icon: 'send', color: '#8b5cf6' },
    { value: 'DOWNLOAD', label: 'Téléchargement', icon: 'download', color: '#0ea5e9' },
    { value: 'EXPORT', label: 'Export', icon: 'file_download', color: '#14b8a6' },
    { value: 'IMPORT', label: 'Import', icon: 'file_upload', color: '#6366f1' }
  ];

  entityTypes = ['Résultat', 'Utilisateur', 'Paramètre', 'Session'];

  // Mock data
  mockLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: new Date('2026-02-17T09:30:00'),
      userId: 'admin-001',
      userName: 'Admin MedLab',
      userRole: 'ADMIN',
      action: 'LOGIN',
      entityType: 'Session',
      entityId: 'sess-001',
      entityName: 'Session Admin',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 120 / macOS',
      details: 'Connexion réussie',
      success: true
    },
    {
      id: '2',
      timestamp: new Date('2026-02-17T09:35:00'),
      userId: 'admin-001',
      userName: 'Admin MedLab',
      userRole: 'ADMIN',
      action: 'CREATE',
      entityType: 'Résultat',
      entityId: 'res-123',
      entityName: 'LAB-2026-0045',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 120 / macOS',
      details: 'Import manuel d\'un résultat PDF',
      success: true
    },
    {
      id: '3',
      timestamp: new Date('2026-02-17T09:40:00'),
      userId: 'admin-001',
      userName: 'Admin MedLab',
      userRole: 'ADMIN',
      action: 'UPDATE',
      entityType: 'Résultat',
      entityId: 'res-123',
      entityName: 'LAB-2026-0045',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 120 / macOS',
      details: 'Complétion avec email: patient@email.com',
      success: true
    },
    {
      id: '4',
      timestamp: new Date('2026-02-17T09:45:00'),
      userId: 'admin-001',
      userName: 'Admin MedLab',
      userRole: 'ADMIN',
      action: 'SEND',
      entityType: 'Résultat',
      entityId: 'res-123',
      entityName: 'LAB-2026-0045',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 120 / macOS',
      details: 'Envoi par email à patient@email.com',
      success: true
    },
    {
      id: '5',
      timestamp: new Date('2026-02-17T10:00:00'),
      userId: 'tech-002',
      userName: 'Technicien Jean',
      userRole: 'TECHNICIAN',
      action: 'LOGIN',
      entityType: 'Session',
      entityId: 'sess-002',
      entityName: 'Session Technicien',
      ipAddress: '192.168.1.105',
      userAgent: 'Firefox 115 / Windows',
      details: 'Connexion réussie',
      success: true
    },
    {
      id: '6',
      timestamp: new Date('2026-02-17T10:15:00'),
      userId: 'tech-002',
      userName: 'Technicien Jean',
      userRole: 'TECHNICIAN',
      action: 'IMPORT',
      entityType: 'Résultat',
      entityId: 'res-124',
      entityName: 'LAB-2026-0046',
      ipAddress: '192.168.1.105',
      userAgent: 'Firefox 115 / Windows',
      details: 'Import automatique depuis scanner',
      success: true
    },
    {
      id: '7',
      timestamp: new Date('2026-02-17T10:30:00'),
      userId: 'admin-001',
      userName: 'Admin MedLab',
      userRole: 'ADMIN',
      action: 'EXPORT',
      entityType: 'Résultat',
      entityId: 'batch-001',
      entityName: 'Export Excel',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 120 / macOS',
      details: 'Export de 150 résultats en Excel',
      success: true
    },
    {
      id: '8',
      timestamp: new Date('2026-02-17T11:00:00'),
      userId: 'admin-001',
      userName: 'Admin MedLab',
      userRole: 'ADMIN',
      action: 'DELETE',
      entityType: 'Résultat',
      entityId: 'res-099',
      entityName: 'LAB-2025-0099',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 120 / macOS',
      details: 'Suppression d\'un résultat erroné',
      success: true
    },
    {
      id: '9',
      timestamp: new Date('2026-02-17T11:30:00'),
      userId: 'unknown',
      userName: 'Utilisateur inconnu',
      userRole: '-',
      action: 'LOGIN',
      entityType: 'Session',
      entityId: 'sess-fail',
      entityName: 'Tentative échouée',
      ipAddress: '203.45.67.89',
      userAgent: 'Unknown',
      details: 'Tentative de connexion avec mot de passe incorrect',
      success: false
    },
    {
      id: '10',
      timestamp: new Date('2026-02-17T12:00:00'),
      userId: 'admin-001',
      userName: 'Admin MedLab',
      userRole: 'ADMIN',
      action: 'UPDATE',
      entityType: 'Paramètre',
      entityId: 'setting-001',
      entityName: 'Délai rappel',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 120 / macOS',
      details: 'Modification délai rappel: 24h → 48h',
      success: true
    }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadLogs();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadLogs(): void {
    this.loading = true;
    
    // Simuler un appel API
    setTimeout(() => {
      this.dataSource.data = this.mockLogs.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
      this.loading = false;
    }, 500);
  }

  applyFilter(): void {
    let filtered = this.mockLogs;

    // Filtre par recherche
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.userName.toLowerCase().includes(query) ||
        log.entityName.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        log.ipAddress.includes(query)
      );
    }

    // Filtre par action
    if (this.selectedAction) {
      filtered = filtered.filter(log => log.action === this.selectedAction);
    }

    // Filtre par type d'entité
    if (this.selectedEntityType) {
      filtered = filtered.filter(log => log.entityType === this.selectedEntityType);
    }

    // Filtre par date
    if (this.dateFrom) {
      filtered = filtered.filter(log => log.timestamp >= this.dateFrom!);
    }
    if (this.dateTo) {
      const endOfDay = new Date(this.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => log.timestamp <= endOfDay);
    }

    this.dataSource.data = filtered;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedAction = '';
    this.selectedEntityType = '';
    this.dateFrom = null;
    this.dateTo = null;
    this.loadLogs();
  }

  getActionInfo(action: AuditAction): { label: string; icon: string; color: string } {
    return this.actions.find(a => a.value === action) || 
           { label: action, icon: 'help', color: '#64748b' };
  }

  exportLogs(): void {
    console.log('Export logs');
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      'ADMIN': '#ef4444',
      'TECHNICIAN': '#3b82f6',
      'USER': '#64748b'
    };
    return colors[role] || '#64748b';
  }
}
