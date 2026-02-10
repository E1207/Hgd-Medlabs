import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSetting } from '../models/patient-result.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  getAllSettings(): Observable<AppSetting[]> {
    return this.http.get<AppSetting[]>(this.apiUrl);
  }

  getSetting(key: string): Observable<AppSetting> {
    return this.http.get<AppSetting>(`${this.apiUrl}/${key}`);
  }

  updateSetting(key: string, value: string, description?: string): Observable<AppSetting> {
    return this.http.put<AppSetting>(`${this.apiUrl}/${key}`, { value, description });
  }

  createSetting(key: string, value: string, description?: string): Observable<AppSetting> {
    return this.http.post<AppSetting>(this.apiUrl, { key, value, description });
  }
}
