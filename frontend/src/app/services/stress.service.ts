import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, interval, of, throwError } from 'rxjs';
import { switchMap, startWith, takeWhile, retry, catchError, timeout } from 'rxjs/operators';
import { environment } from './../../environments/environment';
import {
  StressAnalysis,
  AnalysisResponse,
  AnalysisJobResponse,
  JobStatus,
  QueueStats,
  StressAlert,
  AlertStats,
  HealthStatus
} from '../models/stress.model';

@Injectable({
  providedIn: 'root'
})
export class StressService {
  private apiUrl = `${environment.apiUrl}/stress`;
  private readonly POLL_INTERVAL = 3000; // 3 seconds
  private readonly POLL_TIMEOUT = 600000; // 10 minutes max

  constructor(private http: HttpClient) {}

  /**
   * Get latest stress analysis for a parcel
   */
  getLatestAnalysis(parcelId: number): Observable<AnalysisResponse> {
    return this.http.get<any>(`${this.apiUrl}/parcel/${parcelId}/latest`).pipe(
      timeout(10000),
      retry(1),
      switchMap(response => {
        // Handle both wrapped {success, data} and direct data responses
        const analysisData = response?.data || response;
        return of(analysisData);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Trigger new stress analysis for a parcel
   * Returns immediately with job ID
   */
  triggerAnalysis(parcelId: number, priority: 'low' | 'normal' | 'high' = 'normal'): Observable<AnalysisJobResponse> {
    return this.http.post<any>(
      `${this.apiUrl}/analyze`,
      { parcel_id: parcelId, priority }
    ).pipe(
      timeout(10000),
      switchMap(response => {
        // Handle both wrapped and direct responses
        const jobData = response?.data || response;
        return of(jobData);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Poll job status until completion
   * Emits job status updates every interval
   */
  pollJobStatus(jobId: string, maxWaitTime: number = this.POLL_TIMEOUT): Observable<JobStatus> {
    const startTime = Date.now();

    return interval(this.POLL_INTERVAL).pipe(
      startWith(0),
      switchMap(() => this.getJobStatus(jobId)),
      timeout(maxWaitTime),
      takeWhile(
        job => {
          const elapsed = Date.now() - startTime;
          return job.status !== 'completed' && job.status !== 'failed' && elapsed < maxWaitTime;
        },
        true
      ),
      catchError(this.handleError)
    );
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Observable<JobStatus> {
    return this.http.get<any>(`${this.apiUrl}/jobs/${jobId}`).pipe(
      timeout(5000),
      switchMap(response => {
        // Handle both wrapped and direct responses
        const statusData = response?.data || response;
        return of(statusData);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get analysis history for a parcel
   */
  getAnalysisHistory(parcelId: number, limit: number = 10): Observable<AnalysisResponse> {
    return this.http.get<AnalysisResponse>(
      `${this.apiUrl}/history/${parcelId}?limit=${limit}`
    ).pipe(
      timeout(10000),
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Get active alerts for a parcel
   */
  getParcelAlerts(parcelId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/alerts/${parcelId}`).pipe(
      timeout(5000),
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Acknowledge/resolve an alert
   */
  acknowledgeAlert(alertId: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/alerts/${alertId}/acknowledge`,
      {}
    ).pipe(
      timeout(5000),
      catchError(this.handleError)
    );
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/queue/stats`).pipe(
      timeout(5000),
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Bulk analysis for multiple parcels
   */
  bulkAnalyze(parcelIds: number[]): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/bulk-analyze`,
      { parcelIds }
    ).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  /**
   * Get complete GIS map data for a parcel
   * Includes polygon, stress zones, center point, optional tile URLs
   */
  getParcelMapData(parcelId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/parcel/${parcelId}/map`).pipe(
      timeout(15000),
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Get historical map data for time slider/animation
   */
  getParcelMapHistory(parcelId: number, limit: number = 10): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/parcel/${parcelId}/map/history?limit=${limit}`
    ).pipe(
      timeout(15000),
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Health check
   */
  healthCheck(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${environment.apiUrl}/health`).pipe(
      timeout(5000),
      catchError(this.handleError)
    );
  }

  /**
   * Detailed health check
   */
  healthCheckDetailed(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${environment.apiUrl}/health/detailed`).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  // Helper methods

  /**
   * Get stress level label from percentage
   */
  getStressLevel(stressPercentage: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (stressPercentage < 20) return 'LOW';
    if (stressPercentage < 40) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Get color for stress level
   */
  getStressColor(stressPercentage: number): string {
    const level = this.getStressLevel(stressPercentage);
    const colors = {
      'LOW': '#4CAF50',     // Green
      'MEDIUM': '#FFC107',  // Amber
      'HIGH': '#F44336'     // Red
    };
    return colors[level];
  }

  /**
   * Get stress color for GeoJSON
   */
  getZoneColor(stressLevel: 'high' | 'medium' | 'healthy'): string {
    const colors = {
      'high': '#F44336',    // Red
      'medium': '#FF9800',  // Orange
      'healthy': '#4CAF50'  // Green
    };
    return colors[stressLevel];
  }

  /**
   * Parse NDVI value to readable format
   */
  formatNDVI(ndvi: number): string {
    return ndvi.toFixed(4);
  }

  /**
   * Format stress percentage
   */
  formatStressPercentage(percentage: number): string {
    return percentage.toFixed(2);
  }

  /**
   * Global error handler
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error: ${error.status} ${error.statusText}`;
      if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
