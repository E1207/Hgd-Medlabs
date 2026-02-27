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
  weeklyStats?: DailyStats[];
  // Navigation de période
  weekOffset?: number;      // 0 = semaine actuelle, 1 = semaine précédente
  periodStart?: string;     // Date de début (YYYY-MM-DD)
  periodEnd?: string;       // Date de fin (YYYY-MM-DD)
}

export interface DailyStats {
  date: string;           // Format: YYYY-MM-DD
  dayLabel: string;       // Ex: "Lun 10"
  importedCount: number;  // Nombre de résultats importés ce jour
  sentCount: number;      // Nombre de résultats envoyés ce jour
  openRate: number;       // Taux d'ouverture ce jour
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
