import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ChatbotComponent } from '../../features/chatbot/components/chatbot.component';

/**
 * Dashboard Layout Component
 *
 * Used for authenticated routes:
 * - Dashboard
 * - Farms
 * - Crop Calendar
 * - Irrigation
 * - Satellite
 * - Stress Analysis
 * - Fields
 * - Chatbot
 *
 * Features:
 * - Left sidebar with navigation
 * - Top navigation bar with breadcrumbs
 * - Content area with router-outlet
 * - Responsive layout
 * - Protected by authentication guard (for future implementation)
 */
@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, ChatbotComponent],
  template: `
    <div class="dashboard-layout">
      <app-sidebar></app-sidebar>
      <main class="dashboard-content">
        <header class="top-nav">
          <div class="breadcrumb">
            <span class="breadcrumb-icon">📁</span>
            <span class="breadcrumb-text">Pages / Dashboard</span>
          </div>
          <div class="user-meta">
            <button class="notification-btn" aria-label="Notifications">
              <span class="notification-icon">🔔</span>
              <span class="notification-dot"></span>
            </button>
            <div class="profile-dropdown">
              <div class="profile-pic">A</div>
              <span class="profile-name">Admin</span>
              <span class="dropdown-arrow">▼</span>
            </div>
          </div>
        </header>
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
      <!-- Chatbot Component -->
      <app-chatbot></app-chatbot>
    </div>
  `,
  styles: [`
    /* Layout base */
    .dashboard-layout {
      display: flex;
      height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      overflow: hidden;
    }

    /* Main content column */
    .dashboard-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #f8fafc;
    }

    /* Top navigation bar */
    .top-nav {
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(4px);
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
      z-index: 20;
    }

    /* Breadcrumb styling */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: #475569;
      background: #f1f5f9;
      padding: 0.4rem 1rem;
      border-radius: 40px;
      transition: all 0.2s;
    }
    .breadcrumb-icon {
      font-size: 1.1rem;
    }
    .breadcrumb-text {
      letter-spacing: -0.01em;
    }

    /* User meta section */
    .user-meta {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    /* Notification button */
    .notification-btn {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.4rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .notification-btn:hover {
      background: #f1f5f9;
    }
    .notification-icon {
      font-size: 1.3rem;
      opacity: 0.8;
    }
    .notification-dot {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 10px;
      height: 10px;
      background: #ef4444;
      border: 2px solid white;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    /* Profile dropdown (simplified) */
    .profile-dropdown {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f8fafc;
      padding: 0.3rem 0.8rem 0.3rem 0.4rem;
      border-radius: 40px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid #e2e8f0;
    }
    .profile-dropdown:hover {
      background: white;
      border-color: #cbd5e1;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }
    .profile-pic {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #1e3a2f 0%, #2d5a3b 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .profile-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: #1e293b;
    }
    .dropdown-arrow {
      font-size: 0.7rem;
      color: #64748b;
    }

    /* Content area with scroll */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 1.8rem 2rem;
      scroll-behavior: smooth;
    }

    /* Custom scrollbar */
    .content-area::-webkit-scrollbar {
      width: 6px;
    }
    .content-area::-webkit-scrollbar-track {
      background: #e2e8f0;
      border-radius: 10px;
    }
    .content-area::-webkit-scrollbar-thumb {
      background: #94a3b8;
      border-radius: 10px;
    }
    .content-area::-webkit-scrollbar-thumb:hover {
      background: #64748b;
    }

    /* Pulse animation for notification dot */
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.6;
        transform: scale(1.1);
      }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .dashboard-layout {
        flex-direction: column;
      }

      .top-nav {
        padding: 0 1rem;
        height: 64px;
      }

      .breadcrumb {
        font-size: 0.8rem;
        padding: 0.3rem 0.8rem;
      }

      .profile-name, .dropdown-arrow {
        display: none;
      }

      .profile-dropdown {
        padding: 0.2rem;
        background: transparent;
        border: none;
      }

      .profile-dropdown:hover {
        background: transparent;
        box-shadow: none;
      }

      .profile-pic {
        width: 36px;
        height: 36px;
      }

      .content-area {
        padding: 1rem;
      }
    }

    /* Extra small devices */
    @media (max-width: 480px) {
      .breadcrumb-text {
        display: none;
      }
      .breadcrumb-icon {
        margin-right: 0;
      }
      .notification-btn {
        padding: 0.2rem;
      }
      .content-area {
        padding: 0.8rem;
      }
    }
  `]
})
export class DashboardLayoutComponent {}