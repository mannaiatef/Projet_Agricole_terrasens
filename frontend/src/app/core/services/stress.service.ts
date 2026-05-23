import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Map data point for stress visualization
 */
export interface MapDataPoint {
  latitude: number;
  longitude: number;
  stress_level: number;     // 0 = healthy, 1 = moderate, 2 = high
  stress_label: string;
  ndvi: number;
  color: string;            // Hex color for map visualization
  popup: string;            // Info popup text
  field_id?: number;
  timestamp?: string;
}

/**
 * Stress analysis response
 */
export interface StressAnalysisResponse {
  parcel_id: number;
  farm_id: number;
  field_name: string;
  analysis_date: string;
  weather: WeatherSnapshot;
  soil: SoilContext;
  satellite: SatelliteSnapshot;
  crop: CropContext;
  ml_prediction: StressPrediction;
  forecast: Forecast[];
  recommendations: string[];
}

export interface WeatherSnapshot {
  tmax: number;
  tmin: number;
  humidity: number;
  wind_speed: number;
  rainfall: number;
  solar_radiation: number;
}

export interface SoilContext {
  texture: string;
  capacite_retention: number;
  profondeur_enracinement: number;
  matiere_organique: number;
}

export interface SatelliteSnapshot {
  ndvi: number;
  ndvi_status: string;
  lst: number;
  lst_anomaly: number;
}

export interface CropContext {
  culture: string;
  variete: string;
  stade_phenologique: string;
  jours_depuis_semis: number;
  jours_restants: number;
}

export interface StressPrediction {
  stress_level: number;
  stress_label: string;
  confidence: number;
  recommendation_priority: string;
}

export interface Forecast {
  date: string;
  predicted_stress_level: number;
  stress_label: string;
  confidence: number;
  rainfall_mm: number;
  temp_max: number;
  recommendation: string;
}

/**
 * Stress Service
 * 
 * Comprehensive stress analysis combining:
 * - Machine Learning predictions
 * - Weather data
 * - Soil properties
 * - Satellite NDVI
 * - Crop phenology
 * 
 * Endpoints:
 * - GET /stress/{parcel_id} - Current stress analysis
 * - GET /stress/{parcel_id}/history - Historical stress data
 * - GET /stress/farm/{farm_id}/map - Map data for visualization
 * - POST /stress/batch - Analyze multiple parcels
 */
@Injectable({
  providedIn: 'root'
})
export class StressService {
  private endpoint = '/stress';

  constructor(private apiService: ApiService) {}

  /**
   * Get map data for stress visualization on Leaflet
   * Returns array of points with coordinates and stress info
   * 
   * IMPORTANT: This endpoint is called by stress-map.component.ts
   * Must return JSON (not HTML)
   */
  getMapData(farmId: number): Observable<MapDataPoint[]> {
    return this.apiService.get<MapDataPoint[]>(`${this.endpoint}/farm/${farmId}/map`);
  }

  /**
   * Get detailed stress analysis for a specific parcel
   */
  getStressAnalysis(parcelId: number): Observable<StressAnalysisResponse> {
    return this.apiService.get<StressAnalysisResponse>(`${this.endpoint}/${parcelId}`);
  }

  /**
   * Get stress history for a parcel (last 30 days)
   */
  getStressHistory(parcelId: number, days?: number): Observable<any[]> {
    const params = days ? { days: days.toString() } : undefined;
    return this.apiService.get<any[]>(`${this.endpoint}/${parcelId}/history`, params);
  }

  /**
   * Batch analyze multiple parcels
   */
  batchAnalysis(parcelIds: number[]): Observable<StressAnalysisResponse[]> {
    return this.apiService.post<StressAnalysisResponse[]>(`${this.endpoint}/batch`, {
      parcel_ids: parcelIds
    });
  }
}
