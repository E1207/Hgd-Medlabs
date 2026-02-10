export enum UserRole {
  ADMIN = 'ADMIN',
  TECHNICIEN = 'TECHNICIEN'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
