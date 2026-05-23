import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Farm, CropCalendar } from '../models/app.models';

@Injectable({
    providedIn: 'root'
})
export class FarmService {
    private apiUrl = `${environment.apiUrl}/parcelles`;
    private calendarUrl = `${environment.apiUrl}/calendar`;
    private irrigationUrl = `${environment.apiUrl}/irrigation`;

    constructor(private http: HttpClient) { }

    // ========== FARMS ==========

    /**
     * Get all farms/parcelles for current user
     */
    getFarms(): Observable<Farm[]> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => response.data || response || [])
        );
    }

    /**
     * Create new farm/parcelle
     */
    createFarm(farm: Partial<Farm>): Observable<Farm> {
        return this.http.post<any>(this.apiUrl, farm).pipe(
            map(response => response.data || response)
        );
    }

    /**
     * Get soil data for a farm
     */
    getFarmSoil(farmId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${farmId}/soil`).pipe(
            map(response => response.data || response)
        );
    }

    /**
     * Update farm/parcelle
     */
    updateFarm(farmId: number, farm: Partial<Farm>): Observable<Farm> {
        return this.http.put<any>(`${this.apiUrl}/${farmId}`, farm).pipe(
            map(response => response.data || response)
        );
    }

    /**
     * Delete farm/parcelle
     */
    deleteFarm(farmId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${farmId}`).pipe(
            map(response => response.data || response)
        );
    }

    // ========== CROP CALENDAR ==========

    /**
     * Get list of available crops
     * Route: GET /calendar/crops
     */
    getAvailableCrops(): Observable<string[]> {
        return this.http.get<any>(`${this.calendarUrl}/crops`).pipe(
            map(response => response.data || [])
        );
    }

    /**
     * Assign a crop to a parcelle and generate its calendar
     * Route: POST /parcelles/{farm_id}/assign-crop
     */
    assignCropToParcelle(farmId: number, cropName: string, sowingDate: string): Observable<Farm> {
        // Map crop name to crop_id (1-based index)
        // Backend crops order: Blé, Orge, Maïs, Tomate, Piment, Pomme de terre, Olivier, Vigne
        const availableCrops = [
            'Blé', 'Orge', 'Maïs', 'Tomate', 'Piment', 
            'Pomme de terre', 'Olivier', 'Vigne'
        ];
        const cropIndex = availableCrops.indexOf(cropName);
        const cropId = cropIndex >= 0 ? cropIndex + 1 : 0;

        console.log('[FarmService] assignCropToParcelle called');
        console.log('[FarmService] farmId:', farmId);
        console.log('[FarmService] cropName:', cropName);
        console.log('[FarmService] cropId:', cropId);
        console.log('[FarmService] sowingDate:', sowingDate);
        console.log('[FarmService] POST URL:', `${this.apiUrl}/${farmId}/assign-crop`);

        const payload = {
            crop_id: cropId,
            sowing_date: sowingDate
        };
        console.log('[FarmService] Payload:', payload);

        return this.http.post<any>(`${this.apiUrl}/${farmId}/assign-crop`, payload).pipe(
            tap(response => {
                console.log('[FarmService] Response received:', response);
            }),
            map(response => response.data || response),
            catchError(error => {
                console.error('[FarmService] HTTP Error:', error);
                throw error;
            })
        );
    }

    /**
     * Get complete crop calendar for a farm
     * Route: GET /calendar/{farm_id}
     */
    getFarmCalendar(farmId: number): Observable<CropCalendar> {
        return this.http.get<any>(`${this.calendarUrl}/${farmId}`).pipe(
            map(response => response.data !== undefined ? response.data : null)
        );
    }

    /**
     * Get current stage of calendar
     * Route: GET /calendar/{farm_id}/current
     */
    getCurrentStage(farmId: number): Observable<any> {
        return this.http.get<any>(`${this.calendarUrl}/${farmId}/current`).pipe(
            map(response => response.data || response)
        );
    }

    /**
     * Regenerate calendar with new crop/sowing date
     * Route: POST /calendar/{farm_id}/regenerate
     */
    regenerateCalendar(farmId: number, cropName: string, sowingDate: string): Observable<CropCalendar> {
        return this.http.post<any>(`${this.calendarUrl}/${farmId}/regenerate`, {
            crop_name: cropName,
            sowing_date: sowingDate
        }).pipe(
            map(response => response.data || response)
        );
    }

    // ========== IRRIGATION ==========

    /**
     * Get irrigation recommendation for a farm
     */
    getIrrigationRecommendation(farmId: number): Observable<any> {
        return this.http.get<any>(`${this.irrigationUrl}/${farmId}`).pipe(
            map(response => response.data || response)
        );
    }

    /**
     * Get stress analysis for a farm
     */
    getStressAnalysis(farmId: number): Observable<any> {
        return this.http.get<any>(`${this.irrigationUrl}/${farmId}/stress`).pipe(
            map(response => response.data || response)
        );
    }
}
