/**
 * Parcel Stress Visualization Component
 * Displays parcel with stress overlay on map
 * Supports dual-mode visualization: Zones or Pixel-level Heatmap
 */

import { Component, OnInit, Input, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as L from 'leaflet';

// Color utilities
const STRESS_COLORS = {
  healthy: '#4CAF50',
  medium: '#FF9800',
  high: '#F44336'
};

@Component({
  selector: 'app-parcel-stress-display',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="stress-display-container">
      <!-- Visualization Mode Toggle -->
      <div class="visualization-mode-toggle">
        <button 
          (click)="setVisualizationMode('zones')"
          [class.active]="visualizationMode === 'zones'"
          class="mode-btn">
          📦 Zones View
        </button>
        <button 
          (click)="setVisualizationMode('heatmap')"
          [class.active]="visualizationMode === 'heatmap'"
          class="mode-btn">
          🔥 Heatmap View
        </button>
      </div>

      <!-- Map Container -->
      <div class="map-container" #mapContainer></div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Loading stress analysis...</p>
      </div>

      <!-- Stress Information Overlay -->
      <div *ngIf="stressData && !isLoading" class="stress-info-overlay">
        <h3>{{ parcelName }}</h3>
        
        <div class="stress-stats">
          <div class="stat-card">
            <span class="label">Stress Level:</span>
            <span class="value" [style.color]="stressColor">
              {{ stressDescription }}
            </span>
          </div>
          
          <div class="stat-card">
            <span class="label">Stress %:</span>
            <span class="value">{{ stressPercentage }}</span>
          </div>

          <div class="stat-card">
            <span class="label">NDVI:</span>
            <span class="value">{{ ndvi }}</span>
          </div>

          <div class="stat-card">
            <span class="label">Date:</span>
            <span class="value">{{ imageryDate }}</span>
          </div>
        </div>

        <!-- Legend -->
        <div class="legend">
          <div *ngIf="visualizationMode === 'zones'" class="legend-zones">
            <div class="legend-item">
              <span class="legend-color" style="background-color: #4CAF50;"></span>
              <span>Healthy</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background-color: #FF9800;"></span>
              <span>Medium Stress</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background-color: #F44336;"></span>
              <span>High Stress</span>
            </div>
          </div>
          
          <div *ngIf="visualizationMode === 'heatmap'" class="legend-heatmap">
            <span class="legend-label">NDVI Scale</span>
            <div class="legend-gradient">
              <span class="legend-item-heatmap">Low</span>
              <div class="gradient-bar"></div>
              <span class="legend-item-heatmap">High</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-message">
        <p>{{ error }}</p>
        <button (click)="loadStressData()">Retry</button>
      </div>

      <!-- No Data State -->
      <div *ngIf="!stressData && !isLoading && !error" class="no-data-message">
        <p>No stress data available for this parcel</p>
        <button (click)="triggerAnalysis()">Analyze Now</button>
      </div>
    </div>
  `,
  styles: [`
    .stress-display-container {
      position: relative;
      width: 100%;
      height: 600px;
      border-radius: 8px;
      overflow: hidden;
      background: #f5f5f5;
    }

    .visualization-mode-toggle {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      gap: 8px;
      z-index: 1000;
      background: white;
      padding: 8px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .mode-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .mode-btn:hover {
      background: #f0f0f0;
      border-color: #999;
    }

    .mode-btn.active {
      background: #2196F3;
      color: white;
      border-color: #2196F3;
    }

    .map-container {
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.95);
      z-index: 10;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #ddd;
      border-top: 4px solid #2196F3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .stress-info-overlay {
      position: absolute;
      top: 50px;
      right: 10px;
      width: 280px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      padding: 15px;
      z-index: 5;
      max-height: 500px;
      overflow-y: auto;
    }

    .stress-info-overlay h3 {
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #333;
      border-bottom: 2px solid #2196F3;
      padding-bottom: 10px;
    }

    .stress-stats {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 15px;
    }

    .stat-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: #f9f9f9;
      border-radius: 4px;
      font-size: 13px;
    }

    .stat-card .label {
      font-weight: 600;
      color: #666;
    }

    .stat-card .value {
      font-weight: bold;
      font-size: 14px;
    }

    .legend {
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      margin-bottom: 6px;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 2px;
    }

    .legend-heatmap {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .legend-label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
    }

    .legend-gradient {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .gradient-bar {
      height: 20px;
      flex: 1;
      background: linear-gradient(to right, 
        rgb(255, 0, 0),
        rgb(255, 165, 0),
        rgb(255, 255, 0),
        rgb(144, 255, 0),
        rgb(0, 255, 0));
      border-radius: 2px;
    }

    .legend-item-heatmap {
      font-size: 11px;
      color: #666;
      font-weight: 500;
    }

    .error-message {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      z-index: 10;
    }

    .error-message p {
      color: #d32f2f;
      margin-bottom: 15px;
    }

    .error-message button,
    .no-data-message button {
      background: #2196F3;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .error-message button:hover,
    .no-data-message button:hover {
      background: #1976D2;
    }

    .no-data-message {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      z-index: 10;
    }

    .no-data-message p {
      color: #666;
      margin-bottom: 15px;
    }
  `]
})
export class ParcelStressDisplayComponent implements OnInit {
  @Input() parcelId!: number;
  @Input() parcelName: string = 'Parcel';
  @Input() latitude: number = 0;
  @Input() longitude: number = 0;
  @Input() polygon: any;

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private http: HttpClient = inject(HttpClient);
  private map: L.Map | null = null;
  private heatmapLayer: L.GeoJSON | null = null;
  private zonesLayer: L.FeatureGroup | null = null;
  
  visualizationMode: 'zones' | 'heatmap' = 'heatmap';
  stressData: any = null;
  stressPercentage: string = '0.00';
  ndvi: string = '0.0000';
  imageryDate: string = '';
  stressColor: string = '#4CAF50';
  stressDescription: string = 'Healthy';
  isLoading = false;
  error: string | null = null;

  ngOnInit(): void {
    setTimeout(() => this.initializeMap(), 500);
    this.loadStressData();
  }

  /**
   * Initialize Leaflet map
   */
  private initializeMap(): void {
    if (!this.mapContainer) return;

    this.map = L.map(this.mapContainer.nativeElement).setView(
      [this.latitude, this.longitude],
      13
    );

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Draw parcel boundary
    if (this.polygon) {
      this.drawParcelBoundary();
    }
  }

  /**
   * Draw parcel boundary on map
   */
  private drawParcelBoundary(): void {
    if (!this.map) return;

    const geoJsonLayer = L.geoJSON(this.polygon, {
      style: {
        color: '#2196F3',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.1,
      },
    }).addTo(this.map);

    // Fit map to parcel bounds
    this.map.fitBounds(geoJsonLayer.getBounds());
  }

  /**
   * Draw stress zones on map with color coding
   */
  private drawStressZones(): void {
    if (!this.map || !this.stressData?.zones) return;

    // Remove existing zones layer
    if (this.zonesLayer) {
      this.map.removeLayer(this.zonesLayer);
    }

    this.zonesLayer = L.featureGroup().addTo(this.map);

    this.stressData.zones.forEach((zone: any) => {
      const color = this.getZoneColor(zone.stress_level);

      L.geoJSON(zone.geojson, {
        style: {
          color: color,
          weight: 1,
          opacity: 0.9,
          fillOpacity: 0.6,
        },
        onEachFeature: (feature, layer) => {
          const popup = L.popup().setContent(`
            <div style="font-size: 12px;">
              <b>Stress Level:</b> ${zone.stress_level}<br>
              <b>NDVI:</b> ${zone.mean_ndvi_in_zone.toFixed(4)}<br>
              <b>Area:</b> ${zone.zone_area.toFixed(6)} km²
            </div>
          `);
          layer.bindPopup(popup);
        },
      }).addTo(this.zonesLayer!);
    });
  }

  /**
   * Draw pixel-level NDVI heatmap
   */
  private drawHeatmap(): void {
    if (!this.map || !this.stressData?.heatmap) {
      console.warn('[ParcelStressDisplay] ⚠️ Cannot draw heatmap: map=', !!this.map, 'heatmap=', !!this.stressData?.heatmap);
      return;
    }

    console.log('[ParcelStressDisplay] Starting heatmap render...');

    // Remove existing heatmap layer
    if (this.heatmapLayer) {
      this.map.removeLayer(this.heatmapLayer);
      console.log('[ParcelStressDisplay] Removed existing heatmap layer');
    }

    // Render heatmap with color gradient based on NDVI
    try {
      this.heatmapLayer = L.geoJSON(this.stressData.heatmap, {
        pointToLayer: (feature, latlng) => {
          const ndvi = feature.properties.ndvi;
          const color = this.getNDVIColor(ndvi);

          return L.circleMarker(latlng, {
            radius: 3,
            fillColor: color,
            color: color,
            fillOpacity: 0.8,
            weight: 0,
          }).bindPopup(`
            <div style="font-size: 12px;">
              <b>NDVI:</b> ${ndvi.toFixed(4)}<br>
              <b>Stress:</b> ${feature.properties.stressLevel}<br>
              <b>NIR:</b> ${feature.properties.nir}<br>
              <b>Red:</b> ${feature.properties.red}
            </div>
          `);
        }
      }).addTo(this.map);

      console.log(`[ParcelStressDisplay] ✅ Heatmap rendered successfully with ${this.stressData.heatmap.features?.length || 0} pixels`);
    } catch (error) {
      console.error('[ParcelStressDisplay] 🔴 ERROR rendering heatmap:', error);
    }
  }

  /**
   * Get color for NDVI value (red → yellow → green)
   */
  private getNDVIColor(ndvi: number): string {
    // NDVI range: -1 to 1
    // Normalize to 0-1
    const normalized = (ndvi + 1) / 2;

    // Red (low NDVI) → Yellow (medium) → Green (high NDVI)
    if (normalized < 0.33) {
      // Red to Orange
      const r = 255;
      const g = Math.floor(165 * (normalized / 0.33));
      return `rgb(${r}, ${g}, 0)`;
    } else if (normalized < 0.66) {
      // Orange to Yellow
      const r = 255;
      const g = 255;
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Yellow to Green
      const r = Math.floor(255 * (1 - (normalized - 0.66) / 0.34));
      const g = 255;
      return `rgb(${r}, ${g}, 0)`;
    }
  }

  /**
   * Set visualization mode and redraw
   */
  setVisualizationMode(mode: 'zones' | 'heatmap'): void {
    this.visualizationMode = mode;
    
    if (this.map && this.stressData) {
      if (mode === 'heatmap') {
        if (this.zonesLayer) {
          this.map.removeLayer(this.zonesLayer);
        }
        this.drawHeatmap();
      } else {
        if (this.heatmapLayer) {
          this.map.removeLayer(this.heatmapLayer);
        }
        this.drawStressZones();
      }
    }
  }

  /**
   * Load stress data from API
   */
  loadStressData(): void {
    if (!this.parcelId) return;

    this.isLoading = true;
    this.error = null;

    // Use the map endpoint which includes heatmap generation
    this.http.get(`/api/stress/parcel/${this.parcelId}/map`).subscribe({
      next: (response: any) => {
        const mapData = response?.data || response;
        
        // 🔴 CRITICAL DEBUG: Log received data
        console.log('[ParcelStressDisplay] Map data received:', mapData);
        console.log('[ParcelStressDisplay] Has heatmap:', !!mapData?.heatmap);
        if (mapData?.heatmap?.features) {
          console.log(`[ParcelStressDisplay] Heatmap features count: ${mapData.heatmap.features.length}`);
          console.log('[ParcelStressDisplay] Sample heatmap feature:', mapData.heatmap.features[0]);
        } else {
          console.log('[ParcelStressDisplay] ⚠️ NO HEATMAP IN RESPONSE');
        }

        // Transform map data to match analysis format
        this.stressData = mapData;

        // Update stats from analysis data
        if (mapData.analysis) {
          this.stressPercentage = this.formatStressPercentage(
            mapData.analysis.stressPercentage
          );
          this.ndvi = this.formatNDVI(mapData.analysis.meanNdvi);
          this.imageryDate = new Date(mapData.analysis.imageryDate).toLocaleDateString();

          // Update color and description
          this.stressColor = this.getStressColor(
            mapData.analysis.stressPercentage
          );
          this.stressDescription = this.getStressLevel(
            mapData.analysis.stressPercentage
          ) === 'HIGH' ? 'High Stress' :
            this.getStressLevel(mapData.analysis.stressPercentage) === 'MEDIUM'
              ? 'Medium Stress'
              : 'Healthy';
        }

        // Render visualization based on mode
        if (this.visualizationMode === 'heatmap') {
          console.log('[ParcelStressDisplay] Rendering heatmap...');
          this.drawHeatmap();
        } else {
          console.log('[ParcelStressDisplay] Rendering zones...');
          this.drawStressZones();
        }

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load stress data:', err);
        this.isLoading = false;
        // Don't show error if no data exists - just show "no data" state
        if (err.status !== 404) {
          this.error = 'Failed to load stress data. Please try again.';
        }
      }
    });
  }

  /**
   * Trigger new stress analysis
   */
  triggerAnalysis(): void {
    if (!this.parcelId) return;

    this.isLoading = true;
    this.http.post(`/api/stress/analyze`, { parcel_id: this.parcelId, priority: 'high' }).subscribe({
      next: (response: any) => {
        console.log('Analysis job queued:', response);
        // Poll for job completion
        if (response.job_id) {
          this.pollJobCompletion(response.job_id);
        }
      },
      error: (err: any) => {
        console.error('Failed to trigger analysis:', err);
        this.isLoading = false;
        this.error = 'Failed to start analysis. Please try again.';
      }
    });
  }

  /**
   * Poll job status until completion
   */
  private pollJobCompletion(jobId: string): void {
    const maxAttempts = 40; // 2 minutes max (40 * 3 seconds)
    let attempts = 0;

    const pollInterval = setInterval(() => {
      attempts++;

      this.http.get(`/api/stress/jobs/${jobId}`).subscribe({
        next: (jobStatus: any) => {
          if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
            clearInterval(pollInterval);
            this.isLoading = false;

            if (jobStatus.status === 'completed') {
              // Reload stress data
              this.loadStressData();
            } else {
              this.error = 'Analysis failed. Please try again.';
            }
          }
        },
        error: () => {
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            this.isLoading = false;
          }
        }
      });
    }, 3000);
  }

  /**
   * Helper: Get color for stress zone
   */
  private getZoneColor(stressLevel: string): string {
    switch (stressLevel?.toLowerCase()) {
      case 'high': return STRESS_COLORS.high;
      case 'medium': return STRESS_COLORS.medium;
      case 'healthy':
      default: return STRESS_COLORS.healthy;
    }
  }

  /**
   * Helper: Get color based on stress percentage
   */
  private getStressColor(percentage: any): string {
    const num = typeof percentage === 'string' ? parseFloat(percentage) : (percentage || 0);
    if (num >= 70) return STRESS_COLORS.high;
    if (num >= 40) return STRESS_COLORS.medium;
    return STRESS_COLORS.healthy;
  }

  /**
   * Helper: Get stress level text
   */
  private getStressLevel(percentage: any): string {
    const num = typeof percentage === 'string' ? parseFloat(percentage) : (percentage || 0);
    if (num >= 70) return 'HIGH';
    if (num >= 40) return 'MEDIUM';
    return 'HEALTHY';
  }

  /**
   * Helper: Format stress percentage
   */
  private formatStressPercentage(value: any): string {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return isNaN(num) ? '—' : num.toFixed(2) + '%';
  }

  /**
   * Helper: Format NDVI value
   */
  private formatNDVI(value: any): string {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return isNaN(num) ? '—' : num.toFixed(4);
  }
}
