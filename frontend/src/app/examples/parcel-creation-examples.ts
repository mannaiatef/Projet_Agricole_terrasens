/**
 * Example: Using the Map-Based Parcel Drawing System
 * 
 * This file demonstrates how to integrate the new parcel creation
 * components into your Angular application.
 */

// ========================================
// OPTION 1: Simple Map Drawing Only
// ========================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParcelDrawerComponent, ParcelDrawData } from './components/parcel-drawer/parcel-drawer.component';

@Component({
  selector: 'app-simple-parcel-creation',
  standalone: true,
  imports: [CommonModule, ParcelDrawerComponent],
  template: `
    <div class="container">
      <h1>Create Parcel - Draw on Map</h1>
      
      <app-parcel-drawer
        [defaultCenter]="[35.3, -2.9]"
        [defaultZoom]="8"
        (geometryDrawn)="handleGeometryDrawn($event)"
        (geometryCleared)="handleGeometryCleared()"
      ></app-parcel-drawer>

      <div *ngIf="currentGeometry" class="drawn-data">
        <h3>Drawn Parcel Data</h3>
        <p><strong>Area:</strong> {{ (currentGeometry.area / 10000).toFixed(2) }} ha</p>
        <p><strong>Vertices:</strong> {{ currentGeometry.pointCount }}</p>
        <p><strong>Center:</strong> {{ currentGeometry.center[0].toFixed(4) }}°, {{ currentGeometry.center[1].toFixed(4) }}°</p>
        
        <button (click)="submitGeometry()">Submit to Backend</button>
      </div>
    </div>
  `
})
export class SimpleParcelCreationComponent {
  currentGeometry: ParcelDrawData | null = null;

  handleGeometryDrawn(data: ParcelDrawData) {
    this.currentGeometry = data;
    console.log('Parcel drawn:', data);
  }

  handleGeometryCleared() {
    this.currentGeometry = null;
  }

  submitGeometry() {
    if (!this.currentGeometry) return;

    const parcelData = {
      name: prompt('Enter parcel name:') || 'Unnamed Parcel',
      geometry: this.currentGeometry.geometry,
      latitude: this.currentGeometry.center[0],
      longitude: this.currentGeometry.center[1],
      surface: this.currentGeometry.area
    };

    console.log('Submitting parcel:', parcelData);
    // Call your ParcelService to save
  }
}

// ========================================
// OPTION 2: Complete Multi-Step Form
// ========================================

import { ParcelFormDrawerComponent } from './components/parcel-form-drawer/parcel-form-drawer.component';

@Component({
  selector: 'app-complete-parcel-creation',
  standalone: true,
  imports: [ParcelFormDrawerComponent],
  template: `
    <div class="container">
      <h1>Create New Parcel</h1>
      <app-parcel-form-drawer
        [editMode]="false"
        [editingParcel]="null"
      ></app-parcel-form-drawer>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      text-align: center;
      color: #667eea;
      margin-bottom: 30px;
    }
  `]
})
export class CompleteParcelCreationComponent {}

// ========================================
// OPTION 3: Edit Existing Parcel
// ========================================

import { ActivatedRoute } from '@angular/router';
import { ParcelService } from './services/parcel.service';
import { Parcel } from './models/parcel.model';

@Component({
  selector: 'app-parcel-edit',
  standalone: true,
  imports: [ParcelFormDrawerComponent, CommonModule],
  template: `
    <div class="container">
      <h1>Edit Parcel</h1>
      <p *ngIf="isLoading">Loading parcel data...</p>
      
      <app-parcel-form-drawer
        *ngIf="parcel"
        [editMode]="true"
        [editingParcel]="parcel"
      ></app-parcel-form-drawer>
    </div>
  `
})
export class ParcelEditComponent {
  parcel: Parcel | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private parcelService: ParcelService
  ) {
    this.loadParcel();
  }

  loadParcel() {
    const id = this.route.snapshot.params['id'];
    this.isLoading = true;

    this.parcelService.getParcelById(id).subscribe({
      next: (parcel) => {
        this.parcel = parcel;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load parcel:', error);
        this.isLoading = false;
      }
    });
  }
}

