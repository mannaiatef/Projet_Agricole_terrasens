import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-page">
      <h1>📊 Operational Overview</h1>
      <div class="stats-grid">
        <div class="card stat">
          <h3>Farms</h3>
          <p class="value">4</p>
          <span class="label">Total active managed</span>
        </div>
        <div class="card stat">
          <h3>Average NDVI</h3>
          <p class="value color-green">0.72</p>
          <span class="label">Healthy vegetation</span>
        </div>
        <div class="card stat">
          <h3>Risk Level</h3>
          <p class="value color-orange">Medium</p>
          <span class="label">2 alerts pending</span>
        </div>
        <div class="card stat">
          <h3>ET0 Today</h3>
          <p class="value">3.4 mm</p>
          <span class="label">Evapotranspiration</span>
        </div>
      </div>

      <div class="main-sections">
        <div class="card chart-container">
          <h3>Vegetation Trend (NDVI)</h3>
          <div class="mock-chart">[ Chart Visualization Area ]</div>
        </div>
        <div class="card actions-container">
          <h3>Recommended Actions</h3>
          <ul>
            <li>
              <strong>Wheat - Farm A:</strong> Irrigate 5mm before sunset.
              <span class="status-badge urgent">High Priority</span>
            </li>
            <li>
              <strong>Maize - North Field:</strong> Nitrogen application due tomorrow.
              <span class="status-badge">Planned</span>
            </li>
            <li>
              <strong>Soil Analysis:</strong> Check pH for West Plot.
              <span class="status-badge info">Recommendation</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { padding: 30px; }
    h1 { font-size: 28px; margin-bottom: 25px; color: #1a2a1a; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #eef0ee; transition: 0.3s; }
    .card:hover { transform: translateY(-3px); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .stat h3 { font-size: 14px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
    .stat .value { font-size: 32px; font-weight: 700; margin: 10px 0; color: #1a2a1a; }
    .color-green { color: #4caf50 !important; }
    .color-orange { color: #ff9800 !important; }
    .stat .label { font-size: 12px; color: #6b7280; }
    .main-sections { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    .mock-chart { height: 250px; background: #fdfdfd; display: flex; align-items: center; justify-content: center; color: #ccc; border: 1px dashed #eee; font-style: italic; }
    .actions-container ul { list-style: none; padding: 0; }
    .actions-container li { padding: 15px; border-bottom: 1px solid #f5f5f5; font-size: 14px; line-height: 1.5; }
    .status-badge { font-size: 10px; padding: 3px 8px; border-radius: 10px; margin-left: 5px; background: #e0e0e0; }
    .status-badge.urgent { background: #ffebee; color: #c62828; }
    .status-badge.info { background: #e3f2fd; color: #1565c0; }
  `]
})
export class DashboardComponent { }
