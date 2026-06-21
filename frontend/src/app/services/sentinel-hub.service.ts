import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ImageType,
  NDVILegend,
  FieldInfo,
  SentinelImageMetadata,
  DownloadRequest,
  SentinelImageResponse
} from '../models/sentinel-hub.model';

@Injectable({
  providedIn: 'root'
})
export class SentinelHubService {
  private apiUrl = environment.api?.stress?.baseUrl || environment.stressServiceUrl;
  private sentinelBaseUrl = `${this.apiUrl}/sentinel`;

  // Subject to track current image type
  private currentImageType$ = new BehaviorSubject<ImageType>('NDVI');
  currentImageType = this.currentImageType$.asObservable();

  // Subject to track loading state
  private loading$ = new BehaviorSubject<boolean>(false);
  loading = this.loading$.asObservable();

  constructor(private http: HttpClient) {
    console.log('SentinelHubService initialized with URL:', this.sentinelBaseUrl);
  }

  /**
   * Get satellite image for a field
   * @param fieldId - Field ID
   * @param imageType - Type of image (NDVI, TrueColor, Moisture)
   * @returns Observable<Blob> - Image blob
   */
  getFieldImage(fieldId: number, imageType: ImageType = 'NDVI'): Observable<Blob> {
    this.loading$.next(true);
    const url = `${this.sentinelBaseUrl}/image/${fieldId}?imageType=${imageType}`;

    return this.http.get(url, {
      responseType: 'blob'
    }).pipe(
      tap(() => {
        this.loading$.next(false);
        this.currentImageType$.next(imageType);
      }),
      catchError(error => {
        this.loading$.next(false);
        console.error('Error fetching field image:', error);
        return throwError(() => new Error('Failed to fetch satellite image: ' + error.message));
      })
    );
  }

  /**
   * Get image metadata
   * @param fieldId - Field ID
   * @returns Observable<SentinelImageMetadata> - Image metadata
   */
  getImageMetadata(fieldId: number): Observable<SentinelImageMetadata> {
    const url = `${this.sentinelBaseUrl}/image/${fieldId}/metadata`;

    return this.http.get<{ success: boolean; data: SentinelImageMetadata }>(url).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching image metadata:', error);
        return throwError(() => new Error('Failed to fetch image metadata: ' + error.message));
      })
    );
  }

  /**
   * Get field information
   * @param fieldId - Field ID
   * @returns Observable<FieldInfo> - Field information
   */
  getFieldInfo(fieldId: number): Observable<FieldInfo> {
    const url = `${this.sentinelBaseUrl}/field/${fieldId}/info`;

    return this.http.get<{ success: boolean; data: FieldInfo }>(url).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching field info:', error);
        return throwError(() => new Error('Failed to fetch field information: ' + error.message));
      })
    );
  }

  /**
   * Get NDVI color scale legend
   * @returns Observable<NDVILegend> - Color scale legend
   */
  getNDVILegend(): Observable<NDVILegend> {
    const url = `${this.sentinelBaseUrl}/legend`;

    return this.http.get<NDVILegend>(url).pipe(
      catchError(error => {
        console.error('Error fetching NDVI legend:', error);
        // Return a default legend
        return this.getDefaultNDVILegend();
      })
    );
  }

  /**
   * Download satellite image
   * @param fieldId - Field ID
   * @param imageType - Type of image
   * @returns Observable<Blob> - Downloaded image blob
   */
  downloadImage(fieldId: number, imageType: ImageType = 'NDVI'): Observable<Blob> {
    const url = `${this.sentinelBaseUrl}/download/${fieldId}`;
    const payload: DownloadRequest = { imageType };

    return this.http.post(url, payload, {
      responseType: 'blob'
    }).pipe(
      tap(() => {
        console.log('Image downloaded successfully');
      }),
      catchError(error => {
        console.error('Error downloading image:', error);
        return throwError(() => new Error('Failed to download image: ' + error.message));
      })
    );
  }

  /**
   * Convert blob to object URL for display
   * @param blob - Image blob
   * @returns Object URL string
   */
  blobToObjectUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  /**
   * Release object URL from memory
   * @param objectUrl - Object URL to release
   */
  releaseObjectUrl(objectUrl: string): void {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }

  /**
   * Get default NDVI legend
   * @returns Observable<NDVILegend>
   */
  private getDefaultNDVILegend(): Observable<NDVILegend> {
    const legend: NDVILegend = {
      imageType: 'NDVI',
      title: 'NDVI Color Scale - Vegetation Health',
      scale: [
        {
          value: '< 0.2',
          color: '#FF0000',
          label: 'Unhealthy/Stressed',
          description: 'Very low vegetation health, severe stress'
        },
        {
          value: '0.2 - 0.35',
          color: '#FF6400',
          label: 'Poor',
          description: 'Low vegetation health, significant stress'
        },
        {
          value: '0.35 - 0.45',
          color: '#FFFF00',
          label: 'Moderate',
          description: 'Moderate vegetation health, some stress'
        },
        {
          value: '0.45 - 0.55',
          color: '#B4FF00',
          label: 'Good',
          description: 'Good vegetation health, minor stress'
        },
        {
          value: '> 0.55',
          color: '#00FF00',
          label: 'Excellent',
          description: 'Excellent vegetation health, no stress'
        }
      ],
      notes: 'NDVI ranges from -1 to 1. Values < 0.2 indicate vegetation stress.',
      dataSource: 'Sentinel-2 Satellite'
    };

    return new Observable(observer => {
      observer.next(legend);
      observer.complete();
    });
  }

  /**
   * Update current image type
   * @param imageType - New image type
   */
  setImageType(imageType: ImageType): void {
    this.currentImageType$.next(imageType);
  }

  /**
   * Get current loading state
   */
  isLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }
}
