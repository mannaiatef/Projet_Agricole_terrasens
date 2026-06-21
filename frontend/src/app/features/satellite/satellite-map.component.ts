import { Component, Input, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { SentinelHubService } from '../../services/sentinel-hub.service';
import { FieldInfo, ImageType, NDVILegend } from '../../models/sentinel-hub.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-satellite-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="map-wrapper">
      <!-- Controls bar -->
      <div class="map-controls">
        <div class="control-group">
          <button *ngFor="let type of imageTypes"
            class="btn-type"
            [class.active]="currentImageType === type"
            (click)="switchImageType(type)"
            [disabled]="loading">
            {{ getIcon(type) }} {{ type }}
          </button>
        </div>
        <div class="control-group">
          <button class="btn-icon" (click)="refreshImage()" [disabled]="loading" title="Rafraîchir">⟳</button>
          <button class="btn-icon" (click)="fitPolygon()" title="Recentrer">⊞</button>
        </div>
      </div>

      <!-- Map container -->
      <div #mapContainer class="map-container"></div>

      <!-- Loading overlay -->
      <div *ngIf="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Génération de la carte NDVI...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="error-bar">
        <span>{{ error }}</span>
        <button (click)="error = null; loadData()">✕</button>
      </div>

      <!-- Info + Legend -->
      <div class="map-footer">
        <div class="field-info" *ngIf="fieldInfo">
          <span><strong>{{ fieldInfo.name }}</strong></span>
          <span *ngIf="fieldInfo.cropType"> · {{ fieldInfo.cropType }}</span>
          <span *ngIf="fieldInfo.area"> · {{ fieldInfo.area }} ha</span>
          <span *ngIf="acquisitionDate"> · 📅 {{ acquisitionDate | date:'shortDate' }}</span>
        </div>
        <div class="legend" *ngIf="legend && currentImageType === 'NDVI'">
          <div class="legend-scale">
            <div class="legend-item" *ngFor="let item of legend.scale">
              <span class="color-box" [style.background]="item.color"></span>
              <span class="legend-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-wrapper {
      position: relative;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .map-container {
      height: 550px;
      width: 100%;
      z-index: 1;
    }
    .map-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 8px;
      z-index: 2;
      position: relative;
    }
    .control-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .btn-type {
      padding: 6px 14px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
    }
    .btn-type.active {
      background: #15803d;
      color: white;
      border-color: #15803d;
    }
    .btn-type:hover:not(:disabled) {
      border-color: #94a3b8;
    }
    .btn-icon {
      width: 34px;
      height: 34px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-icon:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .btn-icon:disabled, .btn-type:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      gap: 12px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #22c55e;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .error-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: #fef2f2;
      color: #b91c1c;
      font-size: 13px;
      border-bottom: 1px solid #fecaca;
    }
    .error-bar button {
      background: none;
      border: none;
      color: #b91c1c;
      cursor: pointer;
      font-size: 16px;
    }
    .map-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 13px;
      color: #334155;
    }
    .field-info {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .legend {
      display: flex;
      align-items: center;
    }
    .legend-scale {
      display: flex;
      gap: 10px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .color-box {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      border: 1px solid rgba(0,0,0,0.1);
    }
    .legend-label {
      font-size: 11px;
      color: #475569;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SatelliteMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() fieldId!: number;
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map!: L.Map;
  private polygonLayer: L.Polygon | null = null;
  private imageOverlay: L.ImageOverlay | null = null;
  private destroy$ = new Subject<void>();
  private apiUrl: string;

  fieldInfo: FieldInfo | null = null;
  currentImageType: ImageType = 'NDVI';
  imageTypes: ImageType[] = ['NDVI', 'TrueColor', 'Moisture'];
  loading = false;
  error: string | null = null;
  acquisitionDate: string | null = null;
  legend: NDVILegend | null = null;

  constructor(
    private sentinelHubService: SentinelHubService,
    private cdr: ChangeDetectorRef
  ) {
    this.apiUrl = environment.api?.stress?.baseUrl || environment.stressServiceUrl;
  }

  ngOnInit(): void {
    if (!this.fieldId) return;
    this.loadLegend();
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [35.7595, 10.5855],
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '&copy; Esri, Maxar, Earthstar Geographics'
    }).addTo(this.map);
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.sentinelHubService.getFieldInfo(this.fieldId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.fieldInfo = info;
          this.cdr.markForCheck();
          this.onFieldInfoLoaded(info);
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Impossible de charger les informations de la parcelle';
          this.cdr.markForCheck();
        }
      });
  }

  private onFieldInfoLoaded(info: FieldInfo): void {
    if (!this.map) return;

    const coords = info.coordinates;
    if (coords?.latitude && coords?.longitude) {
      this.map.setView([coords.latitude, coords.longitude], 16);
    }

    // Draw polygon if available
    if (info.polygon?.coordinates?.length > 0) {
      const latlngs = info.polygon.coordinates[0].map((c: number[]) => [c[1], c[0]] as [number, number]);
      if (this.polygonLayer) this.map.removeLayer(this.polygonLayer);

      this.polygonLayer = L.polygon(latlngs, {
        color: '#22c55e',
        weight: 2.5,
        fillColor: 'transparent',
        fillOpacity: 0,
        dashArray: '6, 4'
      }).addTo(this.map);

      this.polygonLayer.bindPopup(`
        <b>${info.name || 'Parcelle #' + info.id}</b><br>
        ${info.cropType ? 'Culture: ' + info.cropType + '<br>' : ''}
        ${info.area ? 'Surface: ' + info.area + ' ha<br>' : ''}
        Type: ${this.currentImageType}
      `);

      this.fitPolygon();
    }

    // Load NDVI overlay
    this.loadImageOverlay(this.currentImageType);
  }

  private loadImageOverlay(imageType: ImageType): void {
    const polygon = this.fieldInfo?.polygon;
    if (!polygon || !polygon.coordinates?.length) return;

    this.loading = true;
    this.currentImageType = imageType;
    this.error = null;
    this.cdr.markForCheck();

    // Build NDVI image URL
    const imageUrl = `${this.apiUrl}/sentinel/image/${this.fieldId}?imageType=${imageType}`;

    // Compute bounds from polygon
    const coords = polygon.coordinates[0];
    const lats = coords.map((c: number[]) => c[1]);
    const lngs = coords.map((c: number[]) => c[0]);
    const bounds: L.LatLngBoundsExpression = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ];

    // Remove old overlay
    if (this.imageOverlay) {
      this.map.removeLayer(this.imageOverlay);
    }

    // Add image overlay with opacity
    this.imageOverlay = L.imageOverlay(imageUrl, bounds, {
      opacity: 0.7,
      alt: 'NDVI Overlay'
    }).addTo(this.map);

    this.imageOverlay.on('load', () => {
      this.loading = false;
      this.cdr.markForCheck();
    });

    this.imageOverlay.on('error', () => {
      this.loading = false;
      this.error = 'Impossible de charger l\'image NDVI';
      this.cdr.markForCheck();
    });

    // Also try to get the image to set acquisition date
    this.loadMetadata();
  }

  private loadMetadata(): void {
    this.sentinelHubService.getImageMetadata(this.fieldId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (meta) => {
          this.acquisitionDate = meta.metadata?.lastUpdated || null;
          this.cdr.markForCheck();
        },
        error: () => {}
      });
  }

  private loadLegend(): void {
    this.sentinelHubService.getNDVILegend()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (legend) => {
          this.legend = legend;
          this.cdr.markForCheck();
        },
        error: () => {}
      });
  }

  switchImageType(type: ImageType): void {
    if (type === this.currentImageType || this.loading) return;
    this.loadImageOverlay(type);
  }

  refreshImage(): void {
    if (this.currentImageType) {
      this.loadImageOverlay(this.currentImageType);
    }
  }

  fitPolygon(): void {
    if (this.polygonLayer && this.map) {
      this.map.fitBounds(this.polygonLayer.getBounds(), { padding: [40, 40] });
    }
  }

  getIcon(type: ImageType): string {
    switch (type) {
      case 'NDVI': return '🟢';
      case 'TrueColor': return '🌍';
      case 'Moisture': return '💧';
      default: return '📡';
    }
  }

  ngOnDestroy(): void {
    if (this.imageOverlay && this.map) this.map.removeLayer(this.imageOverlay);
    if (this.polygonLayer && this.map) this.map.removeLayer(this.polygonLayer);
    if (this.map) this.map.remove();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
