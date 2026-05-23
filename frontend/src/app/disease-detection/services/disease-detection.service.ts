import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * DiseaseDetectionService
 * Handles HTTP communication with Disease Detection API
 */
@Injectable({
  providedIn: 'root'
})
export class DiseaseDetectionService {
  private apiUrl = `${environment.apiUrl}/api/v1/disease` || 'http://localhost:3007/api/v1/disease';
  private backendUrl = (environment.apiUrl || 'http://localhost:3007').replace('/api', '');
  private analysisHistorySubject = new BehaviorSubject<any[]>([]);
  public analysisHistory$ = this.analysisHistorySubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Transform relative image URLs to absolute backend URLs
   */
  private normalizeImageUrl(url: string): string {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) {
      return `${this.backendUrl}${url}`;
    }
    return `${this.backendUrl}/${url}`;
  }

  /**
   * Transform image URLs in response objects
   */
  private normalizeResponse(data: any): any {
    if (!data) return data;
    
    // Handle API response wrapper { success, data: {...} }
    if (data.success && data.data && !data.imageUrl) {
      data = data.data;
    }
    
    // Handle single object with imageUrl
    if (data.imageUrl && typeof data.imageUrl === 'string') {
      data.imageUrl = this.normalizeImageUrl(data.imageUrl);
    }
    
    // Handle array of objects
    if (Array.isArray(data)) {
      return data.map(item => {
        if (item && item.imageUrl) {
          item.imageUrl = this.normalizeImageUrl(item.imageUrl);
        }
        return item;
      });
    }
    
    // Handle nested arrays like { analyses: [...] }
    if (data.analyses && Array.isArray(data.analyses)) {
      data.analyses = data.analyses.map((item: any) => {
        if (item && item.imageUrl) {
          item.imageUrl = this.normalizeImageUrl(item.imageUrl);
        }
        return item;
      });
    }
    
    // Handle nested arrays like { highRiskAnalyses: [...] }
    if (data.highRiskAnalyses && Array.isArray(data.highRiskAnalyses)) {
      data.highRiskAnalyses = data.highRiskAnalyses.map((item: any) => {
        if (item && item.imageUrl) {
          item.imageUrl = this.normalizeImageUrl(item.imageUrl);
        }
        return item;
      });
    }
    
    return data;
  }

  /**
   * Upload image and analyze for disease
   * @param formData Form data containing image and optional parcelId
   * @returns Observable with analysis result
   */
  analyzeImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/analyze`, formData).pipe(
      map(data => this.normalizeResponse(data))
    );
  }

  /**
   * Get analysis history for current user
   * @param limit Number of records to return
   * @param offset Pagination offset
   * @returns Observable with history data
   */
  getAnalysisHistory(limit: number = 10, offset: number = 0): Observable<any> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get(`${this.apiUrl}/history`, { params }).pipe(
      map(data => this.normalizeResponse(data))
    );
  }

  /**
   * Get single analysis by ID
   * @param analysisId Analysis UUID
   * @returns Observable with analysis details
   */
  getAnalysis(analysisId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/analysis/${analysisId}`).pipe(
      map(data => this.normalizeResponse(data))
    );
  }

  /**
   * Get analyses for a specific parcel
   * @param parcelId Parcel ID
   * @param limit Number of records
   * @param offset Pagination offset
   * @returns Observable with parcel analyses
   */
  getParcelAnalyses(parcelId: number, limit: number = 10, offset: number = 0): Observable<any> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get(`${this.apiUrl}/parcel/${parcelId}`, { params }).pipe(
      map(data => this.normalizeResponse(data))
    );
  }

  /**
   * Get disease statistics for current user
   * @returns Observable with disease statistics
   */
  getDiseaseStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics`);
  }

  /**
   * Get high-confidence disease detections (potential issues)
   * @param confidence Minimum confidence threshold (0-100)
   * @returns Observable with high-risk analyses
   */
  getHighRiskAnalyses(confidence: number = 80): Observable<any> {
    const params = new HttpParams().set('confidence', confidence.toString());
    return this.http.get(`${this.apiUrl}/high-risk`, { params }).pipe(
      map(data => this.normalizeResponse(data))
    );
  }

  /**
   * Delete an analysis
   * @param analysisId Analysis UUID
   * @returns Observable with deletion result
   */
  deleteAnalysis(analysisId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/analysis/${analysisId}`);
  }

  /**
   * Check service health
   * @returns Observable with health status
   */
  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
