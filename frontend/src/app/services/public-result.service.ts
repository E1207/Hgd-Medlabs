import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PatientResult } from '../models/patient-result.model';
import { environment } from '../../environments/environment';

export interface VerifyAccessCodeRequest {
  accessCode: string;
}

export interface VerifyAccessCodeResponse {
  valid: boolean;
  result?: PatientResult;
}

@Injectable({
  providedIn: 'root'
})
export class PublicResultService {
  private apiUrl = `${environment.apiUrl}/public/results`;

  constructor(private http: HttpClient) {}

  getResultInfo(id: string): Observable<PatientResult> {
    return this.http.get<PatientResult>(`${this.apiUrl}/${id}`);
  }

  verifyAccessCode(id: string, request: VerifyAccessCodeRequest): Observable<VerifyAccessCodeResponse> {
    return this.http.post<VerifyAccessCodeResponse>(`${this.apiUrl}/${id}/verify`, request);
  }

  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }
}
