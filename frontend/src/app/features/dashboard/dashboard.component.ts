import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page">
      <!-- Hero section -->
      <div class="hero">
        <div class="hero-content">
          <div class="hero-icon">📊</div>
          <div class="hero-text">
            <h1>Operational Overview</h1>
            <p>Real‑time insights for smart farm management</p>
          </div>
          <button class="refresh-btn" (click)="refreshData()" [disabled]="refreshing">
            @if (refreshing) {
              <span class="spinner-small"></span>
            } @else {
              <span>⟳ Refresh</span>
            }
          </button>
        </div>
      </div>

      <!-- Loading skeleton (simulated) -->
      @if (loading) {
        <div class="loading-skeleton">
          <div class="skeleton-grid">
            <div class="skeleton-card" *ngFor="let _ of [1,2,3,4]"></div>
          </div>
        </div>
      } @else {
        <!-- KPI Cards -->
        <div class="stats-grid">
          <!-- Farms Card -->
          <a routerLink="/app/fields" class="kpi-card-link">
            <div class="kpi-card">
              <div class="kpi-icon">🌾</div>
              <div class="kpi-content">
                <div class="kpi-title">Active Farms</div>
                <div class="kpi-value">4</div>
                <div class="kpi-trend positive">
                  <span>▲</span> +1 this month
                </div>
              </div>
            </div>
          </a>

          <!-- NDVI Card -->
          <div class="kpi-card">
            <div class="kpi-icon">🌿</div>
            <div class="kpi-content">
              <div class="kpi-title">Average NDVI</div>
              <div class="kpi-value highlight-green">0.72</div>
              <div class="kpi-progress">
                <div class="progress-bar">
                  <div class="progress-fill ndvi-fill" style="width: 72%"></div>
                </div>
                <div class="kpi-sub">Healthy vegetation</div>
              </div>
            </div>
          </div>

          <!-- Risk Level Card -->
          <div class="kpi-card">
            <div class="kpi-icon">⚠️</div>
            <div class="kpi-content">
              <div class="kpi-title">Risk Level</div>
              <div class="kpi-value highlight-orange">Medium</div>
              <div class="kpi-trend negative">
                <span>▼</span> 2 alerts pending
              </div>
            </div>
          </div>

          <!-- ET0 Card -->
          <div class="kpi-card">
            <div class="kpi-icon">💧</div>
            <div class="kpi-content">
              <div class="kpi-title">ET<sub>0</sub> Today</div>
              <div class="kpi-value">3.4 <span class="unit">mm</span></div>
              <div class="kpi-progress">
                <div class="progress-bar">
                  <div class="progress-fill et-fill" style="width: 68%"></div>
                </div>
                <div class="kpi-sub">Evapotranspiration</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main two‑column section -->
        <div class="main-sections">
          <!-- Vegetation Trend (Mock Chart) -->
          <div class="card chart-card">
            <div class="card-header">
              <h3>📈 Vegetation Trend (NDVI)</h3>
              <span class="period">Last 6 months</span>
            </div>
            <div class="trend-chart">
              <div class="chart-bars">
                <div class="bar-item" *ngFor="let month of months; let i = index">
                  <div class="bar" [style.height.%]="ndviValues[i] * 100"></div>
                  <div class="bar-label">{{ month }}</div>
                </div>
              </div>
              <div class="chart-legend">
                <span><span class="legend-dot healthy"></span> Healthy (≥0.7)</span>
                <span><span class="legend-dot moderate"></span> Moderate (0.4‑0.7)</span>
                <span><span class="legend-dot stressed"></span> Stressed (<0.4)</span>
              </div>
            </div>
          </div>

          <!-- Recommended Actions -->
          <div class="card actions-card">
            <div class="card-header">
              <h3>✅ Recommended Actions</h3>
              <span class="badge info">AI generated</span>
            </div>
            <div class="actions-list">
              <div class="action-item high">
                <div class="action-icon">🚨</div>
                <div class="action-content">
                  <div class="action-title">Wheat – Farm A</div>
                  <div class="action-desc">Irrigate 5mm before sunset</div>
                  <div class="action-tag urgent">High Priority</div>
                </div>
              </div>
              <div class="action-item medium">
                <div class="action-icon">🌽</div>
                <div class="action-content">
                  <div class="action-title">Maize – North Field</div>
                  <div class="action-desc">Nitrogen application due tomorrow</div>
                  <div class="action-tag planned">Planned</div>
                </div>
              </div>
              <div class="action-item low">
                <div class="action-icon">🔬</div>
                <div class="action-content">
                  <div class="action-title">Soil Analysis</div>
                  <div class="action-desc">Check pH for West Plot</div>
                  <div class="action-tag recommendation">Recommendation</div>
                </div>
              </div>
            </div>
            <button class="view-all-btn">View all tasks →</button>
          </div>
        </div>

        <!-- Quick Access Section -->
        <div class="card quick-access-card">
          <div class="card-header">
            <h3>🚀 Quick Access</h3>
          </div>
          <div class="quick-access-grid">
            <a routerLink="/app/fields" class="quick-link">
              <span class="ql-icon">🌾</span>
              <span class="ql-title">All Fields</span>
              <span class="ql-desc">View and manage your fields</span>
            </a>
            <a routerLink="/app/fields/1" class="quick-link">
              <span class="ql-icon">🛰️</span>
              <span class="ql-title">Field #1 Satellite</span>
              <span class="ql-desc">NDVI & satellite imagery</span>
            </a>
            <a routerLink="/app/fields/2" class="quick-link">
              <span class="ql-icon">🛰️</span>
              <span class="ql-title">Field #2 Satellite</span>
              <span class="ql-desc">NDVI & satellite imagery</span>
            </a>
            <a routerLink="/app/stress" class="quick-link">
              <span class="ql-icon">📊</span>
              <span class="ql-title">Stress Analysis</span>
              <span class="ql-desc">Water stress monitoring</span>
            </a>
          </div>
        </div>

        <!-- Last updated footer -->
        <div class="dashboard-footer">
          <span>🕒 Last updated: {{ lastUpdated | date:'medium' }}</span>
          <span class="status online">● All systems operational</span>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Base */
    .dashboard-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      background: #f8fafc;
      min-height: 100vh;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, #1e3a2f 0%, #2d5a3b 100%);
      border-radius: 1.5rem;
      padding: 1.5rem 2rem;
      margin-bottom: 2rem;
      color: white;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
    }
    .hero-content {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.2rem;
      justify-content: space-between;
    }
    .hero-icon {
      font-size: 2.8rem;
      background: rgba(255,255,255,0.15);
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 60px;
      backdrop-filter: blur(4px);
    }
    .hero-text h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 600;
    }
    .hero-text p {
      margin: 0.2rem 0 0;
      opacity: 0.85;
      font-size: 0.9rem;
    }
    .refresh-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      padding: 0.5rem 1.2rem;
      border-radius: 2rem;
      color: white;
      font-weight: 500;
      cursor: pointer;
      backdrop-filter: blur(4px);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .refresh-btn:hover:not(:disabled) {
      background: rgba(255,255,255,0.35);
    }
    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .spinner-small {
      width: 18px;
      height: 18px;
      border: 2px solid white;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Loading skeleton */
    .loading-skeleton {
      margin-top: 1rem;
    }
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.2rem;
    }
    .skeleton-card {
      background: #e2e8f0;
      border-radius: 1.2rem;
      height: 130px;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%,100% { opacity: 0.6; }
      50% { opacity: 1; }
    }

    /* KPI Cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.2rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      background: white;
      border-radius: 1.2rem;
      padding: 1.2rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      transition: all 0.25s;
      border: 1px solid #edf2f7;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .kpi-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px -6px rgba(0,0,0,0.08);
      border-color: #cbd5e1;
    }
    .kpi-icon {
      font-size: 2.2rem;
      background: #f1f5f9;
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 1rem;
    }
    .kpi-content {
      flex: 1;
    }
    .kpi-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: #475569;
      margin-bottom: 0.2rem;
    }
    .kpi-value {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 0.3rem;
    }
    .kpi-value .unit {
      font-size: 0.9rem;
      font-weight: 500;
      color: #64748b;
    }
    .highlight-green {
      color: #22c55e;
    }
    .highlight-orange {
      color: #f97316;
    }
    .kpi-trend {
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }
    .kpi-trend.positive { color: #22c55e; }
    .kpi-trend.negative { color: #ef4444; }
    .kpi-progress {
      margin-top: 0.5rem;
    }
    .progress-bar {
      background: #e2e8f0;
      border-radius: 40px;
      height: 6px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 40px;
      transition: width 0.3s;
    }
    .ndvi-fill { background: #22c55e; width: 72%; }
    .et-fill { background: #3b82f6; width: 68%; }
    .kpi-sub {
      font-size: 0.65rem;
      color: #64748b;
      margin-top: 0.2rem;
    }

    /* Main sections */
    .main-sections {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .card {
      background: white;
      border-radius: 1.2rem;
      border: 1px solid #edf2f7;
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    .card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.2rem;
      border-bottom: 1px solid #f0f2f5;
    }
    .card-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #0f172a;
    }
    .period, .badge {
      font-size: 0.7rem;
      background: #f1f5f9;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      color: #334155;
    }
    .badge.info {
      background: #e0f2fe;
      color: #0369a1;
    }

    /* Trend chart */
    .trend-chart {
      padding: 1rem 1.2rem 1.2rem;
    }
    .chart-bars {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      gap: 0.5rem;
      height: 180px;
      margin-bottom: 1rem;
    }
    .bar-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
    }
    .bar {
      width: 100%;
      background: linear-gradient(180deg, #22c55e, #a3e635);
      border-radius: 6px 6px 2px 2px;
      transition: height 0.2s;
      min-height: 4px;
    }
    .bar-label {
      font-size: 0.7rem;
      color: #475569;
    }
    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 1rem;
      font-size: 0.7rem;
      margin-top: 1rem;
      padding-top: 0.5rem;
      border-top: 1px solid #eef2ff;
    }
    .legend-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 10px;
      margin-right: 0.3rem;
    }
    .legend-dot.healthy { background: #22c55e; }
    .legend-dot.moderate { background: #facc15; }
    .legend-dot.stressed { background: #ef4444; }

    /* Actions list */
    .actions-list {
      padding: 0.2rem 0;
    }
    .action-item {
      display: flex;
      gap: 0.8rem;
      padding: 1rem 1.2rem;
      border-bottom: 1px solid #f0f2f5;
      transition: background 0.2s;
    }
    .action-item:hover {
      background: #fafcff;
    }
    .action-icon {
      font-size: 1.4rem;
    }
    .action-content {
      flex: 1;
    }
    .action-title {
      font-weight: 700;
      font-size: 0.9rem;
      color: #0f172a;
    }
    .action-desc {
      font-size: 0.8rem;
      color: #334155;
      margin: 0.2rem 0 0.3rem;
    }
    .action-tag {
      display: inline-block;
      font-size: 0.65rem;
      padding: 0.2rem 0.6rem;
      border-radius: 40px;
      font-weight: 500;
    }
    .action-tag.urgent {
      background: #fee2e2;
      color: #b91c1c;
    }
    .action-tag.planned {
      background: #fef9c3;
      color: #854d0e;
    }
    .action-tag.recommendation {
      background: #e0f2fe;
      color: #0369a1;
    }
    .view-all-btn {
      width: calc(100% - 2rem);
      margin: 1rem;
      background: transparent;
      border: 1px solid #e2e8f0;
      padding: 0.6rem;
      border-radius: 2rem;
      font-weight: 500;
      color: #1e3a2f;
      cursor: pointer;
      transition: all 0.2s;
    }
    .view-all-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    /* Footer */
    .dashboard-footer {
      background: white;
      border-radius: 1rem;
      padding: 0.8rem 1.2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      color: #475569;
      border: 1px solid #edf2f7;
    }
    .status.online {
      color: #22c55e;
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }

    /* Responsive */
    @media (max-width: 780px) {
      .dashboard-page { padding: 1rem; }
      .hero-content { flex-direction: column; align-items: flex-start; }
      .main-sections { grid-template-columns: 1fr; }
      .stats-grid { gap: 0.8rem; }
    }
    /* Quick Access */
    .quick-access-card {
      margin-bottom: 1.5rem;
    }
    .quick-access-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      padding: 1.2rem;
    }
    .quick-link {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      padding: 1.2rem;
      background: #f8fafc;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      text-decoration: none;
      transition: all 0.25s;
    }
    .quick-link:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .ql-icon {
      font-size: 1.8rem;
    }
    .ql-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: #0f172a;
    }
    .ql-desc {
      font-size: 0.75rem;
      color: #64748b;
    }
    .kpi-card-link {
      text-decoration: none;
      display: block;
    }
    .kpi-card-link .kpi-card {
      cursor: pointer;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class DashboardComponent {
  loading = false;
  refreshing = false;
  lastUpdated = new Date();
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  ndviValues = [0.68, 0.70, 0.65, 0.72, 0.74, 0.72]; // mock NDVI per month

  refreshData() {
    this.refreshing = true;
    // Simulate API call
    setTimeout(() => {
      this.lastUpdated = new Date();
      this.refreshing = false;
    }, 800);
  }
}