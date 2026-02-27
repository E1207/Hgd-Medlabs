import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PatientResult, PatientResultRequest, DashboardStats, PdfMetadata } from '../models/patient-result.model';
import { environment } from '../../environments/environment';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class PatientResultService {
  private apiUrl = `${environment.apiUrl}/results`;

  constructor(private http: HttpClient) {}

  uploadResult(file: File, data: PatientResultRequest): Observable<PatientResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    
    return this.http.post<PatientResult>(`${this.apiUrl}/upload`, formData);
  }

  completeResult(id: string, data: PatientResultRequest): Observable<PatientResult> {
    return this.http.put<PatientResult>(`${this.apiUrl}/${id}/complete`, data);
  }

  sendResult(id: string): Observable<PatientResult> {
    return this.http.post<PatientResult>(`${this.apiUrl}/${id}/send`, {});
  }

  getAllResults(
    status?: string,
    startDate?: string,
    endDate?: string,
    search?: string,
    page: number = 0,
    size: number = 10
  ): Observable<PageResponse<PatientResult>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (search) params = params.set('search', search);

    return this.http.get<PageResponse<PatientResult>>(this.apiUrl, { params });
  }

  getResultById(id: string): Observable<PatientResult> {
    return this.http.get<PatientResult>(`${this.apiUrl}/${id}`);
  }

  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  deleteResult(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  extractMetadata(file: File): Observable<PdfMetadata> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PdfMetadata>(`${this.apiUrl}/extract-metadata`, formData);
  }

  getDashboardStats(weekOffset: number = 0): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${environment.apiUrl}/dashboard/stats`, {
      params: { weekOffset: weekOffset.toString() }
    });
  }

  getRecentResults(limit: number = 10): Observable<PatientResult[]> {
    return this.http.get<PatientResult[]>(`${environment.apiUrl}/dashboard/recent-results`, {
      params: { limit: limit.toString() }
    });
  }
}
