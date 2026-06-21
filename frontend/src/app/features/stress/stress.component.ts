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
      <!-- Hero Section -->
      <div class="hero">
        <div class="hero-content">
          <div class="hero-icon">⚠️</div>
          <h1>Water Stress Analysis</h1>
          <p>Real‑time satellite monitoring & ML‑based vegetation stress detection</p>
        </div>
      </div>

      <!-- Loading skeleton -->
      @if (loading) {
        <div class="loading-skeleton">
          <div class="skeleton-header"></div>
          <div class="skeleton-cards">
            <div class="skeleton-card" *ngFor="let _ of [1,2,3]"></div>
          </div>
        </div>
      }

      <!-- Error state -->
      @if (error) {
        <div class="error-card">
          <div class="error-icon">❌</div>
          <p>{{ error }}</p>
          <button (click)="loadParcels()" class="btn-retry">Retry</button>
        </div>
      }

      <!-- Main content -->
      @if (!loading && parcels.length > 0) {
        <div class="stress-container">
          <!-- Parcel selector -->
          <div class="parcel-selector">
            <h2>
              <span class="field-icon">🌾</span>
              Select a field (Parcelle)
            </h2>
            <div class="parcel-grid">
              @for (parcel of parcels; track parcel.id) {
                <button 
                  (click)="selectParcel(parcel)"
                  [class.active]="selectedParcel?.id === parcel.id"
                  [class.loading]="parcel.loading"
                  class="parcel-card">
                  <div class="parcel-icon">
                    {{ parcel.crop === 'Olive' ? '🫒' : parcel.crop === 'Wheat' ? '🌾' : '🌱' }}
                  </div>
                  <div class="parcel-info">
                    <div class="parcel-name">{{ parcel.name }}</div>
                    <div class="parcel-crop">{{ parcel.crop || 'No crop' }}</div>
                  </div>
                  @if (parcel.loading) {
                    <div class="loading-spinner-small"></div>
                  } @else if (parcel.analysis) {
                    <div class="stress-chip" 
                         [class.high]="getStressPercentage(parcel.analysis) > 70"
                         [class.medium]="getStressPercentage(parcel.analysis) > 40 && getStressPercentage(parcel.analysis) <= 70"
                         [class.low]="getStressPercentage(parcel.analysis) <= 40">
                      {{ getStressPercentage(parcel.analysis) }}% stress
                    </div>
                  } @else {
                    <div class="no-data-chip">No data</div>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Selected parcel detailed analysis -->
          @if (selectedParcel) {
            <div class="analysis-panel">
              <div class="panel-header">
                <div class="title-section">
                  <h2>{{ selectedParcel.name }}</h2>
                  <span class="crop-badge">{{ selectedParcel.crop || 'Unspecified crop' }}</span>
                </div>
                <button 
                  (click)="triggerNewAnalysis()" 
                  [disabled]="analyzing" 
                  class="btn-analyze">
                  @if (analyzing) {
                    <span class="btn-spinner"></span>
                    <span>Analyzing...</span>
                  } @else {
                    <span>🔄 Trigger new analysis</span>
                  }
                </button>
              </div>

              @if (selectedParcel.analysis) {
                <!-- KPI Metrics Row -->
                <div class="metrics-grid">
                  <!-- Stress Index -->
                  <div class="metric-card stress">
                    <div class="metric-icon">💧</div>
                    <div class="metric-content">
                      <div class="metric-title">Vegetation Stress Index</div>
                      <div class="metric-value" [class.critical]="getStressPercentage(selectedParcel.analysis) > 70">
                        {{ getStressPercentage(selectedParcel.analysis) }}%
                      </div>
                      <div class="progress-bar">
                        <div class="progress-fill" 
                             [style.width.%]="getStressPercentage(selectedParcel.analysis)"
                             [class.high]="getStressPercentage(selectedParcel.analysis) > 70"
                             [class.medium]="getStressPercentage(selectedParcel.analysis) > 40 && getStressPercentage(selectedParcel.analysis) <= 70"
                             [class.low]="getStressPercentage(selectedParcel.analysis) <= 40">
                        </div>
                      </div>
                      <div class="metric-footnote">{{ getStressLabel(getStressPercentage(selectedParcel.analysis)) }}</div>
                    </div>
                  </div>

                  <!-- NDVI -->
                  <div class="metric-card ndvi">
                    <div class="metric-icon">🌿</div>
                    <div class="metric-content">
                      <div class="metric-title">NDVI (Vegetation Health)</div>
                      <div class="metric-value">{{ selectedParcel.analysis.record.mean_ndvi | number:'1.2-2' }}</div>
                      <div class="ndvi-indicator" [style.background]="getNDVIColor(selectedParcel.analysis.record.mean_ndvi)"></div>
                      <div class="metric-footnote">{{ getNDVILabel(selectedParcel.analysis.record.mean_ndvi) }}</div>
                    </div>
                  </div>

                  <!-- Cloud Coverage -->
                  <div class="metric-card cloud">
                    <div class="metric-icon">☁️</div>
                    <div class="metric-content">
                      <div class="metric-title">Cloud coverage</div>
                      <div class="metric-value">{{ selectedParcel.analysis.record.cloud_coverage }}%</div>
                      <div class="progress-bar">
                        <div class="progress-fill" 
                             [style.width.%]="selectedParcel.analysis.record.cloud_coverage"
                             style="background: #a0aec0"></div>
                      </div>
                    </div>
                  </div>

                  <!-- Stressed pixels -->
                  <div class="metric-card pixels">
                    <div class="metric-icon">📊</div>
                    <div class="metric-content">
                      <div class="metric-title">Stressed pixels</div>
                      <div class="metric-value">{{ getStressedPixelPercentage(selectedParcel.analysis) }}%</div>
                      <div class="metric-footnote">
                        {{ selectedParcel.analysis.record.stressed_pixel_count }} / {{ selectedParcel.analysis.record.pixel_count }} pixels
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Stress zones summary -->
                @if (selectedParcel.analysis.summary && selectedParcel.analysis.summary.length) {
                  <div class="zones-section">
                    <h3>📌 Stress zone breakdown</h3>
                    <div class="zones-grid">
                      @for (zone of selectedParcel.analysis.summary; track zone.stress_level) {
                        <div class="zone-card" 
                             [class.zone-high]="zone.stress_level === 'high'"
                             [class.zone-medium]="zone.stress_level === 'medium'"
                             [class.zone-healthy]="zone.stress_level === 'healthy'">
                          <div class="zone-header">
                            <span class="zone-icon">
                              {{ zone.stress_level === 'high' ? '🔴' : zone.stress_level === 'medium' ? '🟡' : '🟢' }}
                            </span>
                            <span class="zone-name">{{ zone.stress_level | titlecase }}</span>
                          </div>
                          <div class="zone-stats">
                            <span>📦 {{ zone.zone_count }} zones</span>
                            <span>📐 {{ zone.total_area.toFixed(0) }} m²</span>
                            <span>🌿 NDVI {{ zone.avg_ndvi.toFixed(2) }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Footer info -->
                <div class="analysis-footer">
                  <div class="timestamp">
                    📅 Last analysis: <strong>{{ selectedParcel.analysis.record.imagery_date | date:'medium' }}</strong>
                  </div>
                  <div class="status-badge" [class.completed]="selectedParcel.analysis.record.status === 'completed'"
                       [class.processing]="selectedParcel.analysis.record.status === 'processing' || selectedParcel.analysis.record.status === 'pending'"
                       [class.failed]="selectedParcel.analysis.record.status === 'failed'">
                    {{ selectedParcel.analysis.record.status | titlecase }}
                    @if (selectedParcel.analysis.record.status === 'processing') {
                      <span class="pulse"></span>
                    }
                  </div>
                </div>
              } @else {
                <div class="no-data-panel">
                  <div class="no-data-icon">🌾</div>
                  <h3>No stress analysis yet</h3>
                  <p>Click the button above to run your first AI‑powered water stress analysis.</p>
                  <button (click)="triggerNewAnalysis()" class="btn-analyze primary">🚀 Start analysis</button>
                </div>
              }
            </div>
          }
        </div>
      }

      @if (!loading && parcels.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🗺️</div>
          <h3>No fields found</h3>
          <p>Please create a parcel first to start monitoring water stress.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Base & fonts */
    .stress-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      min-height: 100vh;
    }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, #1e3a2f 0%, #2d5a3b 100%);
      border-radius: 2rem;
      margin-bottom: 2.5rem;
      padding: 2rem;
      color: white;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
    }
    .hero-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .hero-icon {
      font-size: 3rem;
      background: rgba(255,255,255,0.2);
      width: 70px;
      height: 70px;
      border-radius: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
    .hero h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 600;
    }
    .hero p {
      margin: 0.25rem 0 0;
      opacity: 0.9;
      font-size: 0.95rem;
    }

    /* Skeleton */
    .loading-skeleton {
      background: white;
      border-radius: 1.5rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .skeleton-header {
      height: 28px;
      width: 200px;
      background: #e2e8f0;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      animation: pulse 1.5s infinite;
    }
    .skeleton-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px,1fr));
      gap: 1rem;
    }
    .skeleton-card {
      height: 100px;
      background: #e2e8f0;
      border-radius: 1rem;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%,100% { opacity: 0.6; }
      50% { opacity: 1; }
    }

    /* Error & empty */
    .error-card {
      background: #fff1f0;
      border-radius: 1.5rem;
      padding: 2rem;
      text-align: center;
      border: 1px solid #fecaca;
    }
    .error-icon { font-size: 2.5rem; margin-bottom: 1rem; }
    .btn-retry {
      background: #ef4444;
      color: white;
      border: none;
      padding: 0.5rem 1.5rem;
      border-radius: 2rem;
      font-weight: 500;
      margin-top: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-retry:hover { background: #dc2626; transform: scale(0.98); }

    /* Parcels grid */
    .parcel-selector h2 {
      font-size: 1.4rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .field-icon { font-size: 1.6rem; }
    .parcel-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .parcel-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 1.2rem;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.25s ease;
      text-align: left;
      width: 100%;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .parcel-card:hover {
      transform: translateY(-2px);
      border-color: #86efac;
      box-shadow: 0 8px 20px -6px rgba(34,197,94,0.2);
    }
    .parcel-card.active {
      border-color: #22c55e;
      background: #f0fdf4;
      box-shadow: 0 4px 12px rgba(34,197,94,0.15);
    }
    .parcel-icon {
      font-size: 2rem;
      background: #f1f5f9;
      width: 48px;
      height: 48px;
      border-radius: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .parcel-info {
      flex: 1;
    }
    .parcel-name {
      font-weight: 700;
      color: #0f172a;
    }
    .parcel-crop {
      font-size: 0.75rem;
      color: #475569;
    }
    .stress-chip, .no-data-chip {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: 40px;
      background: #f1f5f9;
    }
    .stress-chip.high { background: #fee2e2; color: #b91c1c; }
    .stress-chip.medium { background: #fef9c3; color: #b45309; }
    .stress-chip.low { background: #dcfce7; color: #15803d; }
    .loading-spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid #e2e8f0;
      border-top-color: #22c55e;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Analysis panel */
    .analysis-panel {
      background: white;
      border-radius: 1.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      padding: 1.8rem;
      margin-top: 0.5rem;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.8rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #eef2ff;
    }
    .title-section {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .title-section h2 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 700;
      color: #0f172a;
    }
    .crop-badge {
      background: #e6f0ea;
      padding: 0.2rem 0.8rem;
      border-radius: 40px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #2d5a3b;
    }
    .btn-analyze {
      background: #22c55e;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 2rem;
      font-weight: 600;
      font-size: 0.85rem;
      color: white;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-analyze:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .btn-analyze:not(:disabled):hover {
      background: #16a34a;
      transform: scale(0.98);
    }
    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid white;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    /* Metrics grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.2rem;
      margin-bottom: 2rem;
    }
    .metric-card {
      background: #f9fafb;
      border-radius: 1.2rem;
      padding: 1.2rem;
      display: flex;
      gap: 1rem;
      transition: all 0.2s;
      border: 1px solid #edf2f7;
    }
    .metric-icon {
      font-size: 2rem;
    }
    .metric-content {
      flex: 1;
    }
    .metric-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: #475569;
      margin-bottom: 0.3rem;
    }
    .metric-value {
      font-size: 1.8rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }
    .metric-value.critical { color: #dc2626; }
    .progress-bar {
      background: #e2e8f0;
      border-radius: 40px;
      height: 6px;
      margin: 0.6rem 0 0.4rem;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 40px;
      transition: width 0.3s ease;
      background: #22c55e;
    }
    .progress-fill.high { background: #ef4444; }
    .progress-fill.medium { background: #f97316; }
    .progress-fill.low { background: #22c55e; }
    .metric-footnote {
      font-size: 0.7rem;
      color: #475569;
      margin-top: 0.25rem;
    }
    .ndvi-indicator {
      width: 100%;
      height: 8px;
      border-radius: 4px;
      margin: 0.5rem 0 0.2rem;
    }

    /* Zones */
    .zones-section {
      margin: 1.8rem 0;
    }
    .zones-section h3 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    .zones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
      gap: 0.8rem;
    }
    .zone-card {
      border-radius: 1rem;
      padding: 0.8rem 1rem;
      background: #f8fafc;
      border-left: 5px solid #cbd5e1;
    }
    .zone-card.zone-high { border-left-color: #dc2626; background: #fef2f2; }
    .zone-card.zone-medium { border-left-color: #f97316; background: #fff7ed; }
    .zone-card.zone-healthy { border-left-color: #22c55e; background: #f0fdf4; }
    .zone-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .zone-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;
      font-size: 0.75rem;
      color: #334155;
    }

    /* Footer */
    .analysis-footer {
      margin-top: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eef2ff;
      font-size: 0.8rem;
    }
    .status-badge {
      padding: 0.2rem 0.8rem;
      border-radius: 40px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .status-badge.completed { background: #dcfce7; color: #15803d; }
    .status-badge.processing { background: #fef9c3; color: #a16207; }
    .status-badge.failed { background: #fee2e2; color: #b91c1c; }
    .pulse {
      width: 8px;
      height: 8px;
      background: currentColor;
      border-radius: 50%;
      display: inline-block;
      animation: pulse-anim 1s infinite;
    }
    @keyframes pulse-anim {
      0% { opacity: 0.4; transform: scale(0.8);}
      100% { opacity: 1; transform: scale(1.2);}
    }

    /* No data panel */
    .no-data-panel, .empty-state {
      text-align: center;
      padding: 2.5rem;
      background: #fafcff;
      border-radius: 1.5rem;
    }
    .no-data-icon, .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .btn-analyze.primary {
      background: #22c55e;
      margin-top: 1rem;
    }

    /* Responsive */
    @media (max-width: 680px) {
      .stress-page { padding: 1rem; }
      .hero { padding: 1.2rem; }
      .hero h1 { font-size: 1.3rem; }
      .panel-header { flex-direction: column; align-items: stretch; }
      .metrics-grid { grid-template-columns: 1fr; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
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
        if (farms && Array.isArray(farms)) {
          this.parcels = farms.map(farm => ({
            id: farm.id,
            name: farm.name,
            crop: farm.crop?.name,
            area: farm.area,
            loading: true,
            analysis: undefined
          }));

          this.parcels.forEach(parcel => {
            this.stressService.getLatestAnalysis(parcel.id).subscribe({
              next: (analysisResponse: any) => {
                const analysisData = analysisResponse?.data || analysisResponse;
                if (analysisData) {
                  parcel.analysis = analysisData;
                }
                parcel.loading = false;
              },
              error: () => {
                parcel.loading = false;
              }
            });
          });

          this.loading = false;
        } else {
          this.error = 'Invalid response format from server';
          this.loading = false;
        }
      },
      error: () => {
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
          this.stressService.pollJobStatus(response.data.job_id).subscribe({
            next: (jobStatus) => {
              if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
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
    if (stressPercentage >= 70) return '🔴 Critical – immediate irrigation needed';
    if (stressPercentage >= 40) return '🟡 Moderate – monitor closely';
    return '🟢 Healthy – normal conditions';
  }

  getNDVILabel(ndvi: number | undefined): string {
    if (!ndvi) return 'N/A';
    if (ndvi >= 0.7) return 'Excellent vegetation';
    if (ndvi >= 0.5) return 'Good vegetation';
    if (ndvi >= 0.3) return 'Moderate vegetation';
    return 'Poor vegetation';
  }

  getNDVIColor(ndvi: number | undefined): string {
    if (!ndvi) return '#cbd5e1';
    if (ndvi >= 0.7) return '#22c55e';
    if (ndvi >= 0.5) return '#84cc16';
    if (ndvi >= 0.3) return '#facc15';
    return '#ef4444';
  }
}