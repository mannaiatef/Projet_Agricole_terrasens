import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-satellite',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="satellite-page">
      <h1>🛰️ Satellite Analysis</h1>
      <p>NDVI monitoring, vegetation health trends, and satellite data visualization</p>
      <div class="info-card">
        <p>Satellite analysis interface coming soon...</p>
      </div>
    </div>
  `,
  styles: [`
    .satellite-page { padding: 30px; }
    h1 { color: #1a2a1a; }
    .info-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #eee; }
  `]
})
export class SatelliteComponent { }
