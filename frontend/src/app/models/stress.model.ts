/**
 * Stress Analysis Models
 */

// GeoJSON type definitions
export type GeoJSONPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

/**
 * Parcel/Parcelle Model
 * Represents a farm parcel with geospatial data
 */
export interface Parcel {
  id: number;
  user_id: number;
  name: string;
  latitude: number;
  longitude: number;
  polygon: GeoJSONPolygon;
  surface?: number;
  lang?: string;
  crop_id?: number;
  sowing_date?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Parcel GeoJSON Feature
 * Used for map display and geospatial operations
 */
export interface ParcelGeometry {
  type: 'Feature';
  properties: {
    parcelId: number;
    name: string;
    cropType?: string;
    area?: number;
  };
  geometry: GeoJSONPolygon;
}

/**
 * Parcel creation/update request
 */
export interface CreateParcelRequest {
  name: string;
  latitude: number;
  longitude: number;
  polygon: GeoJSONPolygon;
  surface?: number;
  lang?: string;
  crop_id?: number;
  sowing_date?: string;
}

export interface StressRecord {
  id: number;
  parcel_id: number;
  mean_ndvi: number;
  stress_percentage: number;
  pixel_count: number;
  stressed_pixel_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imagery_date: string;
  cloud_coverage: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface StressZone {
  id: number;
  record_id: number;
  geojson: GeoJSONPolygon;
  stress_level: 'high' | 'medium' | 'healthy';
  zone_area: number;
  pixel_count: number;
  mean_ndvi_in_zone: number;
  created_at: string;
}

export interface StressAnalysis {
  record: StressRecord;
  zones: StressZone[];
  summary: ZoneSummary[];
}

export interface ZoneSummary {
  stress_level: 'high' | 'medium' | 'healthy';
  zone_count: number;
  total_area: number;
  total_pixels: number;
  avg_ndvi: number;
}

export interface StressAlert {
  id: number;
  record_id: number;
  parcel_id: number;
  alert_type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface AlertStats {
  totalUnresolved: number;
  bySeverity: {
    high: number;
    medium: number;
    low: number;
  };
  lastAlert: StressAlert | null;
}

export interface JobStatus {
  id: string;
  name: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'paused';
  progress: number;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  processedOn?: number;
  finishedOn?: number;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  paused: number;
}

export interface AnalysisResponse {
  success: boolean;
  jobId?: string;
  parcelId?: number;
  data?: StressAnalysis;
  message?: string;
}

export interface AnalysisJobResponse {
  success: boolean;
  message: string;
  jobId: string;
  parcelId: number;
}

export interface HealthStatus {
  status: 'ok' | 'error' | 'healthy' | 'degraded';
  service: string;
  timestamp: string;
  components?: HealthComponents;
}

export interface HealthComponents {
  database: { status: string };
  queue: {
    status: string;
    stats: QueueStats;
  };
  scheduler: {
    status: string;
    tasks: number;
  };
}

/**
 * GIS Map Data Models
 */

export interface MapCenter {
  lat: number;
  lng: number;
}

export interface MapBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface ParcelInfo {
  id: number;
  name: string;
  cropType?: string;
  area?: number;
  farmerId?: number;
}

export interface AnalysisMetadata {
  recordId?: number;
  meanNdvi?: number;
  stressPercentage?: number;
  imageryDate?: string;
  cloudCoverage?: number;
  zoneCount?: number;
}

export interface ParcelMapData {
  polygon: ParcelGeometry;
  zones: GeoJSON.Feature[];
  center: MapCenter;
  bounds: [[number, number], [number, number]];
  parcelInfo: ParcelInfo;
  analysis?: AnalysisMetadata;
  ndviTileUrl?: string | null;
  timestamp: string;
}

export interface MapDataResponse {
  success: boolean;
  data: ParcelMapData;
  message?: string;
}

// Parcel Models
export interface Parcel {
  id: number;
  name: string;
  polygon: GeoJSONPolygon;
  latitude: number;
  longitude: number;
  crop_type: string;
  area: number;
  farmer_id?: number;
  season?: string;
}

// UI Models
export interface StressStatus {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  percentage: number;
  color: string;
  icon: string;
}

export interface MapMarker {
  latlng: { lat: number; lng: number };
  parcelId: number;
  cropType: string;
}
