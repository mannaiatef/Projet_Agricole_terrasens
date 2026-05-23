import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParcelleService, Parcelle } from '../../core/services/parcelle.service';

interface DashboardStats {
  totalFarms: number;
  averageNdvi: number;
  riskLevel: string;
  riskCount: number;
  et0Today: number;
}

interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'planned' | 'info';
  dueDate?: string;
}

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1>📊 Operational Overview</h1>
          <p class="subtitle">Real-time farm monitoring and recommendations</p>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="card stat-card">
          <div class="stat-icon">🚜</div>
          <h3>Farms</h3>
          <p class="stat-value">{{ stats.totalFarms }}</p>
          <span class="stat-label">Total active managed</span>
        </div>
        <div class="card stat-card">
          <div class="stat-icon">🌱</div>
          <h3>Average NDVI</h3>
          <p class="stat-value" [ngClass]="{'color-green': stats.averageNdvi > 0.6}">{{ stats.averageNdvi.toFixed(2) }}</p>
          <span class="stat-label">Healthy vegetation</span>
        </div>
        <div class="card stat-card">
          <div class="stat-icon">⚠️</div>
          <h3>Risk Level</h3>
          <p class="stat-value" [ngClass]="getRiskColorClass(stats.riskLevel)">{{ stats.riskLevel }}</p>
          <span class="stat-label">{{ stats.riskCount }} alerts pending</span>
        </div>
        <div class="card stat-card">
          <div class="stat-icon">💧</div>
          <h3>ET0 Today</h3>
          <p class="stat-value">{{ stats.et0Today }} mm</p>
          <span class="stat-label">Evapotranspiration</span>
        </div>
      </div>

      <!-- Main Sections -->
      <div class="main-sections">
        <!-- Vegetation Trend Chart -->
        <div class="card chart-container">
          <h2 class="section-title">📈 Vegetation Trend (NDVI)</h2>
          <div class="mock-chart">
            <div class="chart-placeholder">
              <p>📊 Chart Visualization Area</p>
              <p class="chart-hint">NDVI trend over last 30 days will display here</p>
            </div>
          </div>
          <div class="chart-legend">
            <span><span class="legend-dot" style="background: #ef4444;"></span> Critical (< 0.5)</span>
            <span><span class="legend-dot" style="background: #f59e0b;"></span> Moderate (0.5 - 0.8)</span>
            <span><span class="legend-dot" style="background: #22c55e;"></span> Healthy (> 0.8)</span>
          </div>
        </div>

        <!-- Recommended Actions -->
        <div class="card actions-container">
          <h2 class="section-title">✅ Recommended Actions</h2>
          <ul class="actions-list">
            <li *ngFor="let action of recommendedActions" class="action-item">
              <div class="action-content">
                <strong class="action-title">{{ action.title }}</strong>
                <p class="action-desc">{{ action.description }}</p>
              </div>
              <span class="status-badge" [ngClass]="'status-' + action.priority">
                {{ getPriorityLabel(action.priority) }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Stress Analysis Section -->
      <div class="stress-analysis-section card">
        <h2 class="section-title">🌾 Water Stress Analysis</h2>
        <div class="stress-placeholder">
          <p>Water stress monitoring and analysis component will be integrated here</p>
          <div class="stress-metrics">
            <div class="metric">
              <span class="metric-label">Current Stress Level</span>
              <span class="metric-value">Low</span>
            </div>
            <div class="metric">
              <span class="metric-label">Last Updated</span>
              <span class="metric-value">Today, 3:45 PM</span>
            </div>
            <div class="metric">
              <span class="metric-label">Recommendation</span>
              <span class="metric-value">Continue irrigation schedule</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ---- LAYOUT ---- */
    .dashboard-page {
      padding: 30px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      background: #fafbfa;
      min-height: 100%;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .header-left h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a2a1a;
      margin: 0 0 8px;
    }

    .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }

    /* ---- STATS GRID ---- */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .card {
      background: white;
      border-radius: 14px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
      border: 1px solid #f0f2f0;
      transition: all 0.3s ease;
    }

    .card:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }

    .stat-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
    }

    .stat-icon {
      font-size: 32px;
      margin-bottom: 4px;
    }

    .stat-card h3 {
      font-size: 13px;
      text-transform: uppercase;
      color: #9ca3af;
      letter-spacing: 0.5px;
      margin: 0;
      font-weight: 600;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #1a2a1a;
      margin: 8px 0 0;
      line-height: 1;
    }

    .stat-value.color-green {
      color: #4caf50;
    }

    .stat-value.color-orange {
      color: #ff9800;
    }

    .stat-value.color-red {
      color: #ef4444;
    }

    .stat-label {
      font-size: 13px;
      color: #6b7280;
    }

    /* ---- MAIN SECTIONS ---- */
    .main-sections {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 17px;
      font-weight: 700;
      color: #1a2a1a;
      margin: 0 0 20px;
    }

    .chart-container {
      padding: 24px;
    }

    .mock-chart {
      height: 280px;
      background: linear-gradient(135deg, #f0f7f0 0%, #fafbfa 100%);
      border: 2px dashed #d1fae5;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      flex-direction: column;
      gap: 12px;
    }

    .chart-placeholder {
      text-align: center;
      color: #6b7280;
    }

    .chart-placeholder p {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .chart-hint {
      font-size: 13px !important;
      color: #9ca3af !important;
    }

    .chart-legend {
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: #6b7280;
      flex-wrap: wrap;
    }

    .legend-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 6px;
      vertical-align: middle;
    }

    /* ---- ACTIONS CONTAINER ---- */
    .actions-container {
      padding: 24px;
      display: flex;
      flex-direction: column;
    }

    .actions-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      background: #fafbfa;
      border-left: 4px solid #4caf50;
      border-radius: 6px;
      transition: all 0.2s;
      gap: 12px;
    }

    .action-item:hover {
      background: #f0f7f0;
    }

    .action-content {
      flex: 1;
    }

    .action-title {
      display: block;
      font-size: 13px;
      color: #1a2a1a;
      margin: 0 0 4px;
    }

    .action-desc {
      font-size: 12px;
      color: #6b7280;
      margin: 0;
    }

    .status-badge {
      font-size: 10px;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .status-urgent {
      background: #ffebee;
      color: #c62828;
    }

    .status-planned {
      background: #e0e0e0;
      color: #424242;
    }

    .status-info {
      background: #e3f2fd;
      color: #1565c0;
    }

    /* ---- STRESS ANALYSIS SECTION ---- */
    .stress-analysis-section {
      padding: 24px;
      margin-top: 20px;
      border-top: 2px solid #f0f2f0;
    }

    .stress-placeholder {
      background: linear-gradient(135deg, #f9fafb 0%, #fafbfa 100%);
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 24px;
      text-align: center;
      color: #6b7280;
    }

    .stress-placeholder p {
      margin: 0 0 20px;
      font-size: 14px;
      color: #9ca3af;
    }

    .stress-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 16px;
    }

    .metric {
      background: white;
      padding: 14px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid #f0f2f0;
    }

    .metric-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #9ca3af;
      letter-spacing: 0.5px;
    }

    .metric-value {
      font-size: 14px;
      font-weight: 600;
      color: #1a2a1a;
    }

    /* ---- RESPONSIVE ---- */
    @media (max-width: 1024px) {
      .dashboard-page {
        padding: 20px;
      }

      .main-sections {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .stress-metrics {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .dashboard-page {
        padding: 16px;
      }

      .page-header h1 {
        font-size: 22px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-card {
        padding: 16px;
      }

      .stat-value {
        font-size: 24px;
      }

      .chart-legend {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class DashboardOverviewComponent implements OnInit {
  stats: DashboardStats = {
    totalFarms: 4,
    averageNdvi: 0.72,
    riskLevel: 'Medium',
    riskCount: 2,
    et0Today: 3.4
  };

  recommendedActions: RecommendedAction[] = [
    {
      id: '1',
      title: 'Wheat - Farm A',
      description: 'Irrigate 5mm before sunset',
      priority: 'urgent'
    },
    {
      id: '2',
      title: 'Maize - North Field',
      description: 'Nitrogen application due tomorrow',
      priority: 'planned'
    },
    {
      id: '3',
      title: 'Soil Analysis',
      description: 'Check pH for West Plot',
      priority: 'info'
    }
  ];

  constructor(private parcelleService: ParcelleService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Load parcelles (farms) to get count
    this.parcelleService.getParcelles().subscribe({
      next: (response) => {
        this.stats.totalFarms = response.data.length;
      },
      error: (err) => console.error('Error loading parcelles', err)
    });
  }

  getRiskColorClass(riskLevel: string): string {
    switch (riskLevel) {
      case 'Critical':
        return 'color-red';
      case 'Medium':
        return 'color-orange';
      case 'Low':
        return 'color-green';
      default:
        return '';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'High Priority';
      case 'planned':
        return 'Planned';
      case 'info':
        return 'Recommendation';
      default:
        return priority;
    }
  }
}
