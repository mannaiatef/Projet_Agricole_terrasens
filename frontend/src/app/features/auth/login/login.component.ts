import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Login Component
 * Auto-creates user on login (login-auto endpoint)
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="header">
          <h1>🌿 TerraSens</h1>
          <p>Smart Farming Decision Support System</p>
        </div>
        
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input 
              id="name"
              [(ngModel)]="name" 
              name="name" 
              type="text" 
              placeholder="Your full name"
              required 
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input 
              id="email"
              [(ngModel)]="email" 
              name="email" 
              type="email" 
              placeholder="farmer@example.com"
              required 
            />
          </div>

          <button type="submit" [disabled]="loading" class="btn-submit">
            {{ loading ? '⟳ Signing in...' : 'Sign In / Register' }}
          </button>
        </form>

        <div *ngIf="error" class="error-message">{{ error }}</div>

        <div class="footer-text">
          Using auto-login. No password required.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f1f0f 0%, #1a2e1a 100%);
      padding: 20px;
    }
    .login-card {
      background: white;
      padding: 50px 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      width: 100%;
      max-width: 400px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 32px;
      color: #1a2a1a;
      margin: 0 0 10px;
    }
    .header p {
      color: #666;
      margin: 0;
      font-size: 14px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }
    input {
      width: 100%;
      padding: 12px 15px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }
    input:focus {
      outline: none;
      border-color: #4caf50;
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
    }
    .btn-submit {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #2d5a27, #4caf50);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(76, 175, 80, 0.3);
      transition: all 0.3s;
    }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
    }
    .btn-submit:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .error-message {
      background: #fef2f2;
      color: #b91c1c;
      padding: 12px 15px;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 15px;
      border: 1px solid #fecaca;
    }
    .footer-text {
      text-align: center;
      color: #888;
      font-size: 12px;
      margin-top: 20px;
    }
  `]
})
export class LoginComponent implements OnInit {
  name = '';
  email = '';
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (!this.name || !this.email) {
      this.error = 'Please enter both name and email';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.name, this.email).subscribe(
      (response: any) => {
        // Auto-login successful, redirect to dashboard
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 500);
      },
      (error: any) => {
        console.error('Login error:', error);
        this.error = error.error?.message || 'Login failed. Please try again.';
        this.loading = false;
      }
    );
  }
}
