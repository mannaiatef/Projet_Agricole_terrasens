import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Field {
  id: number;
  field_code: string;
  name: string;
  crop_type: string;
  area: number;
  latitude: number;
  longitude: number;
  soil_type?: string;
  soil_moisture_current?: number;
  soil_moisture_status?: string;
  water_stress_level?: string;
  irrigation_status?: string;
  irrigation_scheduled_time?: string;
  last_irrigation_date?: string;
  stage?: string;
  recommended_action?: string;
  data_freshness?: string;
  last_updated?: string;
  created_at?: string;
  
  irrigation?: {
    et0: number;
    kc: number;
    etc: number;
  };
  
  satellite?: {
    ndvi: number;
    lst: number;
    cloud_coverage: number;
    processing_date: string;
  };
  
  ndvi_trend?: {
    current: number;
    previous?: number;
    trend: string;
    historical_observations: string;
  };
  
  stress?: {
    water_stress_level: string;
    water_stress_score: number;
    detection_method: string;
    confidence: number;
    thermal_stress_level: string;
    recommended_action: string;
  };
  
  alerts?: string[];
}

export interface CreateFieldRequest {
  field_code: string;
  name: string;
  crop_type: string;
  area: number;
  latitude: number;
  longitude: number;
  soil_type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FieldService {
  private apiUrl = 'http://localhost:3000/api/fields';

  constructor(private http: HttpClient) {}

  /**
   * Get all fields
   */
  getFields(): Observable<{ success: boolean; data: Field[] }> {
    return this.http.get<{ success: boolean; data: Field[] }>(this.apiUrl);
  }

  /**
   * Get a single field by ID
   */
  getFieldById(id: number): Observable<{ success: boolean; data: Field }> {
    return this.http.get<{ success: boolean; data: Field }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new field
   */
  createField(request: CreateFieldRequest): Observable<{
    success: boolean;
    message: string;
    data: Field;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: Field;
    }>(this.apiUrl, request);
  }

  /**
   * Update a field
   */
  updateField(id: number, request: Partial<CreateFieldRequest>): Observable<{
    success: boolean;
    message: string;
    data: Field;
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      data: Field;
    }>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Delete a field
   */
  deleteField(id: number): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<{
      success: boolean;
      message: string;
    }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Sync field with satellite and weather data
   */
  syncField(id: number): Observable<{
    success: boolean;
    message: string;
    data: Field;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: Field;
    }>(`${this.apiUrl}/${id}/sync`, {});
  }

  /**
   * Sync all fields
   */
  syncAllFields(): Observable<{
    success: boolean;
    message: string;
    data: Field[];
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: Field[];
    }>(`${this.apiUrl}/sync-all`, {});
  }

  /**
   * Trigger irrigation for a field
   */
  irrigateField(id: number): Observable<{
    success: boolean;
    message: string;
    data: Field;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: Field;
    }>(`${this.apiUrl}/${id}/irrigate`, {});
  }
}
