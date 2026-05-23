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
          <div class="breadcrumb">Pages / Dashboard</div>
          <div class="user-meta">
            <span class="notification-dot"></span>
            <div class="profile-pic">A</div>
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
    .dashboard-layout {
      display: flex;
      height: 100vh;
      background: #f8faf8;
    }

    .dashboard-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .top-nav {
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 30px;
      background: white;
      border-bottom: 1px solid #eee;
      z-index: 10;
    }

    .breadcrumb {
      color: #888;
      font-size: 14px;
      font-weight: 500;
    }

    .user-meta {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .profile-pic {
      width: 35px;
      height: 35px;
      background: #4caf50;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    .profile-pic:hover {
      background: #45a049;
    }

    .notification-dot {
      width: 8px;
      height: 8px;
      background: #ff5252;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 30px;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @media (max-width: 768px) {
      .dashboard-layout {
        flex-direction: column;
      }

      .content-area {
        padding: 15px;
      }
    }
  `]
})
export class DashboardLayoutComponent {}
