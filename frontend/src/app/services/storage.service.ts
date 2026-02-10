import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StorageStats {
  uploadsDirPath: string;
  uploadsDirSizeMB: number;
  watchDirPath: string;
  watchDirSizeMB: number;
  archiveDirPath: string;
  archiveDirSizeMB: number;
  totalUsedMB: number;
  freeSpaceGB: number;
  totalSpaceGB: number;
  usagePercentage: number;
  totalFiles: number;
  alertLevel: 'OK' | 'WARNING' | 'CRITICAL';
  alertMessage: string;
}

export interface IntegrityCheckResult {
  success: boolean;
  totalFiles: number;
  corruptedFiles: string[];
  emptyFiles: string[];
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private apiUrl = `${environment.apiUrl}/storage`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les statistiques de stockage
   */
  getStorageStats(): Observable<StorageStats> {
    return this.http.get<StorageStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Vérifie l'intégrité des fichiers stockés
   */
  checkIntegrity(): Observable<IntegrityCheckResult> {
    return this.http.get<IntegrityCheckResult>(`${this.apiUrl}/integrity-check`);
  }

  /**
   * Crée une sauvegarde manuelle
   */
  createBackup(): Observable<{ status: string; message: string; backupPath?: string }> {
    return this.http.post<{ status: string; message: string; backupPath?: string }>(`${this.apiUrl}/backup`, {});
  }

  /**
   * Déclenche l'archivage des anciens fichiers
   */
  triggerArchive(): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(`${this.apiUrl}/archive`, {});
  }
}
