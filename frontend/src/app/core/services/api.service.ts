import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Base API Service
 * 
 * Provides core HTTP methods for all API calls.
 * Automatically prepends environment.apiUrl to all requests.
 * 
 * Usage:
 * this.apiService.get<TypeData>('/farms').subscribe(data => {})
 * this.apiService.post<TypeResponse>('/farms', { name: 'Farm 1' }).subscribe(...)
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET request
   * @param endpoint - API endpoint (e.g., '/farms' or 'farms/1')
   * @param params - Optional query parameters
   * @returns Observable with typed response
   */
  get<T>(endpoint: string, params?: HttpParams | { [key: string]: string | number }): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params });
  }

  /**
   * POST request
   * @param endpoint - API endpoint
   * @param data - Request body
   * @returns Observable with typed response
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data);
  }

  /**
   * PUT request
   * @param endpoint - API endpoint
   * @param data - Request body
   * @returns Observable with typed response
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data);
  }

  /**
   * PATCH request
   * @param endpoint - API endpoint
   * @param data - Request body
   * @returns Observable with typed response
   */
  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, data);
  }

  /**
   * DELETE request
   * @param endpoint - API endpoint
   * @returns Observable with typed response
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }
}
