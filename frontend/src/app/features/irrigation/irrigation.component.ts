import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { IrrigationService } from './services/irrigation.service';
import { ParcelleService, Parcelle } from '../../core/services/parcelle.service';
import { 
  IrrigationRecommendation, 
  IrrigationRecord, 
  IrrigationSchedule,
  CreateScheduleRequest
} from './models/irrigation.model';

@Component({
  selector: 'app-irrigation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="irrigation-page">
      <!-- Header -->
      <div class="page-header">
        <h1>💧 Irrigation Management</h1>
        <p>FAO-56 based water requirement recommendations and real-time irrigation guidance</p>
      </div>

      <!-- Parcel Selection -->
      <div class="card">
        <h2>Select Parcel</h2>
        <div class="parcel-selector">
          <select 
            [(ngModel)]="selectedParcelId"
            (change)="loadRecommendation()"
            class="parcel-dropdown"
            [disabled]="parcelles.length === 0">
            <option value="" disabled selected>-- Choose a parcel --</option>
            <option *ngFor="let parcel of parcelles" [value]="parcel.id">
              {{ parcel.name }} ({{ parcel.surface }} ha)
            </option>
          </select>
          <button (click)="calculateNewRecommendation()" class="btn-secondary" [disabled]="!selectedParcelId">
            🔄 Recalculate
          </button>
        </div>
        <div *ngIf="loadingParcelles" class="loading-message">
          ⏳ Loading parcelles...
        </div>
        <div *ngIf="parcellesError" class="error-message">
          ⚠️ {{ parcellesError }}
        </div>
        <div *ngIf="error$ | async as error" class="error-message">
          ⚠️ {{ error }}
        </div>
      </div>

      <!-- Current Recommendation -->
      <div *ngIf="currentRecommendation$ | async as recommendation" class="card recommendation-card">
        <div class="recommendation-header">
          <h2>Current Recommendation</h2>
          <div class="priority-badge" [class]="'priority-' + recommendation.priority.toLowerCase()">
            {{ recommendation.priority }}
          </div>
        </div>

        <div class="grid-2">
          <!-- Parcel Info -->
          <div class="info-section">
            <h3>Parcel Information</h3>
            <div class="info-row">
              <span class="label">Parcel:</span>
              <span class="value">{{ recommendation.parcel_name }}</span>
            </div>
            <div class="info-row">
              <span class="label">Crop:</span>
              <span class="value">{{ recommendation.crop_name }}</span>
            </div>
            <div class="info-row">
              <span class="label">Area:</span>
              <span class="value">{{ recommendation.area_hectares }} ha</span>
            </div>
          </div>

          <!-- Water Requirements -->
          <div class="info-section">
            <h3>Water Requirements</h3>
            <div class="info-row">
              <span class="label">Amount (mm):</span>
              <span class="value large">{{ recommendation.water_amount_mm | number:'1.1-1' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Volume (m³):</span>
              <span class="value">{{ recommendation.water_volume_m3 | number:'1.1-1' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Duration:</span>
              <span class="value">{{ recommendation.duration_minutes }} min</span>
            </div>
          </div>
        </div>

        <!-- Calculations -->
        <div class="section-divider"></div>
        <div class="calculations-section">
          <h3>Calculation Details</h3>
          <div class="grid-4">
            <div class="calc-item">
              <span class="calc-label">ET₀</span>
              <span class="calc-value">{{ recommendation.calculations.et0 | number:'1.2-2' }} mm</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">Kc</span>
              <span class="calc-value">{{ recommendation.calculations.kc | number:'1.2-2' }}</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">ETc</span>
              <span class="calc-value">{{ recommendation.calculations.etc | number:'1.2-2' }} mm</span>
            </div>
            <div class="calc-item">
              <span class="calc-label">Stress Adj.</span>
              <span class="calc-value">{{ recommendation.calculations.stress_adjustment | number:'1.2-2' }}x</span>
            </div>
          </div>
        </div>

        <!-- Conditions -->
        <div class="section-divider"></div>
        <div class="conditions-section">
          <h3>Current Conditions</h3>
          <div class="grid-3">
            <div class="condition-item">
              <span class="condition-label">Stress</span>
              <div class="condition-bar">
                <div class="stress-indicator" [style.width.%]="recommendation.conditions.stress_percentage"></div>
              </div>
              <span class="condition-value">{{ recommendation.conditions.stress_percentage }}%</span>
            </div>
            <div class="condition-item">
              <span class="condition-label">NDVI</span>
              <span class="condition-value">{{ recommendation.conditions.ndvi | number:'1.2-2' }}</span>
            </div>
            <div class="condition-item">
              <span class="condition-label">Humidity</span>
              <span class="condition-value">{{ recommendation.conditions.humidity }}%</span>
            </div>
            <div class="condition-item">
              <span class="condition-label">Temp</span>
              <span class="condition-value">{{ recommendation.conditions.temperature }}°C</span>
            </div>
            <div class="condition-item">
              <span class="condition-label">Rain (24h)</span>
              <span class="condition-value">{{ recommendation.conditions.rain_forecast_24h }} mm</span>
            </div>
            <div class="condition-item">
              <span class="condition-label">Weather</span>
              <span class="condition-value small">{{ recommendation.conditions.weather_description }}</span>
            </div>
          </div>
        </div>

        <!-- Decision Reasoning -->
        <div class="section-divider"></div>
        <div class="reasoning-section">
          <h3>Decision Reasoning</h3>
          <p class="reasoning-text">{{ recommendation.decision_reason }}</p>
        </div>

        <!-- Recommended Time -->
        <div class="recommended-action">
          <span>Recommended Time:</span>
          <span class="time-badge">{{ recommendation.recommended_time }}</span>
        </div>

        <!-- Schedule Button -->
        <button (click)="scheduleIrrigation(recommendation)" class="btn-large btn-success">
          📅 Schedule This Irrigation
        </button>
      </div>

      <!-- History Section -->
      <div *ngIf="history$ | async as history" class="card history-card">
        <h2>Irrigation History</h2>
        <div *ngIf="history.length === 0" class="empty-state">
          <p>No irrigation records yet</p>
        </div>
        <div *ngIf="history.length > 0" class="history-list">
          <div *ngFor="let record of history" class="history-item">
            <div class="history-date">{{ record.created_at | date:'short' }}</div>
            <div class="history-details">
              <span class="history-amount">{{ record.water_amount }} mm</span>
              <span class="history-duration">{{ record.duration }} min</span>
              <span class="history-priority" [class]="'priority-' + record.priority.toLowerCase()">
                {{ record.priority }}
              </span>
            </div>
            <div class="history-status" [class]="'status-' + record.status.toLowerCase()">
              {{ record.status }}
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule Form -->
      <div class="card schedule-card">
        <h2>Create Custom Schedule</h2>
        <form [formGroup]="scheduleForm" (ngSubmit)="onScheduleSubmit()">
          <div class="form-group">
            <label>Parcel ID</label>
            <input type="number" formControlName="parcel_id" min="1" required>
          </div>
          <div class="form-group">
            <label>Scheduled Time</label>
            <input type="datetime-local" formControlName="scheduled_time" required>
          </div>
          <div class="form-group">
            <label>Water Amount (mm)</label>
            <input type="number" formControlName="water_amount" step="0.1" required>
          </div>
          <div class="form-group">
            <label>Duration (minutes)</label>
            <input type="number" formControlName="duration" required>
          </div>
          <div class="form-group">
            <label>Reason (optional)</label>
            <textarea formControlName="reason" placeholder="Why this schedule?"></textarea>
          </div>
          <button type="submit" class="btn-primary" [disabled]="!scheduleForm.valid">
            Create Schedule
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .irrigation-page {
      padding: 30px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 30px;
    }

    h1 {
      color: #1a2a1a;
      font-size: 28px;
      margin-bottom: 8px;
    }

    .page-header > p {
      color: #666;
      font-size: 14px;
    }

    .card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #eee;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    h2 {
      color: #1a2a1a;
      font-size: 20px;
      margin-bottom: 16px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 12px;
    }

    .parcel-selector {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }

    .parcel-selector select,
    .parcel-selector input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      color: #333;
    }

    .parcel-selector select {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 20px;
      padding-right: 36px;
    }

    .parcel-selector select:disabled {
      background-color: #f5f5f5;
      color: #999;
      cursor: not-allowed;
    }

    .parcel-selector select:focus,
    .parcel-selector input:focus {
      outline: none;
      border-color: #4caf50;
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
    }

    /* Buttons */
    .btn-primary, .btn-secondary, .btn-large, .btn-success {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #4caf50;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #45a049;
    }

    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e0e0e0;
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-large {
      width: 100%;
      padding: 14px;
      font-size: 16px;
      margin-top: 20px;
    }

    .btn-success {
      background: #4caf50;
      color: white;
    }

    .btn-success:hover {
      background: #45a049;
    }

    /* Error Message */
    .error-message {
      background: #fee;
      color: #c33;
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 12px;
      font-size: 14px;
    }

    .loading-message {
      background: #e3f2fd;
      color: #1976d2;
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 12px;
      font-size: 14px;
    }

    /* Recommendation Card */
    .recommendation-card {
      border-left: 4px solid #4caf50;
    }

    .recommendation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .priority-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .priority-low {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .priority-medium {
      background: #fff3e0;
      color: #e65100;
    }

    .priority-high {
      background: #ffebee;
      color: #c62828;
    }

    /* Grid */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 20px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    @media (max-width: 768px) {
      .grid-2, .grid-3 {
        grid-template-columns: 1fr;
      }
      .grid-4 {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Info Section */
    .info-section h3 {
      color: #1a2a1a;
      font-size: 16px;
      margin-bottom: 12px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }

    .info-row .label {
      color: #666;
      font-weight: 500;
    }

    .info-row .value {
      color: #1a2a1a;
      font-weight: 600;
    }

    .info-row .value.large {
      font-size: 20px;
      color: #4caf50;
    }

    /* Section Divider */
    .section-divider {
      height: 1px;
      background: #f0f0f0;
      margin: 20px 0;
    }

    /* Calculations */
    .calculations-section h3,
    .conditions-section h3,
    .reasoning-section h3 {
      color: #1a2a1a;
      font-size: 16px;
      margin-bottom: 16px;
    }

    .calc-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      background: #f9f9f9;
      border-radius: 8px;
      text-align: center;
    }

    .calc-label {
      color: #666;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .calc-value {
      color: #1a2a1a;
      font-size: 16px;
      font-weight: 700;
    }

    /* Conditions */
    .condition-item {
      padding: 12px;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .condition-label {
      display: block;
      color: #666;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .condition-bar {
      width: 100%;
      height: 20px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .stress-indicator {
      height: 100%;
      background: linear-gradient(to right, #4caf50, #ffc107, #f44336);
      transition: width 0.3s;
    }

    .condition-value {
      display: block;
      color: #1a2a1a;
      font-size: 14px;
      font-weight: 700;
    }

    .condition-value.small {
      font-size: 12px;
    }

    /* Reasoning */
    .reasoning-text {
      background: #f9f9f9;
      padding: 12px;
      border-radius: 8px;
      color: #333;
      line-height: 1.6;
    }

    /* Recommended Action */
    .recommended-action {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: #e8f5e9;
      border-radius: 8px;
      margin-bottom: 16px;
      font-weight: 600;
      color: #1a2a1a;
    }

    .time-badge {
      background: #4caf50;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 14px;
    }

    /* History */
    .history-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
    }

    .history-item:last-child {
      border-bottom: none;
    }

    .history-date {
      color: #666;
      min-width: 120px;
    }

    .history-details {
      display: flex;
      gap: 16px;
      flex: 1;
    }

    .history-amount, .history-duration {
      color: #1a2a1a;
      font-weight: 600;
    }

    .history-priority {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-pending {
      color: #f57c00;
    }

    .status-completed {
      color: #2e7d32;
    }

    .status-cancelled {
      color: #c62828;
    }

    /* Form */
    .schedule-card {
      border-left: 4px solid #2196f3;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      color: #1a2a1a;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 6px;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #2196f3;
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }
  `]
})
export class IrrigationComponent implements OnInit, OnDestroy {
  selectedParcelId: number | null = null;
  loading = false;
  loadingParcelles = false;
  parcellesError: string | null = null;
  error: string | null = null;
  parcelles: Parcelle[] = [];
  scheduleForm: FormGroup;

  currentRecommendation$ = this.irrigationService.getCurrentRecommendation();
  history$ = this.irrigationService.getHistory$();
  error$ = this.irrigationService.getError$();

  private destroy$ = new Subject<void>();

  constructor(
    private irrigationService: IrrigationService,
    private parcelleService: ParcelleService,
    private fb: FormBuilder
  ) {
    this.scheduleForm = this.fb.group({
      parcel_id: ['', [Validators.required, Validators.min(1)]],
      scheduled_time: ['', Validators.required],
      water_amount: ['', [Validators.required, Validators.min(0)]],
      duration: ['', [Validators.required, Validators.min(1)]],
      reason: ['']
    });
  }

  ngOnInit(): void {
    // Load list of available parcelles
    this.loadParcelles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load list of available parcelles for the user
   */
  loadParcelles(): void {
    this.loadingParcelles = true;
    this.parcellesError = null;
    this.parcelleService.getParcelles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.parcelles = response.data;
          }
          this.loadingParcelles = false;
        },
        error: (err) => {
          this.parcellesError = err?.error?.message || 'Failed to load parcelles';
          this.loadingParcelles = false;
        }
      });
  }

  loadRecommendation(): void {
    if (!this.selectedParcelId) {
      this.error = 'Please select a parcel from the list';
      return;
    }
    this.loading = true;
    this.irrigationService.getLatestRecommendation(this.selectedParcelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          // Also load history
          this.irrigationService.getHistory(this.selectedParcelId!)
            .pipe(takeUntil(this.destroy$))
            .subscribe();
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Failed to load recommendation';
        }
      });
  }

  calculateNewRecommendation(): void {
    if (!this.selectedParcelId) {
      this.error = 'Please select a parcel from the list';
      return;
    }
    this.loading = true;
    this.irrigationService.calculateIrrigation(this.selectedParcelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Failed to calculate irrigation';
        }
      });
  }

  scheduleIrrigation(recommendation: IrrigationRecommendation): void {
    const scheduleRequest: CreateScheduleRequest = {
      parcel_id: recommendation.parcel_id,
      scheduled_time: new Date(recommendation.recommended_time),
      water_amount: recommendation.water_amount_mm,
      duration: recommendation.duration_minutes,
      reason: `Auto-scheduled from recommendation - ${recommendation.decision_reason}`
    };

    this.loading = true;
    this.irrigationService.scheduleIrrigation(scheduleRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          alert('Irrigation scheduled successfully!');
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Failed to schedule irrigation';
        }
      });
  }

  onScheduleSubmit(): void {
    if (!this.scheduleForm.valid) {
      return;
    }

    const formValue = this.scheduleForm.value;
    const scheduleRequest: CreateScheduleRequest = {
      parcel_id: parseInt(formValue.parcel_id, 10),
      scheduled_time: formValue.scheduled_time,
      water_amount: parseFloat(formValue.water_amount),
      duration: parseInt(formValue.duration, 10),
      reason: formValue.reason || undefined
    };

    this.loading = true;
    this.irrigationService.scheduleIrrigation(scheduleRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.scheduleForm.reset();
          alert('Schedule created successfully!');
          // Reload history if parcel ID is selected
          if (this.selectedParcelId) {
            this.irrigationService.getHistory(this.selectedParcelId)
              .pipe(takeUntil(this.destroy$))
              .subscribe();
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Failed to create schedule';
        }
      });
  }
}
