import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FieldService, Field } from '../../core/services/field.service';
import { SatelliteMapComponent } from './satellite-map.component';

@Component({
  selector: 'app-satellite',
  standalone: true,
  imports: [CommonModule, FormsModule, SatelliteMapComponent],
  template: `
    <div class="satellite-page">
      <div class="page-header">
        <div class="header-left">
          <h1>🛰️ Satellite & NDVI</h1>
          <p>Sélectionnez une parcelle pour visualiser son image satellite Sentinel</p>
        </div>
      </div>

      <!-- Field Selection -->
      <div class="selection-section">
        <div class="field-selector">
          <label for="fieldSelect">Parcelle</label>
          <select
            id="fieldSelect"
            [(ngModel)]="selectedFieldId"
            (ngModelChange)="onFieldChange($event)"
            class="field-select"
          >
            <option [value]="null" disabled>Choisir une parcelle...</option>
            <option *ngFor="let field of fields" [value]="field.id">
              #{{ field.id }} - {{ field.name || 'Parcelle ' + field.id }} ({{ field.crop_type || 'N/A' }})
            </option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-section">
        <div class="spinner"></div>
        <p>Chargement des parcelles...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="error-card">
        <p>{{ error }}</p>
        <button class="btn-retry" (click)="loadFields()">Réessayer</button>
      </div>

      <!-- Satellite Map -->
      <div *ngIf="selectedFieldId && !loading" class="viewer-section">
        <app-satellite-map [fieldId]="selectedFieldId"></app-satellite-map>
      </div>

      <!-- Empty State -->
      <div *ngIf="!selectedFieldId && !loading && !error" class="empty-state">
        <div class="empty-icon">🛰️</div>
        <h3>Aucune parcelle sélectionnée</h3>
        <p>Choisissez une parcelle dans la liste ci-dessus pour afficher son image satellite Sentinel avec l'indice NDVI.</p>
      </div>
    </div>
  `,
  styles: [`
    .satellite-page {
      padding: 30px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .page-header {
      margin-bottom: 24px;
    }
    .header-left h1 {
      margin: 0 0 5px;
      color: #1a2a1a;
      font-size: 28px;
    }
    .header-left p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }

    /* Field Selector */
    .selection-section {
      background: white;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .field-selector {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .field-selector label {
      font-size: 14px;
      font-weight: 600;
      color: #334155;
    }
    .field-select {
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 15px;
      color: #0f172a;
      background: #f8fafc;
      transition: border-color 0.2s;
      cursor: pointer;
      max-width: 500px;
    }
    .field-select:focus {
      outline: none;
      border-color: #22c55e;
      box-shadow: 0 0 0 3px rgba(34,197,94,0.1);
    }

    /* Loading */
    .loading-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      color: #64748b;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #22c55e;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }

    /* Error */
    .error-card {
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 24px;
      border-radius: 12px;
      text-align: center;
      color: #b91c1c;
    }
    .btn-retry {
      margin-top: 12px;
      padding: 8px 20px;
      background: white;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #b91c1c;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-retry:hover {
      background: #fef2f2;
    }

    /* Viewer */
    .viewer-section {
      animation: fadeIn 0.3s ease-in;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: #64748b;
    }
    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    .empty-state h3 {
      color: #334155;
      margin: 0 0 8px;
    }
    .empty-state p {
      margin: 0;
      max-width: 400px;
      margin: 0 auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SatelliteComponent implements OnInit {
  fields: Field[] = [];
  selectedFieldId: number | null = null;
  loading = false;
  error: string | null = null;

  constructor(private fieldService: FieldService) {}

  ngOnInit(): void {
    this.loadFields();
  }

  loadFields(): void {
    this.loading = true;
    this.error = null;

    this.fieldService.getFields().subscribe({
      next: (response) => {
        this.fields = response.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Impossible de charger la liste des parcelles. Vérifiez que le service est accessible.';
        console.error('Error loading fields:', err);
      }
    });
  }

  onFieldChange(fieldId: number): void {
    this.selectedFieldId = fieldId;
  }
}
