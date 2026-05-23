import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import {
  IrrigationRecommendation,
  IrrigationRecord,
  IrrigationSchedule,
  IrrigationResponse,
  CreateScheduleRequest,
} from '../models/irrigation.model';

@Injectable({
  providedIn: 'root',
})
export class IrrigationService {
  private apiUrl = '/api/irrigation';

  // Subjects for state management
  private currentRecommendation$ = new BehaviorSubject<IrrigationRecommendation | null>(null);
  private history$ = new BehaviorSubject<IrrigationRecord[]>([]);
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get latest irrigation recommendation for a parcel
   */
  getLatestRecommendation(parcelId: number): Observable<IrrigationResponse<IrrigationRecommendation>> {
    this.loading$.next(true);
    this.error$.next(null);

    return this.http.get<IrrigationResponse<IrrigationRecommendation>>(
      `${this.apiUrl}/${parcelId}`
    ).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.currentRecommendation$.next(response.data);
        }
        this.loading$.next(false);
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to fetch recommendation';
        this.error$.next(message);
        this.loading$.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Calculate irrigation requirements for a parcel
   */
  calculateIrrigation(parcelId: number): Observable<IrrigationResponse<IrrigationRecommendation>> {
    this.loading$.next(true);
    this.error$.next(null);

    return this.http.post<IrrigationResponse<IrrigationRecommendation>>(
      `${this.apiUrl}/calculate/${parcelId}`,
      {}
    ).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.currentRecommendation$.next(response.data);
        }
        this.loading$.next(false);
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to calculate irrigation';
        this.error$.next(message);
        this.loading$.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create irrigation schedule
   */
  scheduleIrrigation(schedule: CreateScheduleRequest): Observable<IrrigationResponse<IrrigationSchedule>> {
    this.loading$.next(true);
    this.error$.next(null);

    // Convert date to ISO string if needed
    const payload = {
      ...schedule,
      scheduled_time: schedule.scheduled_time instanceof Date
        ? schedule.scheduled_time.toISOString()
        : schedule.scheduled_time,
    };

    return this.http.post<IrrigationResponse<IrrigationSchedule>>(
      `${this.apiUrl}/schedule`,
      payload
    ).pipe(
      tap((response) => {
        this.loading$.next(false);
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to schedule irrigation';
        this.error$.next(message);
        this.loading$.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get irrigation history for a parcel
   */
  getHistory(parcelId: number, limit: number = 30): Observable<IrrigationResponse<IrrigationRecord[]>> {
    this.loading$.next(true);
    this.error$.next(null);

    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<IrrigationResponse<IrrigationRecord[]>>(
      `${this.apiUrl}/history/${parcelId}`,
      { params }
    ).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.history$.next(response.data);
        }
        this.loading$.next(false);
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to fetch history';
        this.error$.next(message);
        this.loading$.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get next scheduled irrigation for a parcel
   */
  getNextScheduled(parcelId: number): Observable<IrrigationResponse<IrrigationSchedule>> {
    this.loading$.next(true);
    this.error$.next(null);

    return this.http.get<IrrigationResponse<IrrigationSchedule>>(
      `${this.apiUrl}/schedule/${parcelId}`
    ).pipe(
      tap(() => {
        this.loading$.next(false);
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to fetch schedule';
        this.error$.next(message);
        this.loading$.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Execute irrigation schedule immediately
   */
  executeSchedule(scheduleId: number): Observable<IrrigationResponse<any>> {
    this.loading$.next(true);
    this.error$.next(null);

    return this.http.post<IrrigationResponse<any>>(
      `${this.apiUrl}/schedule/${scheduleId}/execute`,
      {}
    ).pipe(
      tap(() => {
        this.loading$.next(false);
      }),
      catchError((error) => {
        const message = error?.error?.message || 'Failed to execute schedule';
        this.error$.next(message);
        this.loading$.next(false);
        return throwError(() => error);
      })
    );
  }

  // Observables for components
  getCurrentRecommendation(): Observable<IrrigationRecommendation | null> {
    return this.currentRecommendation$.asObservable();
  }

  getHistory$(): Observable<IrrigationRecord[]> {
    return this.history$.asObservable();
  }

  isLoading$(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  getError$(): Observable<string | null> {
    return this.error$.asObservable();
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error$.next(null);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get priority color
   */
  getPriorityColor(priority: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    const colors = {
      LOW: '#4caf50',
      MEDIUM: '#ff9800',
      HIGH: '#f44336',
    };
    return colors[priority] || '#9e9e9e';
  }

  /**
   * Get priority icon
   */
  getPriorityIcon(priority: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    const icons = {
      LOW: 'check_circle',
      MEDIUM: 'warning',
      HIGH: 'error',
    };
    return icons[priority] || 'help';
  }
}
