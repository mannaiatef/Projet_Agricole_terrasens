import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/app.models';

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeAuth();
  }

  /**
   * Initialize auth from stored token/user
   */
  private initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      const user = this.loadUserFromStorage();
      if (user) {
        this.currentUserSubject.next(user);
      }
    }
  }

  /**
   * Register a new user
   * Route: POST /auth/register
   */
  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      name,
      email,
      password,
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.saveAuthData(response.data.user, response.data.token);
        }
      })
    );
  }

  /**
   * Login user (auto-creates user if not exists)
   * Route: POST /auth/login-auto
   */
  login(name: string, email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login-auto`, {
      name,
      email,
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.saveAuthData(response.data.user, response.data.token);
        }
      })
    );
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get JWT token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  /**
   * Save auth data to localStorage
   */
  private saveAuthData(user: User, token: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Load user from localStorage
   */
  private loadUserFromStorage(): User | null {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }
}
