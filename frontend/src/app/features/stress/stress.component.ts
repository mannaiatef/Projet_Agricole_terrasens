import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StressService } from '../../services/stress.service';
import { FarmService } from '../../core/services/farm.service';
import { StressAnalysis, AnalysisResponse, StressRecord } from '../../models/stress.model';

interface ParcelWithStress {
  id: number;
  name: string;
  crop?: string;
  area?: number;
  analysis?: StressAnalysis;
  loading?: boolean;
}

@Component({
  selector: 'app-stress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="stress-page">
      <div class="header">
        <h1>⚠️ Water Stress Analysis</h1>
        <p>Real-time monitoring of vegetation stress detection using satellite imagery and ML-based predictions</p>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading parcel data...</p>
      </div>

      <!-- Error state -->
      <div *ngIf="error" class="error-card">
        <p>❌ {{ error }}</p>
        <button (click)="loadParcels()" class="btn-retry">Retry</button>
      </div>

      <!-- Main content -->
      <div *ngIf="!loading && parcels.length > 0" class="stress-container">
        <!-- Parcel selector -->
        <div class="parcel-selector">
          <h2>Select a Field (Parcelle)</h2>
          <div class="parcel-grid">
            <button 
              *ngFor="let parcel of parcels"
              (click)="selectParcel(parcel)"
              [class.active]="selectedParcel?.id === parcel.id"
              [class.loading]="parcel.loading"
              class="parcel-btn">
              <span class="parcel-name">{{ parcel.name }}</span>
              <span class="parcel-crop" *ngIf="parcel.crop">{{ parcel.crop }}</span>
              <span *ngIf="parcel.loading" class="loading-badge">Loading...</span>
              <span *ngIf="parcel.analysis && !parcel.loading" 
                    [class.high-stress]="getStressPercentage(parcel.analysis) > 70"
                    [class.medium-stress]="getStressPercentage(parcel.analysis) > 40 && getStressPercentage(parcel.analysis) <= 70"
                    [class.low-stress]="getStressPercentage(parcel.analysis) <= 40"
                    class="stress-badge">
                {{ getStressPercentage(parcel.analysis) }}% stress
              </span>
            </button>
          </div>
        </div>

        <!-- Selected parcel analysis -->
        <div *ngIf="selectedParcel" class="analysis-section">
          <div class="analysis-header">
            <h2>{{ selectedParcel.name }} Analysis</h2>
            <button (click)="triggerNewAnalysis()" [disabled]="analyzing" class="btn-analyze">
              {{ analyzing ? '⏳ Analyzing...' : '🔄 Trigger New Analysis' }}
            </button>
          </div>

          <!-- Analysis results -->
          <div *ngIf="selectedParcel.analysis" class="stress-metrics">
            <div class="metric-card stress-percentage">
              <h3>💧 Vegetation Stress Index</h3>
              <div class="metric-value" [class.critical]="getStressPercentage(selectedParcel.analysis) > 70">
                {{ getStressPercentage(selectedParcel.analysis) }}%
              </div>
              <div class="metric-bar">
                <div class="progress" [style.width.%]="getStressPercentage(selectedParcel.analysis)"></div>
              </div>
              <p class="metric-label">{{ getStressLabel(getStressPercentage(selectedParcel.analysis)) }}</p>
            </div>

            <div class="metric-card ndvi">
              <h3>🌿 NDVI (Vegetation Health)</h3>
              <div class="metric-value">
                {{ selectedParcel.analysis.record.mean_ndvi | number:'1.2-2' }}
              </div>
              <p class="metric-label">{{ getNDVILabel(selectedParcel.analysis.record.mean_ndvi) }}</p>
            </div>

            <div class="metric-card cloud-coverage">
              <h3>☁️ Cloud Coverage</h3>
              <div class="metric-value">
                {{ selectedParcel.analysis.record.cloud_coverage }}%
              </div>
              <div class="metric-bar">
                <div class="progress" [style.width.%]="selectedParcel.analysis.record.cloud_coverage"></div>
              </div>
            </div>

            <div class="metric-card pixels">
              <h3>📊 Stressed Pixels</h3>
              <div class="metric-value">
                {{ getStressedPixelPercentage(selectedParcel.analysis) }}%
              </div>
              <p class="metric-label">
                {{ selectedParcel.analysis.record.stressed_pixel_count }} / {{ selectedParcel.analysis.record.pixel_count }} pixels
              </p>
            </div>
          </div>

          <!-- Stress zones summary -->
          <div *ngIf="selectedParcel.analysis && selectedParcel.analysis.summary" class="zones-section">
            <h3>Stress Zones Summary</h3>
            <div class="zones-grid">
              <div *ngFor="let zone of selectedParcel.analysis.summary" 
                   [class]="'zone-card zone-' + zone.stress_level">
                <div class="zone-header">
                  <span class="zone-level">
                    <span *ngIf="zone.stress_level === 'high'" class="icon">🔴</span>
                    <span *ngIf="zone.stress_level === 'medium'" class="icon">🟡</span>
                    <span *ngIf="zone.stress_level === 'healthy'" class="icon">🟢</span>
                    {{ zone.stress_level | titlecase }}
                  </span>
                </div>
                <p><strong>{{ zone.zone_count }}</strong> zones</p>
                <p>Area: <strong>{{ zone.total_area.toFixed(2) }}</strong> m²</p>
                <p>Avg NDVI: <strong>{{ zone.avg_ndvi.toFixed(2) }}</strong></p>
              </div>
            </div>
          </div>

          <!-- Analysis timestamp -->
          <div *ngIf="selectedParcel.analysis" class="analysis-info">
            <p>
              Last updated: <strong>{{ selectedParcel.analysis.record.imagery_date | date:'medium' }}</strong>
              <span class="status-badge" [class]="'status-' + selectedParcel.analysis.record.status">
                {{ selectedParcel.analysis.record.status | titlecase }}
              </span>
            </p>
          </div>

          <!-- No data -->
          <div *ngIf="!selectedParcel.analysis" class="no-data">
            <p>No stress analysis data available for this parcel.</p>
            <button (click)="triggerNewAnalysis()" class="btn-analyze">
              🔄 Run First Analysis
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && parcels.length === 0" class="empty-state">
        <p>No parcels found. Please create a parcel first.</p>
      </div>
    </div>
  `,
  styles: [`
    .stress-page {
      padding: 30px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 40px;
    }

    .header h1 {
      color: #1a2a1a;
      font-size: 32px;
      margin: 0 0 10px 0;
    }

    .header p {
      color: #666;
      font-size: 16px;
      margin: 0;
    }

    .loading, .error-card, .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      border: 1px solid #eee;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .spinner {
      border: 4px solid #f0f0f0;
      border-top: 4px solid #4CAF50;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-card {
      background: #fff5f5;
      border-color: #ff6b6b;
      color: #c92a2a;
    }

    .btn-retry {
      margin-top: 15px;
      padding: 10px 20px;
      background: #ff6b6b;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-retry:hover {
      background: #fa5252;
    }

    .stress-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
    }

    .parcel-selector h2 {
      color: #1a2a1a;
      font-size: 20px;
      margin: 0 0 20px 0;
    }

    .parcel-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
    }

    .parcel-btn {
      padding: 20px;
      background: white;
      border: 2px solid #eee;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
      position: relative;
      overflow: hidden;
    }

    .parcel-btn:hover {
      border-color: #4CAF50;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
    }

    .parcel-btn.active {
      border-color: #4CAF50;
      background: #f0f8f5;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.25);
    }

    .parcel-name {
      display: block;
      font-weight: 600;
      color: #1a2a1a;
      margin-bottom: 5px;
    }

    .parcel-crop {
      display: block;
      font-size: 12px;
      color: #888;
      margin-bottom: 10px;
    }

    .stress-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .stress-badge.high-stress {
      background: #ffe0e0;
      color: #c92a2a;
    }

    .stress-badge.medium-stress {
      background: #fff3c0;
      color: #f59f00;
    }

    .stress-badge.low-stress {
      background: #d3f9d8;
      color: #2b8a3e;
    }

    .loading-badge {
      display: inline-block;
      padding: 6px 12px;
      background: #e7f5ff;
      color: #1971c2;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .analysis-section {
      background: white;
      border-radius: 12px;
      border: 1px solid #eee;
      padding: 30px;
    }

    .analysis-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      gap: 20px;
    }

    .analysis-header h2 {
      color: #1a2a1a;
      font-size: 24px;
      margin: 0;
    }

    .btn-analyze {
      padding: 12px 24px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      transition: all 0.3s ease;
    }

    .btn-analyze:hover:not(:disabled) {
      background: #45a049;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }

    .btn-analyze:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .stress-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .metric-card {
      padding: 20px;
      background: #f9f9f9;
      border-radius: 10px;
      border-left: 4px solid #ddd;
    }

    .metric-card.stress-percentage {
      border-left-color: #4a90e2;
    }

    .metric-card.ndvi {
      border-left-color: #51cf66;
    }

    .metric-card.cloud-coverage {
      border-left-color: #a0aec0;
    }

    .metric-card.pixels {
      border-left-color: #f59f00;
    }

    .metric-card h3 {
      margin: 0 0 15px 0;
      color: #1a2a1a;
      font-size: 16px;
    }

    .metric-value {
      font-size: 32px;
      font-weight: 700;
      color: #1a2a1a;
      margin-bottom: 10px;
    }

    .metric-value.critical {
      color: #c92a2a;
    }

    .metric-bar {
      height: 8px;
      background: #eee;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 10px;
    }

    .progress {
      height: 100%;
      background: linear-gradient(90deg, #51cf66, #ffd43b, #ff6b6b);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .metric-label {
      font-size: 12px;
      color: #666;
      margin: 0;
    }

    .zones-section {
      margin-top: 30px;
      padding-top: 30px;
      border-top: 1px solid #eee;
    }

    .zones-section h3 {
      color: #1a2a1a;
      font-size: 18px;
      margin: 0 0 20px 0;
    }

    .zones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .zone-card {
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #ddd;
    }

    .zone-card.zone-high {
      background: #fff5f5;
      border-left-color: #c92a2a;
    }

    .zone-card.zone-medium {
      background: #fffbf0;
      border-left-color: #f59f00;
    }

    .zone-card.zone-healthy {
      background: #f1fce4;
      border-left-color: #51cf66;
    }

    .zone-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      font-weight: 600;
      color: #1a2a1a;
    }

    .zone-level .icon {
      font-size: 18px;
    }

    .zone-card p {
      margin: 8px 0;
      font-size: 13px;
      color: #555;
    }

    .analysis-info {
      padding: 15px;
      background: #f0f8f5;
      border-radius: 8px;
      border-left: 4px solid #4CAF50;
      font-size: 14px;
      color: #1a2a1a;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .analysis-info strong {
      color: #2b6a3e;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 15px;
    }

    .status-badge.status-completed {
      background: #d3f9d8;
      color: #2b8a3e;
    }

    .status-badge.status-pending,
    .status-badge.status-processing {
      background: #fff3c0;
      color: #f59f00;
    }

    .status-badge.status-failed {
      background: #ffe0e0;
      color: #c92a2a;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      background: #f9f9f9;
      border-radius: 10px;
      color: #666;
    }

    .empty-state {
      background: white;
      border: 1px solid #eee;
      color: #666;
      font-size: 16px;
    }

    @media (max-width: 768px) {
      .stress-page {
        padding: 20px;
      }

      .parcel-grid {
        grid-template-columns: 1fr;
      }

      .analysis-header {
        flex-direction: column;
      }

      .analysis-header h2 {
        font-size: 20px;
      }

      .stress-metrics {
        grid-template-columns: 1fr;
      }

      .analysis-info {
        flex-direction: column;
        gap: 10px;
      }

      .status-badge {
        margin-left: 0;
      }
    }
  `]
})
export class StressComponent implements OnInit {
  parcels: ParcelWithStress[] = [];
  selectedParcel: ParcelWithStress | null = null;
  loading = false;
  analyzing = false;
  error: string | null = null;

  constructor(
    private stressService: StressService,
    private farmService: FarmService
  ) {}

  ngOnInit(): void {
    this.loadParcels();
  }

  loadParcels(): void {
    this.loading = true;
    this.error = null;

    this.farmService.getFarms().subscribe({
      next: (farms: any[]) => {
        // FarmService returns array directly after extracting data
        if (farms && Array.isArray(farms)) {
          this.parcels = farms.map(farm => ({
            id: farm.id,
            name: farm.name,
            crop: farm.crop?.name,
            area: farm.area,
            loading: true,
            analysis: undefined
          }));

          // Load stress data for each parcel
          this.parcels.forEach(parcel => {
            this.stressService.getLatestAnalysis(parcel.id).subscribe({
              next: (analysisResponse: any) => {
                // Handle both wrapped and unwrapped responses
                const analysisData = analysisResponse?.data || analysisResponse;
                if (analysisData) {
                  parcel.analysis = analysisData;
                }
                parcel.loading = false;
              },
              error: () => {
                parcel.loading = false;
                // Silently fail for individual parcels
              }
            });
          });

          this.loading = false;
        } else {
          this.error = 'Invalid response format from server';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load parcels. Please try again.';
        this.loading = false;
      }
    });
  }

  selectParcel(parcel: ParcelWithStress): void {
    this.selectedParcel = parcel;
  }

  triggerNewAnalysis(): void {
    if (!this.selectedParcel) return;

    this.analyzing = true;
    this.stressService.triggerAnalysis(this.selectedParcel.id, 'high').subscribe({
      next: (response: any) => {
        if (response.success) {
          // Poll for completion
          this.stressService.pollJobStatus(response.data.job_id).subscribe({
            next: (jobStatus) => {
              if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
                // Reload analysis
                this.stressService.getLatestAnalysis(this.selectedParcel!.id).subscribe({
                  next: (analysisResponse: AnalysisResponse) => {
                    if (analysisResponse.success && analysisResponse.data) {
                      this.selectedParcel!.analysis = analysisResponse.data;
                    }
                    this.analyzing = false;
                  }
                });
              }
            },
            error: () => {
              this.analyzing = false;
            }
          });
        }
      },
      error: () => {
        this.analyzing = false;
        this.error = 'Failed to trigger analysis. Please try again.';
      }
    });
  }

  getStressPercentage(analysis: StressAnalysis): number {
    return Math.round(analysis.record.stress_percentage);
  }

  getStressedPixelPercentage(analysis: StressAnalysis): number {
    const percentage = (analysis.record.stressed_pixel_count / analysis.record.pixel_count) * 100;
    return Math.round(percentage);
  }

  getStressLabel(stressPercentage: number): string {
    if (stressPercentage >= 70) return '🔴 Critical - Immediate irrigation needed';
    if (stressPercentage >= 40) return '🟡 Moderate - Monitor closely';
    return '🟢 Healthy - Normal conditions';
  }

  getNDVILabel(ndvi: number | undefined): string {
    if (!ndvi) return 'N/A';
    if (ndvi >= 0.7) return 'Excellent vegetation';
    if (ndvi >= 0.5) return 'Good vegetation';
    if (ndvi >= 0.3) return 'Moderate vegetation';
    return 'Poor vegetation';
  }
}
