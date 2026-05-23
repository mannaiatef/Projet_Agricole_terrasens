/**
 * Parcel Models & Interfaces
 * Type definitions for map-based parcel creation
 */

/**
 * GeoJSON Geometry types
 */
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [lon, lat]
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: [number, number][][]; // [[[lon, lat], ...]]
}

export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: [number, number][][][];
}

export type GeoJSONGeometry = GeoJSONPoint | GeoJSONPolygon | GeoJSONMultiPolygon;

/**
 * GeoJSON Feature
 */
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties?: Record<string, any>;
}

/**
 * Parcel entity
 */
export interface Parcel {
  id: number;
  user_id: number;
  name: string;
  latitude: number;
  longitude: number;
  polygon: GeoJSONPolygon | GeoJSONFeature;
  geometry?: GeoJSONFeature;
  surface: number; // in square meters
  crop_id?: number;
  sowing_date?: string; // ISO 8601
  soil_type?: string;
  irrigation_type?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Parcel geometry
 */
export interface ParcelGeometry {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Create parcel request
 */
export interface CreateParcelRequest {
  name: string;
  latitude: number;
  longitude: number;
  geometry?: GeoJSONFeature;
  polygon?: GeoJSONPolygon | GeoJSONFeature;
  surface?: number;
  crop_id?: number;
  sowing_date?: string;
  soil_type?: string;
  irrigation_type?: string;
}

/**
 * Update parcel request
 */
export interface UpdateParcelRequest {
  name?: string;
  latitude?: number;
  longitude?: number;
  geometry?: GeoJSONFeature;
  polygon?: GeoJSONPolygon | GeoJSONFeature;
  surface?: number;
  crop_id?: number;
  sowing_date?: string;
  soil_type?: string;
  irrigation_type?: string;
}

/**
 * Parcel list response
 */
export interface ParcelListResponse {
  success: boolean;
  message: string;
  data: Parcel[];
  count: number;
}

/**
 * Single parcel response
 */
export interface ParcelResponse {
  success: boolean;
  message: string;
  data: Parcel;
}

/**
 * Crop information
 */
export interface Crop {
  id: number;
  name: string;
  duration_days: number;
}

/**
 * Crop calendar information
 */
export interface CropCalendar {
  id: number;
  parcelle_id: number;
  crop_id: number;
  sowing_date: string;
  crop?: Crop;
}

/**
 * Stress zone
 */
export interface StressZone {
  id: number;
  parcelId: number;
  severity: 'low' | 'medium' | 'high';
  coordinates: [number, number];
  description: string;
}

/**
 * Water stress level
 */
export interface WaterStress {
  parcelId: number;
  stressLevel: number; // 0-100
  timestamp: string;
  location: [number, number];
}

/**
 * Parcel alert
 */
export interface ParcelAlert {
  id: number;
  parcelId: number;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
  resolved_at?: string;
}

/**
 * Parcel filter options
 */
export interface ParcelFilterOptions {
  crop_id?: number;
  soil_type?: string;
  irrigation_type?: string;
  minArea?: number;
  maxArea?: number;
  sortBy?: 'name' | 'area' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}
