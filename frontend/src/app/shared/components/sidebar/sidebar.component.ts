import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Sidebar Navigation Component
 * 
 * Main navigation for authenticated users
 * Features:
 * - Links to all main features
 * - User profile section
 * - Logout button
 * - Active route highlighting
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="sidebar">
      <!-- Logo -->
      <div class="logo-area">
        <div class="logo-icon">🌿</div>
        <div class="logo-text">
          <span class="logo-name">TerraSens</span>
          <span class="logo-tag">DSS Platform</span>
        </div>
      </div>

      <!-- Navigation principale -->
      <nav class="main-nav">
        <div class="nav-section-label">GESTION</div>
        <a routerLink="/app/dashboard" routerLinkActive="active" id="nav-dashboard">
          <span class="nav-icon">🏠</span>
          <span>Tableau de bord</span>
        </a>
        <a routerLink="/app/farms" routerLinkActive="active" id="nav-farms">
          <span class="nav-icon">🌾</span>
          <span>Mes Parcelles</span>
        </a>
        <a routerLink="/app/crop-calendar" routerLinkActive="active" id="nav-calendar">
          <span class="nav-icon">📅</span>
          <span>Plan Cultural</span>
          <span class="nav-badge new">Nouveau</span>
        </a>

        <div class="nav-section-label">ANALYSE</div>
        <a routerLink="/app/irrigation" routerLinkActive="active" id="nav-irrigation">
          <span class="nav-icon">💧</span>
          <span>Irrigation</span>
        </a>
        <a routerLink="/app/satellite" routerLinkActive="active" id="nav-satellite">
          <span class="nav-icon">🛰️</span>
          <span>Satellite & NDVI</span>
        </a>
        <a routerLink="/app/stress" routerLinkActive="active" id="nav-stress">
          <span class="nav-icon">⚠️</span>
          <span>Stress Analysis</span>
        </a>
        <a routerLink="/app/disease-detection" routerLinkActive="active" id="nav-disease">
          <span class="nav-icon">🦠</span>
          <span>Disease Detection</span>
          <span class="nav-badge new">AI</span>
        </a>

        <div class="nav-section-label">ASSISTANT</div>
        <a routerLink="/app/chatbot" routerLinkActive="active" id="nav-chatbot" class="chatbot-link">
          <span class="nav-icon">🤖</span>
          <span>AgriSmart AI</span>
          <span class="nav-badge ai">FR / AR / EN</span>
        </a>
        <a routerLink="/app/fields" routerLinkActive="active" id="nav-fields">
          <span class="nav-icon">🗂️</span>
          <span>My Fields</span>
        </a>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="footer-user">
          <div class="user-avatar">A</div>
          <div class="user-info">
            <span class="user-name">Agriculteur</span>
            <span class="user-role">Compte Pro</span>
          </div>
        </div>
        <button class="logout-btn" (click)="logout()" id="logout-btn">
          <span>⎋</span> Déconnexion
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      height: 100vh;
      background: linear-gradient(180deg, #0f1f0f 0%, #1a2e1a 100%);
      color: white;
      display: flex;
      flex-direction: column;
      padding: 0;
      flex-shrink: 0;
      box-shadow: 4px 0 20px rgba(0,0,0,0.15);
    }

    /* Logo */
    .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .logo-icon { font-size: 28px; }
    .logo-name { display: block; font-size: 18px; font-weight: 700; color: #4caf50; }
    .logo-tag { display: block; font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }

    /* Navigation */
    .main-nav {
      flex: 1;
      padding: 20px 12px;
      overflow-y: auto;
    }
    .nav-section-label {
      font-size: 10px;
      font-weight: 600;
      color: #4b5563;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      padding: 12px 8px 6px;
      margin-bottom: 2px;
    }
    nav a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      color: #9ca3af;
      text-decoration: none;
      border-radius: 10px;
      margin-bottom: 2px;
      font-size: 14px;
      transition: all 0.2s;
      position: relative;
    }
    nav a:hover {
      background: rgba(76,175,80,0.08);
      color: #d1fae5;
    }
    nav a.active {
      background: rgba(76,175,80,0.15);
      color: #4caf50;
      font-weight: 600;
    }
    nav a.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 25%;
      height: 50%;
      width: 3px;
      background: #4caf50;
      border-radius: 0 3px 3px 0;
    }
    .nav-icon { font-size: 18px; flex-shrink: 0; }
    .nav-badge {
      margin-left: auto;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .nav-badge.new { background: rgba(16,185,129,0.2); color: #10b981; }
    .nav-badge.ai { background: rgba(99,102,241,0.2); color: #818cf8; }

    .chatbot-link {
      border: 1px solid rgba(76,175,80,0.25) !important;
    }

    /* Footer */
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .footer-user {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #2d5a27, #4caf50);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }
    .user-name { display: block; font-size: 13px; font-weight: 600; color: #e5e7eb; }
    .user-role { display: block; font-size: 11px; color: #6b7280; }
    .logout-btn {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      color: #9ca3af;
      padding: 9px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .logout-btn:hover { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.2); }
  `]
})
export class SidebarComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
