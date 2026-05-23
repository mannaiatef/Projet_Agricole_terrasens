import { Injectable, inject } from '@angular/core';
import { 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpInterceptor, 
  HttpErrorResponse,
  HttpInterceptorFn 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Function-based HTTP Interceptor (Angular 15+)
 * 
 * Attaches JWT bearer token to all HTTP requests
 * Handles 401 responses by logging out user
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    // Clone request and add Authorization header if token exists
    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Log out on 401 Unauthorized
            if (error.status === 401) {
                authService.logout();
            }
            return throwError(() => error);
        })
    );
};