// ========================================
// OPTION 4: Parcel Management Dashboard
// ========================================

@Component({
  selector: 'app-parcel-dashboard',
  standalone: true,
  imports: [CommonModule, ParcelFormDrawerComponent],
  template: `
    <div class="dashboard">
      <div class="header">
        <h1>My Parcels</h1>
        <button (click)="showCreateForm = true" class="btn-primary">
          + Create Parcel
        </button>
      </div>

      <!-- Create Form Modal -->
      <div *ngIf="showCreateForm" class="modal-overlay">
        <div class="modal">
          <button (click)="showCreateForm = false" class="close-btn">×</button>
          <app-parcel-form-drawer
            [editMode]="false"
            [editingParcel]="null"
          ></app-parcel-form-drawer>
        </div>
      </div>

      <!-- Parcels List -->
      <div class="parcels-grid">
        <div *ngFor="let parcel of parcels" class="parcel-card">
          <h3>{{ parcel.name }}</h3>
          <div class="parcel-info">
            <p><strong>Area:</strong> {{ (parcel.surface / 10000).toFixed(2) }} ha</p>
            <p><strong>Location:</strong> {{ parcel.latitude.toFixed(2) }}°, {{ parcel.longitude.toFixed(2) }}°</p>
            <p *ngIf="parcel.crop_id"><strong>Crop:</strong> Crop #{{ parcel.crop_id }}</p>
          </div>
          <div class="actions">
            <button (click)="editParcel(parcel)">Edit</button>
            <button (click)="deleteParcel(parcel.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    .parcels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .parcel-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .parcel-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 1000px;
      max-height: 90vh;
      overflow: auto;
      position: relative;
    }
    .close-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      z-index: 10;
    }
  `]
})
export class ParcelDashboardComponent {
  parcels: Parcel[] = [];
  showCreateForm = false;

  constructor(private parcelService: ParcelService) {
    this.loadParcels();
  }

  loadParcels() {
    this.parcelService.getParcels().subscribe({
      next: (parcels) => {
        this.parcels = parcels;
      },
      error: (error) => console.error('Failed to load parcels:', error)
    });
  }

  editParcel(parcel: Parcel) {
    // Navigate to edit page or open edit form
    console.log('Edit parcel:', parcel);
  }

  deleteParcel(id: number) {
    if (confirm('Delete this parcel?')) {
      this.parcelService.deleteParcel(id).subscribe({
        next: () => {
          this.parcels = this.parcels.filter(p => p.id !== id);
        },
        error: (error) => console.error('Failed to delete parcel:', error)
      });
    }
  }
}

// ========================================
// INTEGRATION CHECKLIST
// ========================================

/*
Before using these components, ensure:

1. ✓ Frontend Dependencies Installed
   npm install leaflet leaflet-draw @types/leaflet @types/leaflet-draw

2. ✓ CSS Imported in styles.css
   @import 'leaflet/dist/leaflet.css';
   @import 'leaflet-draw/dist/leaflet.draw.css';
   @import 'styles/leaflet-overrides.css';

3. ✓ ParcelService Created
   Services for CRUD operations with the backend

4. ✓ Backend Endpoints Ready
   - POST /parcelles (create with geometry)
   - GET /parcelles (list)
   - GET /parcelles/:id (single)
   - PUT /parcelles/:id (update)
   - DELETE /parcelles/:id (delete)

5. ✓ Models Imported
   import { Parcel, ParcelDrawData, CreateParcelRequest } from './models/parcel.model';

6. ✓ Services Imported
   import { MapDrawingService } from './services/map-drawing.service';
   import { ParcelService } from './services/parcel.service';

7. ✓ Components Imported as Standalone
   All components are standalone and self-contained

8. ✓ HTTP Module Available
   HttpClientModule in AppModule or root providers

API Response Format Expected:
{
  "success": true,
  "message": "Parcel created successfully",
  "data": {
    "id": 1,
    "name": "Field A",
    "polygon": { ... },
    "geometry": { "type": "Feature", "geometry": { ... }, ... },
    "surface": 50000,
    "latitude": 35.5,
    "longitude": -2.8,
    ...
  }
}
*/
