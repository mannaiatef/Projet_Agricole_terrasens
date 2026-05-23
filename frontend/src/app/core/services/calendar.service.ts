import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Calendar Stage Interface
 */
export interface CalendarStage {
  number: number;
  stage_order?: number;
  name: string;
  stage_name?: string;
  name_en?: string;
  description?: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  kc_value: number;
  color?: string;
  day_from_sowing_start?: number;
  actions: Array<{
    id?: string;
    type: string;
    title: string;
    description?: string;
    how_to?: string;
    frequency?: string;
    priority?: string;
    alert_message?: string;
  }>;
  alerts: Array<{
    type: string;
    message: string;
    priority?: string;
  }>;
  fertilization?: {
    date?: string;
    day_from_sowing?: number;
    npk: { n: number; p: number; k: number };
    type: string;
    description: string;
  };
}

/**
 * Generated Calendar Interface
 */
export interface GeneratedCalendar {
  id: number;
  farm_id?: number;
  crop_name: string;
  sowing_date: string;
  total_duration_days: number;
  stages: CalendarStage[];
  generated_at?: string;
  created_at?: string;
}

/**
 * Crop Information Interface
 */
export interface CalendarCrop {
  id?: number;
  name: string;
  name_en?: string;
  duration_days: number;
  planting_window?: { start: number; end: number };
  regions?: string[];
  stage_count?: number;
  stages?: CalendarStage[];
}

/**
 * Calendar Service
 * Handles communication with the crop calendar API
 */
@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  // API Gateway base URL - adjust based on environment
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Get all supported crops
   */
  getCrops(): Observable<{ success: boolean; data: CalendarCrop[] }> {
    return this.http
      .get<{ success: boolean; data: CalendarCrop[] }>(`${this.apiUrl}/crops`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all supported crops (backward compatibility alias)
   */
  getAllCrops(): Observable<{ success: boolean; data: CalendarCrop[] }> {
    return this.getCrops();
  }

  /**
   * Get crop details by name
   */
  getCropDetails(cropName: string): Observable<{ success: boolean; data: CalendarCrop }> {
    return this.http
      .get<{ success: boolean; data: CalendarCrop }>(`${this.apiUrl}/calendar/crops/${cropName}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Generate new calendar for a parcelle (farm)
   */
  generateCalendar(
    farmId: number,
    cropName: string,
    sowingDate: string
  ): Observable<{ success: boolean; message: string; data: GeneratedCalendar }> {
    const payload = {
      crop_name: cropName,
      sowing_date: sowingDate,
    };
    return this.http
      .post<{ success: boolean; message: string; data: GeneratedCalendar }>(
        `${this.apiUrl}/calendar/${farmId}`,
        payload
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Get calendar for a parcelle (farm)
   */
  getCalendar(farmId: number): Observable<{ success: boolean; data: GeneratedCalendar }> {
    return this.http
      .get<{ success: boolean; data: GeneratedCalendar }>(`${this.apiUrl}/calendar/${farmId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get current stage of a calendar
   */
  getCurrentStage(farmId: number): Observable<{ success: boolean; data: CalendarStage }> {
    return this.http
      .get<{ success: boolean; data: CalendarStage }>(`${this.apiUrl}/calendar/${farmId}/current`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Regenerate calendar for a parcelle
   */
  regenerateCalendar(
    farmId: number,
    cropName: string,
    sowingDate: string
  ): Observable<{ success: boolean; message: string; data: GeneratedCalendar }> {
    const payload = {
      crop_name: cropName,
      sowing_date: sowingDate,
    };
    return this.http
      .post<{ success: boolean; message: string; data: GeneratedCalendar }>(
        `${this.apiUrl}/calendar/${farmId}/regenerate`,
        payload
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Generate calendar for a parcelle (POST to parcelle endpoint)
   */
  generateCalendarForParcelle(
    parcelleId: number,
    cropId: number,
    sowingDate: string
  ): Observable<{ success: boolean; message: string; data: GeneratedCalendar }> {
    const payload = {
      crop_id: cropId,
      sowing_date: sowingDate,
    };
    return this.http
      .post<{ success: boolean; message: string; data: GeneratedCalendar }>(
        `${this.apiUrl}/parcelles/${parcelleId}/calendar/generate`,
        payload
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Calculate which stage is current
   */
  getCurrentStageFromCalendar(calendar: GeneratedCalendar): CalendarStage | null {
    if (!calendar || !calendar.stages) {
      return null;
    }

    const today = new Date().toISOString().split('T')[0];

    for (const stage of calendar.stages) {
      if (today >= stage.start_date && today <= stage.end_date) {
        return stage;
      }
    }

    return null;
  }

  /**
   * Format date for display
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * Get stage color
   */
  getStageColor(stage: CalendarStage): string {
    return stage.color || '#ccc';
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.message || 'Unknown error';
    }
    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

// Keep old interfaces for backward compatibility
export interface OldCalendarCrop {
  id: number;
  name: string;
  duration_days: number;
  created_at?: string;
  updated_at?: string;
}

export interface StageAction {
  id: number;
  stage_id: number;
  type: string;
  title: string;
  description: string;
  how_to: string;
  frequency: string;
  priority: string;
  alert_message: string;
  created_at?: string;
  updated_at?: string;
}

export interface CropStage {
  id: number;
  crop_id: number;
  name: string;
  stage_order: number;
  duration_days: number;
  kc_value: number;
  actions?: StageAction[];
  created_at?: string;
  updated_at?: string;
}

export interface CropWithStages extends OldCalendarCrop {
  stages: CropStage[];
}

export interface CalendarStageInstance {
  id: number;
  stage_id: number;
  stage_name: string;
  stage_order: number;
  start_date: string;
  end_date: string;
  duration_days: number;
  kc_value: number;
  actions: StageAction[];
}

export interface GeneratedCalendarOld {
  id: number;
  parcelle_id: number;
  crop_id: number;
  crop_name: string;
  sowing_date: string;
  total_duration_days: number;
  stages: CalendarStageInstance[];
  created_at?: string;
}

export interface CalendarSummary {
  id: number;
  parcelle_id: number;
  crop_id: number;
  crop_name: string;
  sowing_date: string;
  created_at?: string;
}
