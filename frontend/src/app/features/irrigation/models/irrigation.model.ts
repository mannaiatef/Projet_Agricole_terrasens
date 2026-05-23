/**
 * Irrigation Data Models
 */

export interface IrrigationRecommendation {
  parcel_id: number;
  parcel_name: string;
  crop_name: string;
  area_hectares: number;
  water_amount_mm: number;
  water_volume_m3: number;
  duration_minutes: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  recommended_time: string; // HH:MM format
  calculations: IrrigationCalculations;
  conditions: IrrigationConditions;
  location: IrrigationLocation;
  decision_reason: string;
}

export interface IrrigationCalculations {
  et0: number; // Reference evapotranspiration
  kc: number; // Crop coefficient
  etc: number; // Crop water requirement
  base_water_amount: number;
  stress_adjustment: number; // 0.7-1.3x
  humidity_adjustment: number;
}

export interface IrrigationConditions {
  stress_percentage: number; // 0-100%
  stress_score: number; // 0-100
  ndvi: number; // -1 to 1
  temperature: number; // °C
  humidity: number; // 0-100%
  rain_forecast_24h: number; // mm
  weather_description: string;
}

export interface IrrigationLocation {
  latitude: number;
  longitude: number;
  polygon: any; // GeoJSON
}

export interface IrrigationRecord {
  id: number;
  parcel_id: number;
  water_amount: number; // mm
  duration: number; // minutes
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  recommended_time: Date;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  created_at: Date;
  updated_at: Date;
}

export interface IrrigationSchedule {
  id: number;
  parcel_id: number;
  scheduled_time: Date;
  status: 'PENDING' | 'EXECUTED' | 'SKIPPED' | 'CANCELLED';
  water_amount: number;
  duration: number;
  reason?: string;
  created_at: Date;
}

export interface CreateScheduleRequest {
  parcel_id: number;
  scheduled_time: Date | string;
  water_amount: number;
  duration: number;
  reason?: string;
}

export interface IrrigationAlert {
  id: number;
  parcel_id: number;
  alert_type: 'HIGH_STRESS' | 'LOW_NDVI' | 'EXTREME_WEATHER';
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  created_at: Date;
}

export interface IrrigationResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PriorityConfig {
  color: string;
  icon: string;
  label: string;
  urgency: number;
}

export const PRIORITY_CONFIG: Record<PriorityLevel, PriorityConfig> = {
  LOW: {
    color: '#4caf50',
    icon: 'check_circle',
    label: 'Low Priority',
    urgency: 1,
  },
  MEDIUM: {
    color: '#ff9800',
    icon: 'warning',
    label: 'Medium Priority',
    urgency: 2,
  },
  HIGH: {
    color: '#f44336',
    icon: 'error',
    label: 'High Priority',
    urgency: 3,
  },
};
