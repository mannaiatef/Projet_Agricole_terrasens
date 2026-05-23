import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Landing Page Component
 * Home page for unauthenticated users
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="landing-page">
      <div class="hero">
        <div class="hero-content">
          <h1>🌿 TerraSens</h1>
          <h2>Smart Farming Decision Support System</h2>
          <p>Optimize crop management with AI-powered insights, satellite data, and real-time irrigation recommendations</p>
          <div class="cta-buttons">
            <button routerLink="/auth/login" class="btn-primary">Get Started</button>
            <button routerLink="/auth/register" class="btn-secondary">Create Account</button>
          </div>
        </div>
      </div>

      <div class="features">
        <h2>Key Features</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">📅</div>
            <h3>Crop Calendar</h3>
            <p>Automated planting and harvesting schedules based on crop type and location</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💧</div>
            <h3>Irrigation Management</h3>
            <p>FAO-56 methodology for optimal water usage and cost savings</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🛰️</div>
            <h3>Satellite Analysis</h3>
            <p>Real-time NDVI monitoring and vegetation stress detection</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h3>AI Assistant</h3>
            <p>Intelligent chatbot for agronomic advice in multiple languages</p>
          </div>
        </div>
      </div>

      <footer class="landing-footer">
        <p>&copy; 2026 TerraSens. All rights reserved.</p>
      </footer>
    </div>
  `,
  styles: [`
    .landing-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f1f0f 0%, #1a2e1a 100%);
      color: white;
      overflow-x: hidden;
    }

    .hero {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }

    .hero-content {
      text-align: center;
      max-width: 600px;
    }

    .hero-content h1 {
      font-size: 48px;
      margin: 0 0 10px;
    }

    .hero-content h2 {
      font-size: 28px;
      color: #4caf50;
      margin: 0 0 20px;
      font-weight: 600;
    }

    .hero-content p {
      font-size: 16px;
      color: #d1d5db;
      margin: 0 0 40px;
      line-height: 1.6;
    }

    .cta-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
    }

    button {
      padding: 14px 30px;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #2d5a27, #4caf50);
      color: white;
      box-shadow: 0 4px 14px rgba(76, 175, 80, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .features {
      padding: 80px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .features h2 {
      text-align: center;
      font-size: 32px;
      margin-bottom: 60px;
      color: #4caf50;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
    }

    .feature-card {
      background: rgba(255, 255, 255, 0.05);
      padding: 30px;
      border-radius: 14px;
      border: 1px solid rgba(76, 175, 80, 0.2);
      transition: all 0.3s;
    }

    .feature-card:hover {
      background: rgba(76, 175, 80, 0.1);
      border-color: rgba(76, 175, 80, 0.5);
      transform: translateY(-5px);
    }

    .feature-icon {
      font-size: 40px;
      margin-bottom: 15px;
    }

    .feature-card h3 {
      font-size: 18px;
      margin: 0 0 10px;
    }

    .feature-card p {
      font-size: 14px;
      color: #d1d5db;
      margin: 0;
      line-height: 1.6;
    }

    .landing-footer {
      text-align: center;
      padding: 40px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #9ca3af;
    }

    @media (max-width: 768px) {
      .hero-content h1 {
        font-size: 36px;
      }

      .hero-content h2 {
        font-size: 20px;
      }

      .cta-buttons {
        flex-direction: column;
      }

      button {
        width: 100%;
      }
    }
  `]
})
export class LandingComponent {}
