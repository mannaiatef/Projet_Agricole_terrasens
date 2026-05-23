/**
 * Irrigation Models and Interfaces
 */

export interface Parcel {
  id: number;
  name: string;
  area: number;
  crop_type?: string;
  soil_type?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface IrrigationRecommendation {
  id: number;
  parcel_id: number;
  timestamp: Date;
  recommendation_text: string;
  decision_reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  irrigation_amount: number; // in mm
  current_soil_moisture: number; // percentage
  average_stress: number; // percentage
  temperature: number; // in Celsius
  humidity: number; // percentage
  wind_speed: number; // in m/s
  solar_radiation: number; // in W/m²
  et0?: number; // Reference evapotranspiration
  kc?: number; // Crop coefficient
  etc?: number; // Crop evapotranspiration
  analysis?: string;
}

export interface WeatherData {
  timestamp: Date;
  temperature: number;
  humidity: number;
  wind_speed: number;
  solar_radiation: number;
  precipitation?: number;
  cloudiness?: number;
}

export interface FieldStressData {
  parcel_id: number;
  timestamp: Date;
  ndvi?: number; // Normalized Difference Vegetation Index
  soil_moisture: number;
  temperature: number;
  water_stress_index?: number;
}

export interface IrrigationSchedule {
  id: number;
  parcel_id: number;
  scheduled_date: Date;
  scheduled_time: string;
  amount: number; // mm
  duration: number; // minutes
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  method: 'automatic' | 'manual' | 'scheduled';
}

export interface IrrigationHistory {
  id: number;
  parcel_id: number;
  date: Date;
  amount: number; // mm
  duration: number; // minutes
  method: 'automatic' | 'manual' | 'scheduled';
  weather_condition?: string;
  notes?: string;
  soil_moisture_before?: number;
  soil_moisture_after?: number;
}

export interface CropCoefficients {
  crop_type: string;
  growth_stage: string;
  kc_value: number;
  description?: string;
}

export interface SoilCharacteristics {
  parcel_id: number;
  soil_type: string;
  field_capacity: number; // percentage
  wilting_point: number; // percentage
  available_water: number; // mm/m
  infiltration_rate: number; // mm/hr
}

export interface AlertSettings {
  parcel_id: number;
  high_stress_threshold: number; // percentage
  low_moisture_threshold: number; // percentage
  high_temp_threshold: number; // Celsius
  enable_notifications: boolean;
  notification_channels: 'email' | 'sms' | 'push'[];
}

export interface CalculationInput {
  parcel_id: number;
  soil_moisture: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  solar_radiation: number;
  crop_type: string;
  growth_stage?: string;
  et0?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
