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

export interface OtpResponse {
  success: boolean;
  message: string;
  maskedPhone?: string;
  expiresInMinutes?: number;
  whatsappEnabled?: boolean;
  error?: string;
  downloadUrl?: string;
  accessGranted?: boolean;
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

  /**
   * Demande l'envoi d'un code OTP par WhatsApp
   */
  requestOtp(id: string): Observable<OtpResponse> {
    return this.http.post<OtpResponse>(`${this.apiUrl}/${id}/request-otp`, {});
  }

  /**
   * Vérifie le code OTP reçu par WhatsApp
   */
  verifyOtp(id: string, code: string): Observable<OtpResponse> {
    return this.http.post<OtpResponse>(`${this.apiUrl}/${id}/verify-otp`, { code });
  }

  /**
   * Renvoie un nouveau code OTP
   */
  resendOtp(id: string): Observable<OtpResponse> {
    return this.http.post<OtpResponse>(`${this.apiUrl}/${id}/resend-otp`, {});
  }

  /**
   * Méthode legacy - Vérifie le code d'accès envoyé par email
   */
  verifyAccessCode(id: string, request: VerifyAccessCodeRequest): Observable<VerifyAccessCodeResponse> {
    return this.http.post<VerifyAccessCodeResponse>(`${this.apiUrl}/${id}/verify`, request);
  }

  /**
   * Télécharge le PDF du résultat
   */
  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }
}
