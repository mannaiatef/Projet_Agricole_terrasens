import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface DiseaseAnalysis {
  id: string;
  userId: string;
  parcelId?: string;
  imageUrl: string;
  detectedDiseases: {
    name: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedArea: number;
  }[];
  recommendations: {
    pesticide?: string;
    method?: string;
    organic?: string;
    preventive?: string;
  };
  analysisDate: Date;
  status: 'completed' | 'processing' | 'failed';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface AnalysisHistory {
  id: string;
  imageUrl: string;
  mainDisease: string;
  confidence: number;
  analysisDate: Date;
  parcelId?: string;
}

export interface DiseaseStatistics {
  totalAnalyses: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  commonDiseases: {
    name: string;
    count: number;
    percentage: number;
  }[];
  severityDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DiseaseDetectionService {
  private apiUrl = 'http://localhost:3007/api/v1/disease';
  private backendUrl = 'http://localhost:3007';

  constructor(
    private http: HttpClient
  ) {}

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
   * Transform image URLs in analysis object
   */
  private normalizeAnalysis(analysis: DiseaseAnalysis): DiseaseAnalysis {
    if (analysis && analysis.imageUrl) {
      analysis.imageUrl = this.normalizeImageUrl(analysis.imageUrl);
    }
    return analysis;
  }

  /**
   * Transform image URLs in history array
   */
  private normalizeHistoryArray(data: any): any {
    if (data && Array.isArray(data.analyses)) {
      data.analyses = data.analyses.map((analysis: any) => ({
        ...analysis,
        imageUrl: this.normalizeImageUrl(analysis.imageUrl)
      }));
    }
    return data;
  }

  /**
   * Transform image URLs in high-risk analyses array
   */
  private normalizeHighRiskAnalyses(data: any): any {
    if (data && Array.isArray(data.highRiskAnalyses)) {
      data.highRiskAnalyses = data.highRiskAnalyses.map((analysis: any) => ({
        ...analysis,
        imageUrl: this.normalizeImageUrl(analysis.imageUrl)
      }));
    }
    return data;
  }

  /**
   * Get HTTP headers with JWT token
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Add X-User-ID if available - extract from stored user object
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          headers = headers.set('X-User-ID', user.id.toString());
        }
      }
    } catch (e) {
      console.warn('Failed to parse user from storage');
    }
    
    headers = headers.set('Content-Type', 'application/json');
    return headers;
  }

  /**
   * Analyze a crop image for diseases
   */
  analyzeImage(imageFile: File, parcelId?: string): Observable<DiseaseAnalysis> {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (parcelId) {
      formData.append('parcelId', parcelId);
    }

    // For FormData, don't set Content-Type header - let the browser set it with boundary
    let headers = new HttpHeaders();
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Extract userId from stored user object
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          headers = headers.set('X-User-ID', user.id.toString());
        }
      }
    } catch (e) {
      console.warn('Failed to parse user from storage');
    }

    return this.http.post<DiseaseAnalysis>(
      `${this.apiUrl}/analyze`,
      formData,
      { headers }
    ).pipe(
      map(analysis => this.normalizeAnalysis(analysis))
    );
  }

  /**
   * Get analysis history for current user
   */
  getAnalysisHistory(page: number = 1, limit: number = 10): Observable<{
    analyses: AnalysisHistory[];
    total: number;
    pages: number;
  }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<{
      analyses: AnalysisHistory[];
      total: number;
      pages: number;
    }>(`${this.apiUrl}/history`, { params, headers: this.getHeaders() }).pipe(
      map(data => this.normalizeHistoryArray(data))
    );
  }

  /**
   * Get single analysis details
   */
  getAnalysisDetails(analysisId: string): Observable<DiseaseAnalysis> {
    return this.http.get<ApiResponse<DiseaseAnalysis>>(
      `${this.apiUrl}/analysis/${analysisId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        // Unwrap the API response
        const analysis = response.data || (response as any);
        return this.normalizeAnalysis(analysis);
      })
    );
  }

  /**
   * Get analyses for a specific parcel
   */
  getParcelAnalyses(parcelId: string, page: number = 1, limit: number = 10): Observable<{
    analyses: AnalysisHistory[];
    total: number;
    pages: number;
  }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<{
      analyses: AnalysisHistory[];
      total: number;
      pages: number;
    }>(`${this.apiUrl}/parcel/${parcelId}`, { params, headers: this.getHeaders() }).pipe(
      map(data => this.normalizeHistoryArray(data))
    );
  }

  /**
   * Get disease statistics
   */
  getStatistics(): Observable<DiseaseStatistics> {
    return this.http.get<DiseaseStatistics>(`${this.apiUrl}/statistics`, { headers: this.getHeaders() });
  }

  /**
   * Get high-risk detections
   */
  getHighRiskDetections(): Observable<{
    highRiskAnalyses: DiseaseAnalysis[];
    count: number;
  }> {
    return this.http.get<{
      highRiskAnalyses: DiseaseAnalysis[];
      count: number;
    }>(`${this.apiUrl}/high-risk`, { headers: this.getHeaders() }).pipe(
      map(data => this.normalizeHighRiskAnalyses(data))
    );
  }

  /**
   * Delete an analysis record
   */
  deleteAnalysis(analysisId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/analysis/${analysisId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Check service health
   */
  checkHealth(): Observable<{ status: string; message: string }> {
    return this.http.get<{ status: string; message: string }>(
      `${this.apiUrl}/health`
    );
  }
}
