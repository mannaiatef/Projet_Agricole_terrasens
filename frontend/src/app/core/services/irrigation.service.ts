import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Irrigation recommendation response
 */
export interface IrrigationRecommendation {
  farm_id: number;
  farm_name: string;
  date: string;
  et0: number;              // Reference evapotranspiration (mm/day)
  kc_base: number;          // Crop coefficient at stage
  kc_adjusted: number;      // Adjusted for stress
  etc: number;              // Crop evapotranspiration (mm/day)
  rainfall: number;         // mm
  net_irrigation_need: number; // mm/day
  unit: string;
  stage: string;            // Crop stage
  stress_level: string;     // "none" | "moderate" | "high"
  stress_score: number;     // 0-100
  recommendation: string;
}

/**
 * 7-day irrigation forecast
 */
export interface IrrigationForecast {
  date: string;
  predicted_et0: number;
  predicted_etc: number;
  rainfall_mm: number;
  net_need: number;
  confidence: number;
  recommendation: string;
}

/**
 * Soil water capacity
 */
export interface SoilWater {
  farm_id: number;
  texture: string;
  capacity_mm: number;
  current_water_mm: number;
  available_water_percent: number;
  field_capacity: number;
  wilting_point: number;
  last_update: string;
}

/**
 * Stress analysis detail
 */
export interface StressAnalysisDetail {
  farm_id: number;
  current_stress_level: string;  // "none" | "moderate" | "high"
  stress_score: number;           // 0-100
  ndvi_status: string;
  soil_moisture_percent: number;
  temperature_anomaly: number;
  wind_stress_factor: number;
  confidence: number;
  recommendation: string;
  next_irrigation_date: string;
}

/**
 * Irrigation Service
 * 
 * Handles irrigation recommendations and calculations (FAO-56 standard)
 * 
 * FAO-56 Formula:
 * ETc = ET0 × Kc
 * Where:
 * - ET0 = Reference Evapotranspiration
 * - Kc = Crop Coefficient (depends on crop stage)
 * - ETc = Crop Evapotranspiration (water requirement)
 * 
 * Endpoints:
 * - GET /irrigation/{farm_id} - Daily recommendation
 * - GET /irrigation/{farm_id}/forecast - 7-day forecast
 * - GET /irrigation/{farm_id}/soil-water - Soil water capacity
 * - GET /irrigation/{farm_id}/stress - Stress analysis
 */
@Injectable({
  providedIn: 'root'
})
export class IrrigationService {
  private endpoint = '/irrigation';

  constructor(private apiService: ApiService) {}

  /**
   * Get irrigation recommendation for today
   * Uses FAO-56 methodology with satellite data
   */
  getDailyRecommendation(farmId: number): Observable<IrrigationRecommendation> {
    return this.apiService.get<IrrigationRecommendation>(`${this.endpoint}/${farmId}`);
  }

  /**
   * Get 7-day irrigation forecast
   */
  getForecast(farmId: number): Observable<IrrigationForecast[]> {
    return this.apiService.get<IrrigationForecast[]>(`${this.endpoint}/${farmId}/forecast`);
  }

  /**
   * Get soil water capacity and current status
   */
  getSoilWater(farmId: number): Observable<SoilWater> {
    return this.apiService.get<SoilWater>(`${this.endpoint}/${farmId}/soil-water`);
  }

  /**
   * Get stress analysis with satellite integration
   */
  getStressAnalysis(farmId: number): Observable<StressAnalysisDetail> {
    return this.apiService.get<StressAnalysisDetail>(`${this.endpoint}/${farmId}/stress`);
  }
}
