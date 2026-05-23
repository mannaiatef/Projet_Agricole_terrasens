import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { IrrigationService } from '../services/irrigation.service';
import {
  IrrigationRecommendation,
  IrrigationRecord,
} from '../models/irrigation.model';
import { IrrigationRecommendationComponent } from './irrigation-recommendation.component';
import { IrrigationScheduleComponent } from './irrigation-schedule.component';
import { IrrigationHistoryComponent } from './irrigation-history.component';
import { IrrigationAlertComponent } from './irrigation-alert.component';

@Component({
  selector: 'app-irrigation-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IrrigationRecommendationComponent,
    IrrigationScheduleComponent,
    IrrigationHistoryComponent,
    IrrigationAlertComponent,
  ],
  templateUrl: './irrigation-dashboard.component.html',
  styleUrls: ['./irrigation-dashboard.component.scss'],
})
export class IrrigationDashboardComponent implements OnInit, OnDestroy {
  selectedParcelId: number | null = null;
  parcels: any[] = [];

  currentRecommendation: IrrigationRecommendation | null = null;
  history: IrrigationRecord[] = [];

  loading$ = this.irrigationService.isLoading$();
  error$ = this.irrigationService.getError$();

  showScheduleForm = false;
  showHistoryView = false;
  activeTab: 'recommendation' | 'schedule' | 'history' = 'recommendation';

  private destroy$ = new Subject<void>();

  constructor(private irrigationService: IrrigationService) {}

  ngOnInit(): void {
    this.loadParcels();

    // Subscribe to recommendation changes
    this.irrigationService
      .getCurrentRecommendation()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rec) => {
        this.currentRecommendation = rec;
      });

    // Subscribe to history changes
    this.irrigationService
      .getHistory$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((hist) => {
        this.history = hist;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load parcels (from parcel service or mock)
   */
  loadParcels(): void {
    // TODO: Inject ParcelService to get real parcels
    this.parcels = [
      { id: 1, name: 'Field A' },
      { id: 2, name: 'Field B' },
      { id: 3, name: 'Field C' },
      { id: 5, name: 'North Zone' },
    ];

    // Auto-select first parcel
    if (this.parcels.length > 0) {
      this.selectedParcelId = this.parcels[0].id;
    }
  }

  /**
   * Handle parcel selection
   */
  onParcelSelected(parcelId: number): void {
    this.selectedParcelId = parcelId;
    this.clearCurrentData();
  }

  /**
   * Calculate irrigation for selected parcel
   */
  calculateIrrigation(): void {
    if (!this.selectedParcelId) {
      return;
    }

    this.irrigationService
      .calculateIrrigation(this.selectedParcelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Data is automatically set via BehaviorSubject
          this.activeTab = 'recommendation';
        },
        error: (error) => {
          console.error('Calculation failed:', error);
        },
      });
  }

  /**
   * Get latest recommendation without recalculating
   */
  getLatestRecommendation(): void {
    if (!this.selectedParcelId) {
      return;
    }

    this.irrigationService
      .getLatestRecommendation(this.selectedParcelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.activeTab = 'recommendation';
        },
        error: (error) => {
          console.error('Failed to fetch recommendation:', error);
        },
      });
  }

  /**
   * Load history for selected parcel
   */
  loadHistory(): void {
    if (!this.selectedParcelId) {
      return;
    }

    this.irrigationService
      .getHistory(this.selectedParcelId, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.activeTab = 'history';
        },
        error: (error) => {
          console.error('Failed to load history:', error);
        },
      });
  }

  /**
   * Show schedule form
   */
  openScheduleForm(): void {
    this.showScheduleForm = true;
    this.activeTab = 'schedule';
  }

  /**
   * Hide schedule form
   */
  closeScheduleForm(): void {
    this.showScheduleForm = false;
  }

  /**
   * Clear current data
   */
  clearCurrentData(): void {
    this.currentRecommendation = null;
    this.history = [];
    this.showScheduleForm = false;
  }

  /**
   * Dismiss error message
   */
  dismissError(): void {
    this.irrigationService.clearError();
  }

  /**
   * Get priority config for styling
   */
  getPriorityConfig(priority: string) {
    return PRIORITY_CONFIG[priority as 'LOW' | 'MEDIUM' | 'HIGH'];
  }
}
