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
      <!-- Logo area -->
      <div class="logo-area">
        <div class="logo-icon">🌿</div>
        <div class="logo-text">
          <span class="logo-name">TerraSens</span>
          <span class="logo-tag">DSS Platform</span>
        </div>
      </div>

      <!-- Main navigation -->
      <nav class="main-nav">
        <div class="nav-section-label">GESTION</div>
        <a routerLink="/app/dashboard" routerLinkActive="active" id="nav-dashboard">
          <span class="nav-icon">📊</span>
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
          <span class="nav-badge ai">AI</span>
        </a>

        <div class="nav-section-label">ASSISTANT</div>
        <!--
        <a routerLink="/app/chatbot" routerLinkActive="active" id="nav-chatbot" class="chatbot-link">
          <span class="nav-icon">🤖</span>
          <span>AgriSmart AI</span>
          <span class="nav-badge lang">FR / AR / EN</span>
        </a>
-->
        <!--
        <a routerLink="/app/fields" routerLinkActive="active" id="nav-fields">
          <span class="nav-icon">🗂️</span>
          <span>My Fields</span>
        </a>
        -->
      </nav>

      <!-- Footer with user and logout -->
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
    /* Sidebar container - light theme */
    .sidebar {
      width: 280px;
      height: 100vh;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      border-right: 1px solid #eef2f6;
      box-shadow: 2px 0 12px rgba(0, 0, 0, 0.02);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    /* Logo area */
    .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 28px 24px;
      border-bottom: 1px solid #f0f2f5;
    }
    .logo-icon {
      font-size: 32px;
      background: linear-gradient(135deg, #1e3a2f 0%, #2d5a3b 100%);
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.05);
    }
    .logo-text {
      display: flex;
      flex-direction: column;
    }
    .logo-name {
      font-size: 1.3rem;
      font-weight: 700;
      background: linear-gradient(135deg, #1e3a2f 0%, #2d5a3b 100%);
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      letter-spacing: -0.3px;
    }
    .logo-tag {
      font-size: 0.65rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }

    /* Navigation */
    .main-nav {
      flex: 1;
      padding: 24px 16px;
      overflow-y: auto;
    }
    .nav-section-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 12px 12px 6px;
      margin-top: 8px;
    }
    .main-nav a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      margin: 4px 0;
      color: #334155;
      text-decoration: none;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;
      position: relative;
    }
    .main-nav a:hover {
      background: #f8fafc;
      color: #0f172a;
    }
    .main-nav a.active {
      background: #f0fdf4;
      color: #15803d;
      font-weight: 600;
    }
    .main-nav a.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 20%;
      height: 60%;
      width: 3px;
      background: #22c55e;
      border-radius: 0 4px 4px 0;
    }
    .nav-icon {
      font-size: 1.25rem;
      width: 28px;
      text-align: center;
    }
    .nav-badge {
      margin-left: auto;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .nav-badge.new {
      background: #e0f2fe;
      color: #0284c7;
    }
    .nav-badge.ai {
      background: #e0e7ff;
      color: #4338ca;
    }
    .nav-badge.lang {
      background: #f1f5f9;
      color: #475569;
      font-size: 0.6rem;
      text-transform: none;
    }
    .chatbot-link {
      border: 1px solid #e2e8f0;
      background: #fefce8;
    }
    .chatbot-link:hover {
      background: #fef9c3;
    }

    /* Footer */
    .sidebar-footer {
      padding: 20px 16px 24px;
      border-top: 1px solid #f0f2f5;
      background: #fafcff;
    }
    .footer-user {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .user-avatar {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #1e3a2f 0%, #2d5a3b 100%);
      border-radius: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      color: white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }
    .user-info {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: #0f172a;
    }
    .user-role {
      font-size: 0.7rem;
      color: #64748b;
    }
    .logout-btn {
      width: 100%;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #475569;
      padding: 10px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .logout-btn:hover {
      background: #fef2f2;
      border-color: #fecaca;
      color: #dc2626;
    }

    /* Custom scrollbar */
    .main-nav::-webkit-scrollbar {
      width: 4px;
    }
    .main-nav::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }
    .main-nav::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        height: auto;
        flex-direction: row;
        flex-wrap: wrap;
        border-right: none;
        border-bottom: 1px solid #eef2f6;
      }
      .logo-area {
        padding: 16px;
        width: 100%;
        border-bottom: none;
      }
      .main-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 12px;
        overflow-x: auto;
      }
      .nav-section-label {
        display: none;
      }
      .main-nav a {
        padding: 8px 14px;
        margin: 0;
      }
      .sidebar-footer {
        display: none;
      }
    }
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