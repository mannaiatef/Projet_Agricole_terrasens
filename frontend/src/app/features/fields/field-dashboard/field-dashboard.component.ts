import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SentinelImageViewerComponent } from '../../../components/sentinel-image-viewer/sentinel-image-viewer.component';

@Component({
  selector: 'app-field-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SentinelImageViewerComponent],
  template: `
    <div class="field-dashboard-page">
      <div class="page-header">
        <div class="header-left">
          <h1>🌾 Field Dashboard</h1>
          <p class="subtitle">Satellite imagery and analysis for field #{{ fieldId }}</p>
        </div>
        <a routerLink="/app/fields" class="btn-back">← Back to Fields</a>
      </div>

      <div class="content" *ngIf="fieldId">
        <app-sentinel-image-viewer [fieldId]="+fieldId"></app-sentinel-image-viewer>
      </div>

      <div class="content" *ngIf="!fieldId">
        <div class="error-card">
          <p>⚠️ Invalid field ID</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .field-dashboard-page {
      padding: 30px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 15px;
    }
    .header-left h1 {
      margin: 0 0 5px;
      color: #1a2a1a;
      font-size: 28px;
    }
    .subtitle {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }
    .btn-back {
      display: inline-block;
      padding: 10px 20px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      color: #1a2a1a;
      text-decoration: none;
      font-size: 14px;
      transition: all 0.2s;
    }
    .btn-back:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .content {
      animation: fadeIn 0.3s ease-in;
    }
    .error-card {
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      color: #b91c1c;
      font-size: 16px;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class FieldDashboardComponent implements OnInit {
  fieldId: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.fieldId = this.route.snapshot.paramMap.get('fieldId');
  }
}
