export enum ResultStatus {
  IMPORTED = 'IMPORTED',
  COMPLETED = 'COMPLETED',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  OPENED = 'OPENED'
}

export enum ImportMethod {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO'
}

export interface PatientResult {
  id: string;
  referenceDossier: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientBirthdate?: Date;
  patientEmail?: string;
  patientPhone?: string;
  pdfFileName: string;
  status: ResultStatus;
  importMethod: ImportMethod;
  importedAt: Date;
  sentAt?: Date;
  openedAt?: Date;
  importedByName?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PatientResultRequest {
  referenceDossier: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientBirthdate?: string;
  patientEmail?: string;
  patientPhone: string;
}

export interface DashboardStats {
  totalResults: number;
  resultsSentToday: number;
  resultsAwaitingCompletion: number;
  openRate: number;
  statusDistribution: { [key: string]: number };
}

export interface PdfMetadata {
  referenceDossier?: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  email?: string;
  phone?: string;
}

export interface AppSetting {
  settingKey: string;
  settingValue: string;
  description?: string;
  updatedAt?: string;
}
