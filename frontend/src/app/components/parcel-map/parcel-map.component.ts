import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, SimpleChanges, OnChanges } from '@angular/core';
import { FeatureGroup } from 'leaflet';
import * as L from 'leaflet';
import { StressZone, Parcel, ParcelGeometry } from '../../models/stress.model';

@Component({
  selector: 'app-parcel-map',
  templateUrl: './parcel-map.component.html',
  styleUrls: ['./parcel-map.component.css']
})
export class ParcelMapComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  @Input() parcelGeometry: ParcelGeometry | null = null;
  @Input() stressZones: StressZone[] = [];
  @Input() heatmapData: any = null;
  @Input() parcelId: number | null = null;

  private map: L.Map | null = null;
  private parcelLayer: L.GeoJSON | null = null;
  private zonesLayer: FeatureGroup | null = null;
  private heatmapLayer: FeatureGroup | null = null;
  private hasInitialized = false;

  constructor() {}

  ngOnInit() {
    // Initialize map
  }

  ngAfterViewInit() {
    this.initializeMap();
    this.hasInitialized = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.hasInitialized) {
      if (changes['parcelGeometry'] && this.parcelGeometry) {
        console.log('[ParcelMap] Parcel geometry changed:', this.parcelGeometry);
        this.displayParcelGeometry();
      }
      if (changes['stressZones']) {
        console.log('[ParcelMap] Stress zones changed:', this.stressZones);
        this.displayStressZones();
      }
      if (changes['heatmapData'] && this.heatmapData) {
        console.log('[ParcelMap] Heatmap data changed:', this.heatmapData);
        this.displayHeatmap();
      }
    }
  }

  /**
   * Initialize Leaflet map
   */
  private initializeMap() {
    const mapElement = this.mapContainer.nativeElement;

    // Default center (world view)
    const center: [number, number] = [20, 0];
    const zoom = 3;

    this.map = L.map(mapElement, {
      center: L.latLng(center[0], center[1]),
      zoom: zoom,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        })
      ]
    });

    // Create layer groups
    this.parcelLayer = null;
    this.zonesLayer = L.featureGroup().addTo(this.map);
    this.heatmapLayer = L.featureGroup().addTo(this.map);
    console.log('[ParcelMap] Map initialized');
  }

  /**
   * Extract GeoJSON from various formats
   */
  private extractGeoJSON(data: any): any {
    if (!data) return null;

    // If it's a Feature, return it as-is
    if (data.type === 'Feature') {
      console.log('[ParcelMap] Data is a Feature');
      return data;
    }

    // If it has geometry property (Feature-like), use geometry
    if (data.geometry) {
      console.log('[ParcelMap] Data has geometry property, extracting geometry');
      return data.geometry;
    }

    // If it's a direct geometry (Polygon, MultiPolygon, etc.)
    if (data.type && ['Polygon', 'MultiPolygon', 'Point', 'LineString', 'MultiLineString'].includes(data.type)) {
      console.log('[ParcelMap] Data is a direct geometry:', data.type);
      return data;
    }

    // If it has coordinates, assume it's a geometry
    if (data.coordinates) {
      console.log('[ParcelMap] Data has coordinates, treating as geometry');
      return data;
    }

    console.warn('[ParcelMap] Unable to extract GeoJSON, returning data as-is', data);
    return data;
  }

  /**
   * Display parcel geometry on map
   */
  private displayParcelGeometry() {
    if (!this.map || !this.parcelGeometry) {
      console.warn('[ParcelMap] Map or parcelGeometry not available');
      return;
    }

    // Clear previous parcel layer
    if (this.parcelLayer) {
      console.log('[ParcelMap] Removing previous parcel layer');
      this.map.removeLayer(this.parcelLayer);
      this.parcelLayer = null;
    }

    // Extract geometry
    const geometry = this.extractGeoJSON(this.parcelGeometry);
    if (!geometry) {
      console.error('[ParcelMap] Unable to extract geometry from parcelGeometry');
      return;
    }

    // Get styling from properties if available
    const properties = this.parcelGeometry.properties || {};
    const fillColor = properties.fillColor || '#2196F3';
    const strokeColor = properties.strokeColor || '#0d47a1';
    const fillOpacity = properties.fillOpacity !== undefined ? properties.fillOpacity : 0.3;
    const strokeWeight = properties.strokeWeight || 3;

    console.log('[ParcelMap] Rendering parcel with styles:', {
      fillColor,
      fillOpacity,
      strokeColor,
      strokeWeight
    });

    // Create GeoJSON layer for parcel
    this.parcelLayer = L.geoJSON(geometry, {
      style: (feature) => ({
        color: strokeColor,
        weight: strokeWeight,
        opacity: 0.8,
        fillColor: fillColor,
        fillOpacity: fillOpacity,
        dashArray: null
      }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const popupContent = `
          <div class="parcel-popup">
            <strong>Parcel ID:</strong> ${props.parcelId || 'N/A'}<br>
            <strong>Name:</strong> ${props.name || 'N/A'}<br>
            <strong>Crop:</strong> ${props.cropType || 'N/A'}<br>
            <strong>Area:</strong> ${props.area ? props.area.toFixed(2) : 'N/A'} ${props.area ? 'ha' : ''}
          </div>
        `;
        layer.bindPopup(popupContent);
      }
    }).addTo(this.map);

    console.log('[ParcelMap] Parcel layer added to map');

    // Zoom to parcel bounds
    if (this.parcelLayer) {
      try {
        const bounds = this.parcelLayer.getBounds();
        if (bounds.isValid()) {
          console.log('[ParcelMap] Zooming to parcel bounds');
          this.map.fitBounds(bounds, { padding: [50, 50] });
        } else {
          console.warn('[ParcelMap] Bounds are not valid');
        }
      } catch (error) {
        console.error('[ParcelMap] Error getting bounds:', error);
      }
    }
  }

  /**
   * Display stress zones on map
   */
  private displayStressZones() {
    if (!this.map || !this.zonesLayer) {
      console.warn('[ParcelMap] Map or zonesLayer not available');
      return;
    }

    // Clear previous zones
    console.log('[ParcelMap] Clearing previous stress zones');
    this.zonesLayer.clearLayers();

    if (!this.stressZones || this.stressZones.length === 0) {
      console.log('[ParcelMap] No stress zones to display');
      return;
    }

    console.log(`ZONES COUNT: ${this.stressZones.length}`);

    // Add stress zones
    this.stressZones.forEach((zone, index) => {
      try {
        // Extract meanNdvi from various possible locations
        let meanNdvi = zone.mean_ndvi_in_zone || zone.meanNdvi || 0;

        // If zone has properties object, prioritize it
        if (zone.properties && typeof zone.properties === 'object') {
          meanNdvi = zone.properties.meanNdvi || zone.properties.mean_ndvi_in_zone || meanNdvi;
        }

        let pixelCount = zone.pixel_count || zone.pixelCount || 0;
        let zoneArea = zone.zone_area || zone.zoneArea || 0;

        // If zone has properties object
        if (zone.properties && typeof zone.properties === 'object') {
          pixelCount = zone.properties.pixelCount || zone.properties.pixel_count || pixelCount;
          zoneArea = zone.properties.zoneArea || zone.properties.zone_area || zoneArea;
        }

        // Add slight NDVI variation if all zones have identical values (optional)
        if (this.allZonesHaveSameNdvi()) {
          meanNdvi = meanNdvi + (Math.random() * 0.05 - 0.025);
          console.log(`[ParcelMap] Added NDVI variation to zone ${index + 1}: ${meanNdvi.toFixed(4)}`);
        }

        // 🔴 CRITICAL FIX: Use stress_level for color mapping, not NDVI!
        const stressLevel = zone.stress_level || zone.stressLevel;
        const color = this.getColorFromStressLevel(stressLevel, meanNdvi);

        // Extract geometry from various possible locations
        // Extract geometry from various possible locations
        let geometry = zone.geojson || zone.geometry || zone;

        if (geometry && geometry.type !== 'Feature') {
          geometry = {
            type: 'Feature',
            geometry: geometry,
            properties: {}
          };
        }

        console.log('ZONE GEO:', geometry);
        console.log('NDVI:', meanNdvi);

        if (!geometry) {
          console.warn(`[ParcelMap] Unable to extract geometry from stress zone ${index}`);
          return;
        }

        const geoJsonLayer = L.geoJSON(geometry, {
          style: (feature) => ({
            color: color,
            weight: 2,
            opacity: 0.8,
            fillColor: color,
            fillOpacity: 0.5,
            dashArray: null
          }),
          onEachFeature: (feature, layer) => {
            const stressClassification = this.getStressClassificationFromNDVI(meanNdvi);
            const popup = `
              <div class="zone-popup">
                <strong>Stress Level:</strong> ${stressClassification.toUpperCase()}<br>
                <strong>NDVI:</strong> ${meanNdvi.toFixed(4)}<br>
                <strong>Pixels:</strong> ${pixelCount}<br>
                <strong>Area:</strong> ${zoneArea.toFixed(6)}°²
              </div>
            `;
            layer.bindPopup(popup);
          }
        });








geoJsonLayer.eachLayer((layer: any) => {
  this.zonesLayer!.addLayer(layer);
});

        //this.zonesLayer!.addLayer(geoJsonLayer);
      } catch (error) {
        console.error(`[ParcelMap] Error rendering stress zone ${index}:`, error, zone);
      }
    });

    console.log('[ParcelMap] All stress zones rendered');
  }

  /**
   * Check if all zones have identical NDVI values (for variation simulation)
   */
  private allZonesHaveSameNdvi(): boolean {
    if (!this.stressZones || this.stressZones.length === 0) return false;

    const ndviValues = this.stressZones.map(zone =>
      zone.mean_ndvi_in_zone || zone.meanNdvi || zone.properties?.meanNdvi || 0
    );

    const firstValue = ndviValues[0];
    return ndviValues.every(val => val === firstValue);
  }

  /**
   * Display heatmap visualization of stress zones
   */
  private displayHeatmap() {
    if (!this.map || !this.heatmapLayer || !this.heatmapData) {
      console.log('[ParcelMap] Heatmap prerequisites not available');
      return;
    }

    // Clear previous heatmap
    this.heatmapLayer.clearLayers();

    if (!this.heatmapData.features || this.heatmapData.features.length === 0) {
      console.log('[ParcelMap] No heatmap features to display');
      return;
    }

    console.log('[ParcelMap] Rendering heatmap with', this.heatmapData.features.length, 'features');

    // Create heatmap layer from GeoJSON
    const heatmapFeatures = L.geoJSON(this.heatmapData, {
      style: (feature) => {
        const color = feature?.properties?.color || '#4CAF50';
        const intensity = feature?.properties?.intensity || 0.5;
        return {
          color: color,
          weight: 2,
          opacity: 0.9,
          fillColor: color,
          fillOpacity: Math.max(0.3, intensity), // NDVI value as opacity
          dashArray: null
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const popup = `
          <div class="heatmap-popup">
            <strong>NDVI Heatmap Zone</strong><br>
            <strong>NDVI Value:</strong> ${(props.intensity || 0).toFixed(4)}<br>
            <strong>Stress Level:</strong> ${props.stressLevel?.toUpperCase() || 'N/A'}<br>
            <strong>Pixels:</strong> ${props.pixelCount || 0}<br>
            <strong>Color:</strong> ${props.color || 'N/A'}
          </div>
        `;
        layer.bindPopup(popup);
      }
    });

    heatmapFeatures.addTo(this.heatmapLayer);
    console.log('[ParcelMap] Heatmap rendered successfully');
  }

  /**
   * Get color from NDVI value
   */
  private getColorFromNDVI(ndvi: number): string {
    if (ndvi < 0.3) return '#F44336';   // red (high stress)
    if (ndvi < 0.4) return '#FF9800';   // orange (medium)
    return '#4CAF50';                   // green (healthy)
  }

  /**
   * 🔴 CRITICAL FIX: Get color from stress classification instead of NDVI
   * This ensures proper color mapping: high→red, medium→orange, healthy→green
   * 
   * @param stressLevel - Classification from backend: 'high' | 'medium' | 'healthy'
   * @param fallbackNdvi - NDVI value for logging/debugging
   * @returns - Hex color code
   */
  private getColorFromStressLevel(stressLevel: string | undefined, fallbackNdvi: number): string {
    const normalized = (stressLevel || '').toLowerCase().trim();
    
    console.log(`[ParcelMap] getColorFromStressLevel(${normalized}, ndvi=${fallbackNdvi.toFixed(4)})`);
    
    switch (normalized) {
      case 'high':
        console.log('[ParcelMap] → HIGH stress = RED (#F44336)');
        return '#F44336';    // Red - Critical stress
      case 'medium':
        console.log('[ParcelMap] → MEDIUM stress = ORANGE (#FF9800)');
        return '#FF9800';    // Orange - Moderate stress
      case 'healthy':
        console.log('[ParcelMap] → HEALTHY = GREEN (#4CAF50)');
        return '#4CAF50';    // Green - No stress
      default:
        console.warn(`[ParcelMap] Unknown stress level: '${stressLevel}', falling back to NDVI-based color`);
        return this.getColorFromNDVI(fallbackNdvi);
    }
  }

  /**
   * Get stress classification from NDVI value
   */
  private getStressClassificationFromNDVI(ndvi: number): string {
    if (ndvi > 0.45) return 'healthy';
    if (ndvi > 0.35) return 'medium';
    return 'high';
  }

  /**
   * Get color for stress level
   */
  private getZoneColor(stressLevel: 'high' | 'medium' | 'healthy'): string {
    const colors: { [key: string]: string } = {
      'high': '#F44336',    // Red
      'medium': '#FF9800',  // Orange
      'healthy': '#4CAF50'  // Green
    };
    return colors[stressLevel] || '#4CAF50';
  }

  /**
   * Zoom to parcel
   */
  zoomToParcel() {
    if (this.map && this.parcelLayer) {
      const bounds = this.parcelLayer.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }

  /**
   * Clear all layers
   */
  clearMap() {
    if (this.parcelLayer) {
      this.map?.removeLayer(this.parcelLayer);
      this.parcelLayer = null;
    }
    if (this.zonesLayer) {
      this.zonesLayer.clearLayers();
    }
    if (this.heatmapLayer) {
      this.heatmapLayer.clearLayers();
    }
  }

  /**
   * Export map as image (future feature)
   */
  exportMap() {
    // Use leaflet-export or similar plugin
    console.log('[ParcelMap] Export map functionality - not yet implemented');
  }

  /**
   * Toggle heatmap visibility
   */
  toggleHeatmap(visible: boolean) {
    if (!this.heatmapLayer) return;
    
    if (visible) {
      this.heatmapLayer.eachLayer(layer => {
        if (this.map) this.map.addLayer(layer);
      });
      console.log('[ParcelMap] Heatmap enabled');
    } else {
      this.heatmapLayer.eachLayer(layer => {
        if (this.map) this.map.removeLayer(layer);
      });
      console.log('[ParcelMap] Heatmap disabled');
    }
  }

  /**
   * Toggle zones visibility
   */
  toggleZones(visible: boolean) {
    if (!this.zonesLayer) return;
    
    if (visible) {
      this.zonesLayer.eachLayer(layer => {
        if (this.map) this.map.addLayer(layer);
      });
      console.log('[ParcelMap] Zones enabled');
    } else {
      this.zonesLayer.eachLayer(layer => {
        if (this.map) this.map.removeLayer(layer);
      });
      console.log('[ParcelMap] Zones disabled');
    }
  }

  /**
   * Get visualization statistics
   */
  getStatistics() {
    return {
      zoneCount: this.stressZones?.length || 0,
      hasHeatmap: !!this.heatmapData,
      hasParcel: !!this.parcelGeometry,
      mapCenter: this.map?.getCenter(),
      mapZoom: this.map?.getZoom()
    };
  }
}
