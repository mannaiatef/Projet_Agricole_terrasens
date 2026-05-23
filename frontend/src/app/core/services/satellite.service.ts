import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Satellite data point from sensor
 */
export interface SatelliteDataPoint {
  farm_id: number;
  ndvi: number;
  ndvi_status: string;
  cloudiness: number;
  lst: number;
  lst_anomaly: number;
  date: string;
}

/**
 * Historical NDVI data for trends
 */
export interface NDVIHistoryPoint {
  date: string;
  ndvi: number;
  ndvi_status: 'healthy' | 'moderate' | 'stress';
  ndvi_change: number;
}

/**
 * NDVI forecast prediction
 */
export interface NDVIForecast {
  date: string;
  predicted_ndvi: number;
  confidence: number;
  stress_alert: boolean;
}

/**
 * Satellite data summary
 */
export interface SatelliteSummary {
  farm_id: number;
  current_ndvi: number;
  status: string;
  last_update: string;
  coverage_percent: number;
  health_score: number;
  trend: string;
  next_pass: string;
}

/**
 * NDVI statistics
 */
export interface NDVIStatistics {
  farm_id: number;
  average_ndvi: number;
  min_ndvi: number;
  max_ndvi: number;
  std_dev: number;
  healthy_area_percent: number;
  stress_area_percent: number;
  period_days: number;
}

/**
 * Satellite Service
 * 
 * Handles all satellite and NDVI data operations
 * 
 * Endpoints:
 * - GET /satellite/{farm_id} - Current satellite data
 * - GET /satellite/{farm_id}/history - NDVI historical data
 * - GET /satellite/{farm_id}/forecast - NDVI forecast
 * - GET /satellite/{farm_id}/summary - Satellite data summary
 * - GET /satellite/{farm_id}/statistics - NDVI statistics
 */
@Injectable({
  providedIn: 'root'
})
export class SatelliteService {
  private endpoint = '/satellite';

  constructor(private apiService: ApiService) {}

  /**
   * Get current satellite data for a farm
   */
  getCurrentData(farmId: number): Observable<SatelliteDataPoint> {
    return this.apiService.get<SatelliteDataPoint>(`${this.endpoint}/${farmId}`);
  }

  /**
   * Get NDVI historical data (last 30 days)
   */
  getHistory(farmId: number, days?: number): Observable<NDVIHistoryPoint[]> {
    const params = days ? { days: days.toString() } : undefined;
    return this.apiService.get<NDVIHistoryPoint[]>(`${this.endpoint}/${farmId}/history`, params);
  }

  /**
   * Get NDVI forecast for next 7 days
   */
  getForecast(farmId: number): Observable<NDVIForecast[]> {
    return this.apiService.get<NDVIForecast[]>(`${this.endpoint}/${farmId}/forecast`);
  }

  /**
   * Get satellite data summary
   */
  getSummary(farmId: number): Observable<SatelliteSummary> {
    return this.apiService.get<SatelliteSummary>(`${this.endpoint}/${farmId}/summary`);
  }

  /**
   * Get NDVI statistics
   */
  getStatistics(farmId: number): Observable<NDVIStatistics> {
    return this.apiService.get<NDVIStatistics>(`${this.endpoint}/${farmId}/statistics`);
  }
}
