import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interface for Parcelle
 */
export interface Parcelle {
  id: number;
  user_id: number;
  name: string;
  location: string;
  surface: number;
  crop_id?: number;
  sowing_date?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface for create/update Parcelle
 */
export interface CreateParcelleRequest {
  name: string;
  location: string;
  surface: number;
}

/**
 * Interface for assign crop request
 */
export interface AssignCropRequest {
  crop_id: number;
  sowing_date: string;
}

/**
 * Parcelle Service
 * Handles communication with parcelle endpoints
 */
@Injectable({
  providedIn: 'root',
})
export class ParcelleService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Get all parcelles for the authenticated user
   */
  getParcelles(): Observable<{ success: boolean; data: Parcelle[] }> {
    return this.http.get<{ success: boolean; data: Parcelle[] }>(
      `${this.apiUrl}/parcelles`
    );
  }

  /**
   * Get a single parcelle by ID
   */
  getParcelleById(id: number): Observable<{ success: boolean; data: Parcelle }> {
    return this.http.get<{ success: boolean; data: Parcelle }>(
      `${this.apiUrl}/parcelles/${id}`
    );
  }

  /**
   * Create a new parcelle
   */
  createParcelle(request: CreateParcelleRequest): Observable<{
    success: boolean;
    message: string;
    data: Parcelle;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: Parcelle;
    }>(`${this.apiUrl}/parcelles`, request);
  }

  /**
   * Update a parcelle
   */
  updateParcelle(id: number, request: Partial<CreateParcelleRequest>): Observable<{
    success: boolean;
    message: string;
    data: Parcelle;
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      data: Parcelle;
    }>(`${this.apiUrl}/parcelles/${id}`, request);
  }

  /**
   * Assign a crop to a parcelle
   */
  assignCrop(id: number, request: AssignCropRequest): Observable<{
    success: boolean;
    message: string;
    data: Parcelle;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: Parcelle;
    }>(`${this.apiUrl}/parcelles/${id}/assign-crop`, request);
  }

  /**
   * Delete a parcelle
   */
  deleteParcelle(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/parcelles/${id}`
    );
  }
}
