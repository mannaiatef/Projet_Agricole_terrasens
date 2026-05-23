import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { retry, catchError, timeout, map, tap } from 'rxjs/operators';
import { environment } from './../../environments/environment';
import { Parcel, ParcelGeometry, CreateParcelRequest } from '../models/stress.model';

/**
 * Parcel Service
 * Handles all parcel-related API operations
 */
@Injectable({
  providedIn: 'root'
})
export class ParcelService {
  private apiUrl = `${environment.apiUrl}/parcelles`;
  private parcelsSubject = new BehaviorSubject<Parcel[]>([]);
  public parcels$ = this.parcelsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all parcels for the authenticated user
   */
  getAllParcels(): Observable<Parcel[]> {
    return this.http.get<any>(`${this.apiUrl}`).pipe(
      timeout(10000),
      retry(1),
      map(response => response.data || response || []),
      catchError(error => {
        console.error('Error fetching parcels:', error);
        return throwError(() => new Error('Failed to fetch parcels'));
      })
    );
  }

  /**
   * Get parcel by ID
   */
  getParcelById(parcelId: string | number): Observable<Parcel> {
    return this.http.get<any>(`${this.apiUrl}/${parcelId}`).pipe(
      timeout(10000),
      retry(1),
      map(response => response.data || response),
      catchError(error => {
        console.error(`Error fetching parcel ${parcelId}:`, error);
        return throwError(() => new Error('Failed to fetch parcel'));
      })
    );
  }

  /**
   * Create a new parcel
   * @param parcelData - Parcel creation data with geospatial info
   */
  createParcel(parcelData: CreateParcelRequest): Observable<Parcel> {
    return this.http.post<any>(`${this.apiUrl}`, parcelData).pipe(
      timeout(10000),
      map(response => response.data || response),
      catchError(error => {
        console.error('Error creating parcel:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to create parcel'));
      })
    );
  }

  /**
   * Update a parcel
   * @param parcelId - ID of parcel to update
   * @param parcelData - Partial parcel data to update
   */
  updateParcel(parcelId: string | number, parcelData: Partial<CreateParcelRequest>): Observable<Parcel> {
    return this.http.put<any>(`${this.apiUrl}/${parcelId}`, parcelData).pipe(
      timeout(10000),
      map(response => response.data || response),
      catchError(error => {
        console.error(`Error updating parcel ${parcelId}:`, error);
        return throwError(() => new Error(error.error?.message || 'Failed to update parcel'));
      })
    );
  }

  /**
   * Delete a parcel
   * @param parcelId - ID of parcel to delete
   */
  deleteParcel(parcelId: string | number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${parcelId}`).pipe(
      timeout(10000),
      catchError(error => {
        console.error(`Error deleting parcel ${parcelId}:`, error);
        return throwError(() => new Error('Failed to delete parcel'));
      })
    );
  }

  /**
   * Get parcel as GeoJSON Feature
   */
  getParcelGeometry(parcelId: string | number): Observable<ParcelGeometry> {
    return this.getParcelById(parcelId).pipe(
      map(parcel => this.toGeoJSONFeature(parcel)),
      catchError(error => {
        console.error('Error converting parcel to GeoJSON:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all parcels as GeoJSON Features
   */
  getAllParcelsAsGeoJSON(): Observable<ParcelGeometry[]> {
    return this.getAllParcels().pipe(
      map(parcels => parcels.map(parcel => this.toGeoJSONFeature(parcel))),
      catchError(error => {
        console.error('Error converting parcels to GeoJSON:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Batch load and cache all parcels
   */
  loadAndCacheParcels(): Observable<Parcel[]> {
    return this.getAllParcels().pipe(
      tap((parcels: Parcel[]) => this.parcelsSubject.next(parcels)),
      catchError(error => {
        console.error('Error loading parcels:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get cached parcels
   */
  getCachedParcels(): Parcel[] {
    return this.parcelsSubject.value;
  }

  /**
   * Assign crop to a parcel
   */
  assignCrop(parcelId: string | number, cropId: number, sowingDate: string): Observable<Parcel> {
    return this.http.post<any>(`${this.apiUrl}/${parcelId}/assign-crop`, {
      crop_id: cropId,
      sowing_date: sowingDate
    }).pipe(
      timeout(10000),
      map(response => response.data || response),
      catchError(error => {
        console.error(`Error assigning crop to parcel ${parcelId}:`, error);
        return throwError(() => new Error(error.error?.message || 'Failed to assign crop'));
      })
    );
  }

  /**
   * Generate calendar for a parcel
   */
  generateCalendar(parcelId: string | number, cropId: number, sowingDate: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${parcelId}/calendar/generate`, {
      crop_id: cropId,
      sowing_date: sowingDate
    }).pipe(
      timeout(30000),
      catchError(error => {
        console.error(`Error generating calendar for parcel ${parcelId}:`, error);
        return throwError(() => new Error(error.error?.message || 'Failed to generate calendar'));
      })
    );
  }

  /**
   * Convert parcel to GeoJSON Feature
   */
  private toGeoJSONFeature(parcel: Parcel): ParcelGeometry {
    return {
      type: 'Feature',
      properties: {
        parcelId: parcel.id,
        name: parcel.name,
        cropType: parcel.crop_id?.toString(),
        area: parcel.surface
      },
      geometry: parcel.polygon
    };
  }

  /**
   * Validate parcel geo-data
   */
  validateParcelData(data: CreateParcelRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string') {
      errors.push('Name is required');
    }

    if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
      errors.push('Valid latitude is required (-90 to 90)');
    }

    if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
      errors.push('Valid longitude is required (-180 to 180)');
    }

    if (!data.polygon || data.polygon.type !== 'Polygon') {
      errors.push('Valid GeoJSON Polygon is required');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Global error handler
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Failed to fetch parcel data';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Server Error: ${error.status}`;
      if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
