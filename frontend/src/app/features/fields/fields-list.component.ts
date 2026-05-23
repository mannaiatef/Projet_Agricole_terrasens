import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';

import { FieldService, Field } from '../../core/services/field.service';

@Component({
  selector: 'app-fields-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatTableModule,
  ],
  template: `
    <div class="fields-list">
      <!-- Header Section -->
      <div class="list-header">
        <h1>🌾 Farm Fields Overview</h1>
        <p class="subtitle">
          Manage and monitor all fields in your farm
        </p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner color="primary"></mat-spinner>
        <p>Loading fields...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !loading" class="error-message">
        <mat-icon>error</mat-icon>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="refreshFields()">
          <mat-icon>refresh</mat-icon>
          Retry
        </button>
      </div>

      <!-- Fields List Content -->
      <div *ngIf="!loading && !error && fields.length > 0" class="content">
        <!-- Action Bar -->
        <div class="action-bar">
          <button
            mat-raised-button
            color="accent"
            (click)="syncAllFields()"
            [disabled]="syncing"
            matTooltip="Sync all fields with weather and satellite data"
          >
            <mat-icon *ngIf="!syncing">cloud_download</mat-icon>
            <mat-spinner *ngIf="syncing" diameter="20"></mat-spinner>
            {{ syncing ? 'Syncing...' : 'Sync All Fields' }}
          </button>

          <button
            mat-raised-button
            color="primary"
            routerLink="/fields/create"
            matTooltip="Create a new field"
          >
            <mat-icon>add</mat-icon>
            Create Field
          </button>

          <button
            mat-raised-button
            color="primary"
            (click)="refreshFields()"
            matTooltip="Refresh fields list"
          >
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>

        <!-- Fields Grid Summary -->
        <div class="fields-grid">
          <div
            *ngFor="let field of fields"
            mat-card
            class="field-card"
            [routerLink]="['/fields', field.id]"
          >
            <mat-card-header>
              <mat-card-title>{{ field.field_code }}</mat-card-title>
              <mat-card-subtitle>{{ field.crop_type }}</mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <!-- Quick Stats -->
              <div class="quick-stats">
                <div class="stat">
                  <span class="label">Area</span>
                  <span class="value">{{ field.area }} ha</span>
                </div>
                <div class="stat">
                  <span class="label">NDVI</span>
                  <span class="value" [ngStyle]="{ color: getNDVIColor(field.satellite?.ndvi || 0) }">
                    {{ field.satellite?.ndvi?.toFixed(2) || 'N/A' }}
                  </span>
                </div>
                <div class="stat">
                  <span class="label">Stress</span>
                  <span
                    class="value"
                    [ngStyle]="{ color: getStressColor(field.stress?.water_stress_level || 'none') }"
                  >
                    {{ field.stress?.water_stress_score || 0 }}/100
                  </span>
                </div>
              </div>

              <!-- Data Freshness -->
              <div class="data-freshness">
                <small>Last Updated: {{ field.data_freshness || 'N/A' }}</small>
              </div>

              <!-- Status Indicators -->
              <div class="status-indicators">
                <mat-chip-set aria-label="status indicators">
                  <mat-chip class="irrigation-chip">
                    {{ getIrrigationStatusLabel(field.irrigation_status) }}
                  </mat-chip>
                  <mat-chip class="stress-chip">
                    {{ getStressIcon(field.stress?.water_stress_level || 'none') }}
                  </mat-chip>
                </mat-chip-set>
              </div>

              <!-- Alerts Preview -->
              <div class="alerts-preview" *ngIf="field.alerts && field.alerts.length > 0">
                <p class="alerts-title">
                  ⚠️ {{ field.alerts.length }} Alert(s)
                </p>
                <div class="alerts-list">
                  <span *ngFor="let alert of field.alerts.slice(0, 2)" class="alert-badge">
                    {{ alert.substring(0, 30) }}...
                  </span>
                </div>
              </div>

              <div class="no-alerts" *ngIf="!field.alerts || field.alerts.length === 0">
                <p>✅ No active alerts</p>
              </div>
            </mat-card-content>

            <!-- Action Buttons -->
            <mat-card-actions>
              <button
                mat-stroked-button
                color="primary"
                [routerLink]="['/fields', field.id]"
                (click)="$event.stopPropagation()"
              >
                <mat-icon>dashboard</mat-icon>
                Dashboard
              </button>
              <button 
                mat-stroked-button 
                color="accent"
                (click)="irrigateField(field.id); $event.stopPropagation()"
              >
                <mat-icon>water_drop</mat-icon>
                Irrigate
              </button>
            </mat-card-actions>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && !error && fields.length === 0" class="empty-state">
        <mat-icon class="empty-icon">agriculture</mat-icon>
        <h2>No Fields Found</h2>
        <p>Create a new field to get started</p>
        <button mat-raised-button color="primary" routerLink="/fields/create">
          <mat-icon>add</mat-icon>
          Create Field
        </button>
      </div>
    </div>
  `,
  styles: [`
    .fields-list {
      padding: 30px;
      background: #fafbfa;
      min-height: 100vh;
    }

    .list-header {
      margin-bottom: 32px;
    }

    .list-header h1 {
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

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 60px 20px;
      color: #6b7280;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 8px;
      color: #c62828;
      margin: 20px 0;
    }

    .error-message mat-icon {
      font-size: 24px;
      height: 24px;
      width: 24px;
    }

    .content {
      margin-top: 24px;
    }

    .action-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .action-bar button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      margin-top: 24px;
    }

    .field-card {
      cursor: pointer;
      transition: all 0.3s ease;
      background: white;
      border: 1px solid #f0f2f0;
    }

    .field-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-color: #4caf50;
    }

    .field-card mat-card-header {
      margin-bottom: 16px;
    }

    .field-card mat-card-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a2a1a;
      margin: 0;
    }

    .field-card mat-card-subtitle {
      font-size: 13px;
      color: #6b7280;
      margin: 4px 0 0;
    }

    .quick-stats {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f2f0;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
      text-align: center;
    }

    .stat .label {
      font-size: 11px;
      text-transform: uppercase;
      color: #9ca3af;
      letter-spacing: 0.5px;
    }

    .stat .value {
      font-size: 16px;
      font-weight: 700;
      color: #1a2a1a;
    }

    .data-freshness {
      margin-bottom: 12px;
      color: #6b7280;
    }

    .status-indicators {
      margin-bottom: 12px;
    }

    .irrigation-chip, .stress-chip {
      margin: 4px !important;
    }

    .alerts-preview {
      margin-bottom: 12px;
      padding: 12px;
      background: #fffbeb;
      border-radius: 6px;
      border-left: 3px solid #f59e0b;
    }

    .alerts-title {
      font-size: 12px;
      font-weight: 600;
      color: #92400e;
      margin: 0 0 8px;
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .alert-badge {
      font-size: 11px;
      color: #78350f;
      background: white;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
    }

    .no-alerts {
      padding: 8px 0;
      color: #047857;
      font-size: 13px;
    }

    mat-card-actions {
      padding: 12px 16px;
      border-top: 1px solid #f0f2f0;
      display: flex;
      gap: 8px;
    }

    mat-card-actions button {
      flex: 1;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      border: 1px solid #f0f2f0;
    }

    .empty-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #d1d5db;
      margin: 0 auto 16px;
    }

    .empty-state h2 {
      font-size: 20px;
      color: #1a2a1a;
      margin: 0 0 8px;
    }

    .empty-state p {
      color: #6b7280;
      margin: 0 0 24px;
    }

    @media (max-width: 1024px) {
      .fields-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }

      .action-bar {
        flex-direction: column;
      }

      .action-bar button {
        width: 100%;
      }
    }

    @media (max-width: 640px) {
      .fields-list {
        padding: 16px;
      }

      .list-header h1 {
        font-size: 22px;
      }

      .fields-grid {
        grid-template-columns: 1fr;
      }

      .quick-stats {
        grid-template-columns: 1fr;
        gap: 8px;
      }
    }
  `]
})
export class FieldsListComponent implements OnInit {
  fields: Field[] = [];
  loading = false;
  error: string | null = null;
  syncing = false;

