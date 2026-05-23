import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StressService } from '../../services/stress.service';
import { ParcelService } from '../../services/parcel.service';
import {
  Parcel,
  ParcelGeometry,
  StressAnalysis,
  StressRecord,
  StressZone,
  StressAlert,
  AlertStats,
  JobStatus
} from '../../models/stress.model';
import { ParcelMapComponent } from '../parcel-map/parcel-map.component';

@Component({
  selector: 'app-parcel-stress',
  templateUrl: './parcel-stress.component.html',
  styleUrls: ['./parcel-stress.component.css']
})
export class ParcelStressComponent implements OnInit, OnDestroy {
  @ViewChild(ParcelMapComponent) mapComponent!: ParcelMapComponent;

  // Data
  parcels: Parcel[] = [];
  selectedParcelId: number | null = null;
  selectedParcel: Parcel | null = null;

  // Analysis Results
  analysis: StressAnalysis | null = null;
  parcelGeometry: ParcelGeometry | null = null;
  stressZones: StressZone[] = [];

  // Alerts
  alerts: StressAlert[] = [];
  alertStats: AlertStats | null = null;

  // UI State
  loading = false;
  analyzing = false;
  analysisProgress = 0;
  jobId: string | null = null;
  error: string | null = null;
  successMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private stressService: StressService,
    private parcelService: ParcelService
  ) {}

  ngOnInit() {
    this.loadParcels();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all parcels
   */
  loadParcels() {
    this.loading = true;
    this.error = null;

    this.parcelService.getAllParcels()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (parcels) => {
          this.parcels = parcels;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load parcels: ' + err.message;
          this.loading = false;
        }
      });
  }

  /**
   * Handle parcel selection
   */
  onParcelSelected(parcelId: number) {
    this.selectedParcelId = parcelId;
    this.loadParcelData(parcelId);
  }

  /**
   * Load parcel data and its latest analysis
   */
  private loadParcelData(parcelId: number) {
    this.loading = true;
    this.error = null;

    // Fetch complete map data (includes polygon, zones, analysis)
    this.loadMapData(parcelId);

    // Fetch alerts
    this.stressService.getParcelAlerts(parcelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.alerts = response.data || [];
          this.alertStats = response.statistics || null;
        },
        error: (err) => {
          this.alerts = [];
          this.alertStats = null;
        }
      });
  }

  /**
   * Load complete GIS map data for a parcel
   */
  private loadMapData(parcelId: number) {
    this.stressService.getParcelMapData(parcelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            const mapData = response.data;

            // Set parcel geometry from polygon
            if (mapData.polygon) {
              this.parcelGeometry = mapData.polygon;
              this.selectedParcel = {
                id: parcelId,
                name: mapData.parcelInfo?.name || '',
                polygon: mapData.polygon.geometry,
                latitude: mapData.center?.lat || 0,
                longitude: mapData.center?.lng || 0,
                crop_type: mapData.parcelInfo?.cropType,
                area: mapData.parcelInfo?.area
              };
            }

            // Set stress zones from map data
            if (mapData.zones && mapData.zones.length > 0) {
              this.stressZones = mapData.zones.map((zone: any) => ({
                id: zone.id || zone.zoneId || zone.properties?.zoneId,
                // 🔴 CRITICAL FIX: Use stress_level from root level, not from properties!
                stress_level: zone.stress_level || zone.stressLevel || zone.properties?.stressLevel || 'unknown',
                mean_ndvi_in_zone: zone.mean_ndvi_in_zone || zone.meanNdvi || zone.properties?.meanNdvi || 0,
                pixel_count: zone.pixel_count || zone.pixelCount || zone.properties?.pixelCount || 0,
                zone_area: zone.zone_area || zone.zoneArea || zone.properties?.zoneArea || 0,
                geojson: zone.geometry || zone.geojson
              }));
              console.log(`✅ [ParcelStress] Mapped ${this.stressZones.length} stress zones:`, this.stressZones);
            } else {
              this.stressZones = [];
            }

            // Set analysis metadata if available
            if (mapData.analysis) {
              this.analysis = {
                record: {
                  id: mapData.analysis.recordId,
                  mean_ndvi: mapData.analysis.meanNdvi,
                  stress_percentage: mapData.analysis.stressPercentage,
                  imagery_date: mapData.analysis.imageryDate,
                  cloud_coverage: mapData.analysis.cloudCoverage
                } as any,
                zones: this.stressZones,
                alerts: [],
                summary: []
              };
            }
          }
          this.loading = false;
        },
        error: (err) => {
          // Fallback: try loading data separately if map endpoint fails
          this.loadParcelDataFallback(parcelId);
        }
      });
  }

  /**
   * Fallback method to load parcel data if map endpoint fails
   */
  private loadParcelDataFallback(parcelId: number) {
    // Fetch parcel geometry
    this.parcelService.getParcelGeometry(parcelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (geometry) => {
          this.parcelGeometry = geometry;
          this.selectedParcel = {
            id: parcelId,
            name: '',
            polygon: geometry.geometry,
            latitude: 0,
            longitude: 0,
            crop_type: geometry.properties.cropType,
            area: geometry.properties.area
          };
        },
        error: (err) => {
          this.error = 'Failed to load parcel data: ' + err.message;
        }
      });

    // Fetch latest analysis
    this.stressService.getLatestAnalysis(parcelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.analysis = response.data;
            this.stressZones = response.data.zones || [];
          }
          this.loading = false;
        },
        error: (err) => {
          // No previous analysis - that's OK
          this.analysis = null;
          this.stressZones = [];
          this.loading = false;
        }
      });
  }

  /**
   * Trigger stress analysis
   */
  triggerAnalysis() {
    if (!this.selectedParcelId) return;

    this.analyzing = true;
    this.error = null;
    this.successMessage = null;
    this.analysisProgress = 0;

    this.stressService.triggerAnalysis(this.selectedParcelId, 'high')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.jobId = response.jobId;
          this.successMessage = 'Analysis started, processing...';
          this.pollJobStatus();
        },
        error: (err) => {
          this.error = 'Failed to start analysis: ' + err.message;
          this.analyzing = false;
        }
      });
  }

  /**
   * Poll job status until completion
   */
  private pollJobStatus() {
    if (!this.jobId) return;

    this.stressService.pollJobStatus(this.jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (job) => {
          this.analysisProgress = Math.min(100, job.progress || 0);

          if (job.status === 'completed') {
            this.analyzing = false;
            this.successMessage = 'Analysis completed successfully!';
            // Reload analysis results
            setTimeout(() => {
              if (this.selectedParcelId) {
                this.loadParcelData(this.selectedParcelId);
              }
            }, 1000);
          } else if (job.status === 'failed') {
            this.analyzing = false;
            this.error = 'Analysis job failed. Please try again.';
          }
        },
        error: (err) => {
          // Polling error - continue trying or show error
          console.error('Polling error:', err.message);
        }
      });
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: number) {
    this.stressService.acknowledgeAlert(alertId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Remove from list
          this.alerts = this.alerts.filter(a => a.id !== alertId);
        },
        error: (err) => {
          console.error('Failed to acknowledge alert:', err);
        }
      });
  }

  // Helper methods

  /**
   * Get stress level text
   */
  getStressLevel(): string {
    if (!this.analysis) return 'NO DATA';

    const percentage = this.analysis.record.stress_percentage;
    if (percentage < 20) return 'LOW';
    if (percentage < 40) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Get stress indicator color
   */
  getStressColor(): string {
    return this.stressService.getStressColor(
      this.analysis?.record.stress_percentage || 0
    );
  }

  /**
   * Format NDVI
   */
  formatNDVI(ndvi: number): string {
    return ndvi.toFixed(4);
  }

  /**
   * Format percentage
   */
  formatPercentage(percentage: number): string {
    return percentage.toFixed(2);
  }

  /**
   * Check if analysis is old
   */
  isAnalysisOld(): boolean {
    if (!this.analysis) return false;

    const createdAt = new Date(this.analysis.record.created_at);
    const now = new Date();
    const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    return hoursOld > 24;
  }

  /**
   * Check if parcel has high stress
   */
  hasHighStress(): boolean {
    return (this.analysis?.record.stress_percentage || 0) > 30;
  }

  /**
   * Get height for progress bar
   */
  getProgressBarHeight(): number {
    return this.analysisProgress;
  }

  /**
   * Clear error message
   */
  clearError() {
    this.error = null;
  }

  /**
   * Clear success message
   */
  clearSuccess() {
    this.successMessage = null;
  }
}
