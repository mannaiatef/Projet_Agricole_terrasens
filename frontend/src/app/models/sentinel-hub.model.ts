// Sentinel Hub Image Types
export type ImageType = 'NDVI' | 'TrueColor' | 'Moisture';

// Sentinel Hub Color Scale Legend
export interface ColorScaleItem {
  value: string;
  color: string;
  label: string;
  description: string;
}

export interface NDVILegend {
  imageType: 'NDVI';
  title: string;
  scale: ColorScaleItem[];
  notes: string;
  dataSource: string;
}

// Field Information
export interface FieldInfo {
  id: number;
  name: string;
  cropType: string;
  area: number;
  season: string;
  polygon: GeoJSONPolygon;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  farmerId: number;
  imageTypes: ImageType[];
  status: 'active' | 'inactive';
}

// GeoJSON Polygon
export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

// Sentinel Hub Image Metadata
export interface SentinelImageMetadata {
  fieldId: number;
  fieldName: string;
  cropType: string;
  area: number;
  polygon: GeoJSONPolygon;
  availableImageTypes: ImageTypeInfo[];
  metadata: {
    resolution: string;
    format: string;
    source: string;
    lastUpdated: string;
  };
}

export interface ImageTypeInfo {
  type: ImageType;
  description: string;
  colorScale?: {
    min: string;
    medium: string;
    max: string;
  };
}

// Satellite Image Response
export interface SentinelImageResponse {
  image: Blob;
  metadata: {
    acquisitionDate: string;
    cloudCoverage: number;
    imageType: ImageType;
    bbox: number[];
  };
}

// Image Viewer State
export interface ImageViewerState {
  fieldId: number;
  imageType: ImageType;
  isLoading: boolean;
  error: string | null;
  imageUrl: string | null;
  acquisitionDate: string | null;
  cloudCoverage: number | null;
}

// Download Request
export interface DownloadRequest {
  imageType: ImageType;
}
