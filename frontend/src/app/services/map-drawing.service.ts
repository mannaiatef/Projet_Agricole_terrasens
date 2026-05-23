/**
 * Map Drawing Service
 * Handles map initialization, drawing tools, and geometry calculations
 */

import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DrawnGeometry {
  type: 'Polygon';
  coordinates: [number, number][][]; // GeoJSON format: [[[lon, lat], ...]]
  center?: [number, number]; // [lat, lon]
  area?: number; // in square meters
}

export interface ParcelDrawData {
  geometry: DrawnGeometry;
  area: number;
  center: [number, number];
  pointCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapDrawingService {
  private map: L.Map | null = null;
  private drawControl: L.Control.Draw | null = null;
  private drawnItems = new L.FeatureGroup();
  
  private drawnGeometrySubject = new BehaviorSubject<DrawnGeometry | null>(null);
  public drawnGeometry$ = this.drawnGeometrySubject.asObservable();
  
  private parcelDrawDataSubject = new BehaviorSubject<ParcelDrawData | null>(null);
  public parcelDrawData$ = this.parcelDrawDataSubject.asObservable();

  constructor() {}

  /**
   * Initialize map with drawing controls
   * @param container - HTML element ID or ElementRef
   * @param defaultCenter - Default map center [lat, lon]
   * @param defaultZoom - Default zoom level
   */
  initializeMap(
    container: string | HTMLElement,
    defaultCenter: [number, number] = [35.3, -2.9], // Approximate center of Morocco
    defaultZoom: number = 6
  ): L.Map {
    // Get container element
    const mapElement = typeof container === 'string' 
      ? document.getElementById(container) 
      : container;

    if (!mapElement) {
      throw new Error('Map container not found');
    }

    // Clear any existing map instance
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Set up container with explicit dimensions before creating map
    mapElement.style.position = 'relative';
    mapElement.style.width = '100%';
    mapElement.style.height = '100%';
    mapElement.style.minHeight = '500px';
    mapElement.style.display = 'flex';
    
    // Ensure the container is visible
    mapElement.style.visibility = 'visible';
    mapElement.style.zIndex = '1';
    
    // Force reflow to calculate dimensions
    void mapElement.offsetHeight;
    
    const width = mapElement.offsetWidth;
    const height = mapElement.offsetHeight;
    
    console.log('Map container dimensions (before creation):', width, 'x', height);
    console.log('Container element:', mapElement);

    // Create map instance
    this.map = L.map(mapElement, {
      center: L.latLng(defaultCenter[0], defaultCenter[1]),
      zoom: defaultZoom,
      attributionControl: true,
      zoomControl: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      worldCopyJump: false,
      keyboard: true
    });

    console.log('Map instance created:', this.map);
    console.log('Map container class:', mapElement.className);

    // Force map size calculation
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize(true);
        console.log('Map size invalidated (phase 1)');
      }
    }, 50);

    // Add base tile layer - OpenStreetMap
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 1,
      opacity: 1,
      crossOrigin: 'anonymous'
    });
    
    osmLayer.addTo(this.map);
    console.log('OSM layer added to map');

    // Additional base layer - CartoDB  
    const cartoDarkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '© CartoDB',
      maxZoom: 19
    });

    // Layer control with multiple options
    const baseLayers = {
      'OpenStreetMap': osmLayer,
      'CartoDB': cartoDarkLayer
    };

    L.control.layers(baseLayers, {}, { position: 'topright', collapsed: true }).addTo(this.map);

    // Initialize drawing layer
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    // Initialize draw control
    this.initializeDrawControl();
    
    // Invalidate size multiple times to ensure map renders
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize(true);
        console.log('Map size invalidated (phase 2 - 100ms)');
      }
    }, 100);
    
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize(true);
        console.log('Map size invalidated (phase 3 - 500ms)');
      }
    }, 500);

    // Force a final refresh
    setTimeout(() => {
      if (this.map) {
        // Get all layers and ensure they're visible
        const layers = this.map.getPane('tilePane');
        if (layers) {
          layers.style.visibility = 'visible';
          layers.style.display = 'block';
        }
        console.log('Tile pane visibility enforced');
      }
    }, 200);

    return this.map;
  }

  /**
   * Initialize Leaflet Draw controls
   * Simplified approach without Draw plugin issues
   */
  private initializeDrawControl(): void {
    if (!this.map) return;

    // Add the feature group to the map for manual drawing
    this.map.addLayer(this.drawnItems);
    
    // Enable manual polygon drawing via map clicks
    this.enableManualDrawing();
  }

  /**
   * Enable manual polygon drawing on map click
   */
  private enableManualDrawing(): void {
    if (!this.map) return;

    let isDrawing = false;
    let currentPoints: L.LatLng[] = [];

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (!isDrawing) {
        // Start drawing
        isDrawing = true;
        currentPoints = [e.latlng];
        return;
      }

      currentPoints.push(e.latlng);

      // Check if user clicked near first point to close polygon
      const firstPoint = currentPoints[0];
      const distance = e.latlng.distanceTo(firstPoint);
      
      if (distance < 20 && currentPoints.length >= 3) {
        // Close polygon
        currentPoints.push(firstPoint);
        this.createPolygonFromPoints(currentPoints);
        isDrawing = false;
        currentPoints = [];
      } else {
        // Draw line to new point
        if (currentPoints.length > 1) {
          const polyline = L.polyline(currentPoints, {
            color: '#2196F3',
            weight: 2,
            opacity: 0.8
          });
          polyline.addTo(this.map!);
        }
      }
    });
  }

  /**
   * Create polygon from clicked points
   */
  private createPolygonFromPoints(points: L.LatLng[]): void {
    if (!this.map || points.length < 3) return;

    const polygon = L.polygon(points, {
      color: '#2196F3',
      weight: 3,
      opacity: 0.8,
      fillOpacity: 0.2
    });

    polygon.addTo(this.drawnItems);
    this.drawnItems.addTo(this.map);
    this.processDrawnGeometry();
  }

  /**
   * Process drawn geometry and extract data
   */
  private processDrawnGeometry(): void {
    const layers: any[] = [];
    this.drawnItems.eachLayer((layer: any) => {
      if (layer.toGeoJSON) {
        layers.push(layer.toGeoJSON());
      }
    });

    if (layers.length === 0) return;

    // Use the first drawn feature (usually a polygon or rectangle)
    const geoJsonFeature = layers[0];
    const geometry = geoJsonFeature.geometry;

    if (geometry.type === 'Polygon') {
      const drawnGeo: DrawnGeometry = {
        type: 'Polygon',
        coordinates: geometry.coordinates
      };

      // Calculate area and center
      const area = this.calculatePolygonArea(drawnGeo.coordinates[0]);
      const center = this.calculatePolygonCenter(drawnGeo.coordinates[0]);

      drawnGeo.area = area;
      drawnGeo.center = center;

      this.drawnGeometrySubject.next(drawnGeo);

      const parcelData: ParcelDrawData = {
        geometry: drawnGeo,
        area: area,
        center: center,
        pointCount: drawnGeo.coordinates[0].length - 1 // Exclude closing point
      };

      this.parcelDrawDataSubject.next(parcelData);
    }
  }

  /**
   * Calculate polygon area using Shoelace formula
   * @param coordinates - Array of [lon, lat] coordinates (GeoJSON format)
   * @returns Area in square meters
   */
  private calculatePolygonArea(coordinates: [number, number][]): number {
    // Convert to lat/lon and use Haversine-based area calculation
    const points = coordinates.map(([lon, lat]) => ({ lat, lon }));
    
    let area = 0;
    const R = 6371000; // Earth radius in meters

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      const lat1 = this.toRadians(p1.lat);
      const lat2 = this.toRadians(p2.lat);
      const lon1 = this.toRadians(p1.lon);
      const lon2 = this.toRadians(p2.lon);

      area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs(area * R * R / 2);
    return area; // in square meters
  }

  /**
   * Calculate polygon centroid
   * @param coordinates - Array of [lon, lat] coordinates
   * @returns Center point as [lat, lon]
   */
  private calculatePolygonCenter(coordinates: [number, number][]): [number, number] {
    let latSum = 0;
    let lonSum = 0;

    for (const [lon, lat] of coordinates) {
      lonSum += lon;
      latSum += lat;
    }

    const count = coordinates.length;
    return [latSum / count, lonSum / count];
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get current drawn geometry
   */
  getDrawnGeometry(): DrawnGeometry | null {
    return this.drawnGeometrySubject.value;
  }

  /**
   * Get current parcel draw data
   */
  getParcelDrawData(): ParcelDrawData | null {
    return this.parcelDrawDataSubject.value;
  }

  /**
   * Clear all drawn items
   */
  clearDrawing(): void {
    this.drawnItems.clearLayers();
    this.drawnGeometrySubject.next(null);
    this.parcelDrawDataSubject.next(null);
  }

  /**
   * Display a parcel geometry on the map
   */
  displayParcelGeometry(geometry: DrawnGeometry, style?: L.PathOptions): void {
    if (!this.map) return;

    // Convert from GeoJSON to Leaflet LatLng format
    const latLngs = geometry.coordinates[0].map(([lon, lat]) => [lat, lon] as [number, number]);

    const polygon = L.polygon(latLngs, {
      color: style?.color || '#2196F3',
      weight: style?.weight || 3,
      opacity: style?.opacity || 0.8,
      fillOpacity: style?.fillOpacity || 0.2
    }).addTo(this.map);

    // Fit bounds
    this.map.fitBounds(polygon.getBounds(), { padding: [50, 50] });
  }

  /**
   * Set map center and zoom
   */
  setMapView(center: [number, number], zoom: number): void {
    if (!this.map) return;
    this.map.setView(L.latLng(center[0], center[1]), zoom);
  }

  /**
   * Get map instance
   */
  getMap(): L.Map | null {
    return this.map;
  }

  /**
   * Destroy map and clean up
   */
  destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
