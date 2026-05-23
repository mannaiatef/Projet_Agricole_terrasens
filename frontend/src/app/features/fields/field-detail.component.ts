import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FieldService, Field } from '../../core/services/field.service';

@Component({
  selector: 'app-field-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="field-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <button mat-icon-button (click)="goBack()" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-text">
            <h1 *ngIf="field">🌾 Field {{ field.field_code }}</h1>
            <p *ngIf="field" class="field-info">
              {{ field.name }} • {{ field.crop_type }} • Area: {{ field.area }}ha
            </p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading field dashboard...</p>
      </div>

      <!-- Error Message -->
      <div *ngIf="error && !loading" class="error-message">
        <mat-icon>error</mat-icon>
        <p>{{ error }}</p>
        <button mat-raised-button color="warn" (click)="refresh()">Retry</button>
      </div>

      <!-- Main Content -->
      <div *ngIf="field && !loading" class="content">
        
        <!-- Top Row: Irrigation & Satellite -->
        <div class="grid-container">
          
          <!-- LEFT: Irrigation Management -->
          <mat-card class="section irrigation-section">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>water_drop</mat-icon> Irrigation Management
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <!-- FAO-56 Calculations -->
              <div *ngIf="field.irrigation" class="fao56-calculator">
                <h3>FAO-56 Water Calculator</h3>
                
                <div class="calc-item">
                  <span class="label">Reference ET₀</span>
                  <span class="value">{{ field.irrigation.et0 | number:'1.2-2' }} mm/day</span>
                  <span class="description">Reference evapotranspiration</span>
                </div>

                <div class="calc-item">
                  <span class="label">Crop Coefficient (Kc)</span>
                  <span class="value">{{ field.irrigation.kc | number:'1.2-2' }}</span>
                  <span class="description">{{ field.stage || 'Crop stage' }}</span>
                </div>

                <div class="calc-item highlight">
                  <span class="label">Net Requirement (ETc)</span>
                  <span class="value" [style.color]="getStressColor(field.water_stress_level)">
                    {{ field.irrigation.etc | number:'1.2-2' }} mm/day
                  </span>
                  <span class="description">Actual crop water need</span>
                </div>
              </div>

              <!-- Soil Moisture -->
              <div class="soil-moisture">
                <h3>Soil Condition</h3>
                <div class="moisture-item">
                  <span>Soil Moisture: {{ field.soil_moisture_current || 'N/A' }}%</span>
                  <mat-progress-bar mode="determinate" 
                    [value]="field.soil_moisture_current || 0"
                    [color]="field.soil_moisture_status === 'Low' ? 'warn' : 'accent'">
                  </mat-progress-bar>
                  <span class="status-badge"
                    [ngClass]="'status-' + (field.soil_moisture_status || 'unknown') | lowercase">
                    {{ field.soil_moisture_status || 'Unknown' }}
                  </span>
                </div>
              </div>

              <!-- Irrigation Status & Actions -->
              <div class="irrigation-actions">
                <h3>Irrigation Actions</h3>
                <div class="status-info">
                  <p><strong>Status:</strong> 
                    <span [ngClass]="'status-' + field.irrigation_status">
                      {{ field.irrigation_status | uppercase }}
                    </span>
                  </p>
                  <p *ngIf="field.irrigation_scheduled_time">
                    <strong>Scheduled:</strong> {{ field.irrigation_scheduled_time }}
                  </p>
                  <p *ngIf="field.last_irrigation_date">
                    <strong>Last Irrigation:</strong> {{ field.last_irrigation_date | date:'short' }}
                  </p>
                </div>

                <!-- Action Buttons -->
                <div class="button-group">
                  <button mat-raised-button color="primary"
                    (click)="irrigateNow()"
                    [disabled]="irrigating"
                    class="irrigate-now-btn">
                    <mat-icon *ngIf="!irrigating">water_drop</mat-icon>
                    <mat-spinner *ngIf="irrigating" diameter="20"></mat-spinner>
                    {{ irrigating ? 'Irrigating...' : 'Irrigate Now' }}
                  </button>

                  <button mat-stroked-button color="accent"
                    (click)="syncField()"
                    [disabled]="syncing">
                    <mat-icon *ngIf="!syncing">sync</mat-icon>
                    <mat-progress-spinner *ngIf="syncing" diameter="20" mode="indeterminate"></mat-progress-spinner>
                    {{ syncing ? 'Syncing...' : 'Sync Data' }}
                  </button>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- RIGHT: Satellite Monitoring -->
          <mat-card class="section satellite-section">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>satellite</mat-icon> Satellite Monitoring
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <!-- Last Update -->
              <div class="update-info">
                <p>Last Update: 
                  <strong>{{ field.satellite?.processing_date | date:'short' }}</strong>
                </p>
                <mat-chip-set aria-label="Data freshness">
                  <mat-chip 
                    [style.backgroundColor]="getFreshnessColor(field.data_freshness)"
                    class="freshness-chip">
                    <mat-icon>{{ getFreshnessIcon(field.data_freshness) }}</mat-icon>
                    {{ field.data_freshness | uppercase }}
                  </mat-chip>
                </mat-chip-set>
              </div>

              <!-- Vegetation Index (NDVI) -->
              <div *ngIf="field.satellite" class="vegetation-section">
                <h3>Vegetation Index (NDVI)</h3>
                
                <div class="ndvi-display">
                  <div class="ndvi-value">
                    <span class="number">{{ field.satellite.ndvi | number:'1.2-2' }}</span>
                    <div class="ndvi-bar">
                      <div class="ndvi-fill" [style.width.%]="(field.satellite.ndvi + 1) * 50"></div>
                    </div>
                  </div>

                  <!-- NDVI Interpretation -->
                  <div class="ndvi-text">
                    <p class="interpretation">
                      <span *ngIf="field.satellite.ndvi > 0.6">✅ Excellent vegetation health</span>
                      <span *ngIf="field.satellite.ndvi > 0.5 && field.satellite.ndvi <= 0.6">👍 Good vegetation health</span>
                      <span *ngIf="field.satellite.ndvi > 0.3 && field.satellite.ndvi <= 0.5">⚠️ Moderate vegetation health</span>
                      <span *ngIf="field.satellite.ndvi <= 0.3">🔴 Poor vegetation health</span>
                    </p>
                  </div>
                </div>

                <!-- NDVI Trend -->
                <div *ngIf="field.ndvi_trend" class="ndvi-trend">
                  <h4>5-Day Trend
                    <span class="trend-icon">{{ ndviTrendMap[field.ndvi_trend.trend || 'stable'] }}</span>
                  </h4>
                  <div class="trend-data">
                    <p>Current: {{ field.ndvi_trend.current | number:'1.2-2' }}</p>
                    <p *ngIf="field.ndvi_trend.previous">
                      Previous: {{ field.ndvi_trend.previous | number:'1.2-2' }}
                    </p>
                    <p class="trend-label">
                      Status: <strong>{{ field.ndvi_trend.trend | titlecase }}</strong>
                    </p>
                    <p>Observations: {{ field.ndvi_trend.historical_observations }}</p>
                  </div>
                </div>
              </div>

              <!-- Temperature & Clouds -->
              <div *ngIf="field.satellite" class="conditions">
                <h3>Satellite Conditions</h3>
                <div class="condition-item">
                  <p>LST (Surface Temp): 
                    <strong>{{ field.satellite.lst ? (field.satellite.lst | number:'1.1-1') + ' K' : 'N/A' }}</strong>
                  </p>
                </div>
                <div class="condition-item">
                  <p>Cloud Coverage: 
                    <strong>{{ field.satellite.cloud_coverage | number:'1.1-1' }}%</strong>
                  </p>
                  <mat-progress-bar mode="determinate" [value]="field.satellite.cloud_coverage"></mat-progress-bar>
                  <span *ngIf="field.satellite.cloud_coverage > 80" class="warning">
                    ⚠️ High clouds - data unreliable
                  </span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Bottom Row: Stress & Alerts -->
        <div class="grid-container">
          
          <!-- Stress Detection -->
          <mat-card class="section stress-section">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>warning</mat-icon> Water Stress Analysis
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <div *ngIf="field.stress" class="stress-info">
                <!-- Stress Level Gauge -->
                <div class="stress-gauge">
                  <div class="gauge-label">Stress Level</div>
                  <div class="gauge-value"
                    [style.color]="getStressColor(field.stress.water_stress_level)">
                    {{ field.stress.water_stress_level | uppercase }}
                  </div>
                  <div class="gauge-score">
                    <span class="score">{{ field.stress.water_stress_score | number:'1.1-1' }}/100</span>
                    <mat-progress-bar mode="determinate" 
                      [value]="field.stress.water_stress_score"
                      [color]="field.stress.water_stress_score > 75 ? 'warn' : 'accent'">
                    </mat-progress-bar>
                  </div>
                </div>

                <!-- Stress Details -->
                <div class="stress-details">
                  <div class="detail-item">
                    <span class="label">Detection Method:</span>
                    <span class="value">{{ field.stress.detection_method }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Confidence:</span>
                    <span class="value">{{ field.stress.confidence | number:'1.1-1' }}%</span>
                  </div>
                  <div class="detail-item" *ngIf="field.stress.thermal_stress_level !== 'none'">
                    <span class="label">Thermal Stress:</span>
                    <span class="value">{{ field.stress.thermal_stress_level | uppercase }}</span>
                  </div>
                </div>

                <!-- Recommended Action -->
                <div class="recommended-action">
                  <h4>💡 Recommendation</h4>
                  <p class="action-text">{{ field.stress.recommended_action }}</p>
                </div>
              </div>

              <div *ngIf="!field.stress" class="no-data">
                <p>No stress analysis available yet. Sync field data to generate analysis.</p>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Alerts & Recommendations -->
          <mat-card class="section alerts-section">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>notifications</mat-icon> Alerts & Actions
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <!-- Unified Recommendation -->
              <div class="main-recommendation">
                <h3>📌 Main Action</h3>
                <p class="recommendation-text">{{ field.recommended_action || 'No recommendations at this time' }}</p>
              </div>

              <!-- Alerts List -->
              <div class="alerts-list">
                <h3>🚨 Alerts ({{ field.alerts ? field.alerts.length : 0 }})</h3>
                <div *ngIf="field.alerts && field.alerts.length > 0">
                  <div *ngFor="let alert of field.alerts" class="alert-item">
                    <div class="alert-icon">
                      <span *ngIf="alert.includes('✅')">✅</span>
                      <span *ngIf="alert.includes('⚠️')">⚠️</span>
                      <span *ngIf="alert.includes('🔴')">🔴</span>
                      <span *ngIf="alert.includes('💧')">💧</span>
                      <span *ngIf="alert.includes('📉')">📉</span>
                      <span *ngIf="alert.includes('☁️')">☁️</span>
                      <span *ngIf="alert.includes('🔥')">🔥</span>
                      <span *ngIf="alert.includes('⏰')">⏰</span>
                      <span *ngIf="alert.includes('📡')">📡</span>
                    </div>
                    <span class="alert-text">{{ alert }}</span>
                  </div>
                </div>
                <div *ngIf="!field.alerts || field.alerts.length === 0" class="no-alerts">
                  <p>✅ No critical alerts</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Footer: Metadata -->
        <mat-card class="metadata">
          <mat-card-content>
            <p><strong>Field ID:</strong> {{ field.id }}</p>
            <p><strong>Coordinates:</strong> {{ field.latitude | number:'1.4-4' }}, {{ field.longitude | number:'1.4-4' }}</p>
            <p><strong>Last Updated:</strong> {{ field.last_updated | date:'medium' }}</p>
            <p><strong>Created:</strong> {{ field.created_at | date:'medium' }}</p>
          </mat-card-content>
        </mat-card>

      </div>
    </div>
  `,
  styles: [`
    .field-dashboard {
      padding: 30px;
      background: #fafbfa;
      min-height: 100vh;
    }

    .dashboard-header {
      margin-bottom: 32px;
      background: white;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #f0f2f0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      color: #1a2a1a;
      flex-shrink: 0;
    }

    .header-text h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a2a1a;
      margin: 0 0 8px;
    }

    .field-info {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 60px 20px;
      color: #6b7280;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 8px;
      color: #c62828;
      margin: 20px 0;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .grid-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    mat-card {
      background: white;
      border: 1px solid #f0f2f0;
    }

    mat-card-header {
      padding: 20px;
      border-bottom: 1px solid #f0f2f0;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      color: #1a2a1a;
      margin: 0;
    }

    mat-card-content {
      padding: 20px;
    }

    .fao56-calculator, .soil-moisture, .irrigation-actions,
    .vegetation-section, .conditions, .stress-info, .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 12px;
    }

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1a2a1a;
      margin: 0;
    }

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: #1a2a1a;
      margin: 0;
    }

    .calc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #fafbfa;
      border-radius: 8px;
    }

    .calc-item.highlight {
      background: #f0f7f0;
      border-left: 3px solid #4caf50;
    }

    .label {
      font-weight: 600;
      color: #6b7280;
      font-size: 13px;
    }

    .value {
      font-weight: 700;
      color: #1a2a1a;
      font-size: 16px;
    }

    .description {
      font-size: 12px;
      color: #9ca3af;
    }

    .moisture-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
      width: fit-content;
    }

    .status-low { background: #fee; color: #c62828; }
    .status-moderate { background: #fffbeb; color: #92400e; }
    .status-high { background: #f0f7f0; color: #047857; }

    .status-active { color: #22c55e; }
    .status-scheduled { color: #f59e0b; }
    .status-inactive { color: #9ca3af; }

    .button-group {
      display: flex;
      gap: 12px;
    }

    .irrigate-now-btn {
      flex: 1;
    }

    .update-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #fafbfa;
      border-radius: 8px;
    }

    .update-info p {
      margin: 0;
      font-size: 13px;
    }

    .freshness-chip {
      color: white !important;
    }

    .ndvi-display {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: #fafbfa;
      border-radius: 8px;
    }

    .ndvi-value {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .ndvi-value .number {
      font-size: 32px;
      font-weight: 700;
      color: #1a2a1a;
      min-width: 60px;
    }

    .ndvi-bar {
      flex: 1;
      height: 30px;
      background: #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }

    .ndvi-fill {
      height: 100%;
      background: linear-gradient(90deg, #ef4444, #f59e0b, #22c55e);
      transition: width 0.3s ease;
    }

    .interpretation {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #1a2a1a;
    }

    .ndvi-trend {
      padding: 12px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }

    .trend-icon {
      margin-left: 8px;
    }

    .trend-data {
      margin-top: 8px;
      font-size: 13px;
      color: #6b7280;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .trend-label {
      font-weight: 600;
      color: #1a2a1a;
    }

    .condition-item {
      padding: 12px;
      background: #fafbfa;
      border-radius: 8px;
    }

    .condition-item p {
      margin: 0 0 8px;
      font-size: 13px;
    }

    .warning {
      display: block;
      margin-top: 8px;
      color: #f59e0b;
      font-size: 12px;
      font-weight: 600;
    }

    .stress-gauge {
      text-align: center;
      padding: 16px;
      background: #fafbfa;
      border-radius: 8px;
    }

    .gauge-label {
      font-size: 12px;
      color: #9ca3af;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .gauge-value {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .gauge-score {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .score {
      font-weight: 700;
      color: #1a2a1a;
      min-width: 60px;
    }

    .stress-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
    }

    .detail-item .label {
      font-weight: 600;
      color: #6b7280;
    }

    .detail-item .value {
      font-weight: 600;
      color: #1a2a1a;
    }

    .recommended-action {
      padding: 12px;
      background: #f0f7f0;
      border-left: 3px solid #4caf50;
      border-radius: 6px;
    }

    .action-text {
      margin: 8px 0 0;
      color: #047857;
      font-size: 13px;
      line-height: 1.5;
    }

    .main-recommendation {
      padding: 16px;
      background: #f0f7f0;
      border-radius: 8px;
      border-left: 4px solid #4caf50;
    }

    .recommendation-text {
      margin: 8px 0 0;
      color: #047857;
      font-size: 13px;
      line-height: 1.6;
    }

    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: #fafbfa;
      border-radius: 6px;
    }

    .alert-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .alert-text {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }

    .no-alerts {
      padding: 16px;
      background: #f0f7f0;
      border-radius: 6px;
      color: #047857;
      text-align: center;
    }

    .no-data {
      padding: 20px;
      text-align: center;
      color: #9ca3af;
    }

    .metadata {
      margin-top: 24px;
      border-top: 1px solid #e5e7eb;
    }

    .metadata mat-card-content {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .metadata p {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }

    .metadata strong {
      color: #1a2a1a;
    }

    @media (max-width: 1024px) {
      .grid-container {
        grid-template-columns: 1fr;
      }

      .metadata mat-card-content {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .field-dashboard {
        padding: 16px;
      }

      .dashboard-header {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-text h1 {
        font-size: 22px;
      }

      .button-group {
        flex-direction: column;
      }
    }
  `]
})
export class FieldDetailComponent implements OnInit {
  field: Field | null = null;
  loading = false;
  error: string | null = null;
  irrigating = false;
  syncing = false;

  ndviTrendMap: { [key: string]: string } = {
    improving: '📈',
    declining: '📉',
    stable: '⏸️'
  };

  constructor(
    private fieldService: FieldService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadField();
  }

  private loadField(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No field ID provided';
      return;
    }

    this.loading = true;
    this.fieldService.getFieldById(parseInt(id)).subscribe({
      next: (response) => {
        this.field = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load field. Please try again.';
        this.loading = false;
        console.error('Error loading field:', err);
      }
    });
  }

  refresh(): void {
    this.loadField();
  }

  irrigateNow(): void {
    if (!this.field) return;
    
    this.irrigating = true;
    this.fieldService.irrigateField(this.field.id).subscribe({
      next: (response) => {
        this.field = response.data;
        this.irrigating = false;
      },
      error: (err) => {
        this.irrigating = false;
        console.error('Error irrigating field:', err);
      }
    });
  }

  syncField(): void {
    if (!this.field) return;
    
    this.syncing = true;
    this.fieldService.syncField(this.field.id).subscribe({
      next: (response) => {
        this.field = response.data;
        this.syncing = false;
      },
      error: (err) => {
        this.syncing = false;
        console.error('Error syncing field:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/fields']);
  }

  getStressColor(stressLevel: string | undefined): string {
    const level = (stressLevel || 'none').toLowerCase();
    if (level === 'high') return '#ef4444';
    if (level === 'moderate') return '#f59e0b';
    if (level === 'low') return '#22c55e';
    return '#9ca3af';
  }

  getFreshnessColor(freshness: string | undefined): string {
    const f = (freshness || 'old').toLowerCase();
    if (f === 'fresh') return '#22c55e';
    if (f === 'recent') return '#84cc16';
    if (f === 'outdated') return '#f59e0b';
    return '#ef4444';
  }

  getFreshnessIcon(freshness: string | undefined): string {
    const f = (freshness || 'old').toLowerCase();
    if (f === 'fresh') return 'check_circle';
    if (f === 'recent') return 'info';
    if (f === 'outdated') return 'warning';
    return 'error';
  }
}