  constructor(private fieldService: FieldService) {}

  ngOnInit(): void {
    this.loadFields();
  }

  loadFields(): void {
    this.loading = true;
    this.error = null;
    
    this.fieldService.getFields().subscribe({
      next: (response) => {
        this.fields = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load fields. Please try again.';
        this.loading = false;
        console.error('Error loading fields:', err);
      }
    });
  }

  refreshFields(): void {
    this.loadFields();
  }

  syncAllFields(): void {
    this.syncing = true;
    
    this.fieldService.syncAllFields().subscribe({
      next: (response) => {
        this.fields = response.data;
        this.syncing = false;
      },
      error: (err) => {
        this.error = 'Failed to sync fields.';
        this.syncing = false;
        console.error('Error syncing fields:', err);
      }
    });
  }

  irrigateField(fieldId: number): void {
    this.fieldService.irrigateField(fieldId).subscribe({
      next: (response) => {
        const index = this.fields.findIndex(f => f.id === fieldId);
        if (index > -1) {
          this.fields[index] = response.data;
        }
      },
      error: (err) => {
        console.error('Error irrigating field:', err);
      }
    });
  }

  getNDVIColor(ndvi: number): string {
    if (ndvi > 0.6) return '#22c55e';
    if (ndvi > 0.5) return '#84cc16';
    if (ndvi > 0.3) return '#f59e0b';
    return '#ef4444';
  }

  getNDVIStatus(ndvi: number): string {
    if (ndvi > 0.6) return '✅ Excellent';
    if (ndvi > 0.5) return '👍 Good';
    if (ndvi > 0.3) return '⚠️ Moderate';
    return '🔴 Poor';
  }

  getStressColor(stressLevel: string | undefined): string {
    const level = (stressLevel || 'none').toLowerCase();
    if (level === 'high') return '#ef4444';
    if (level === 'moderate') return '#f59e0b';
    if (level === 'low') return '#22c55e';
    return '#9ca3af';
  }

  getStressIcon(stressLevel: string | undefined): string {
    const level = (stressLevel || 'none').toLowerCase();
    if (level === 'high') return '🔴';
    if (level === 'moderate') return '⚠️';
    if (level === 'low') return '✅';
    return '➖';
  }

  getIrrigationStatusLabel(status: string | undefined): string {
    const s = (status || 'inactive').toLowerCase();
    if (s === 'active') return '💧 Active';
    if (s === 'scheduled') return '⏰ Scheduled';
    return '⏸️ Inactive';
  }
}
