import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SentinelImageViewerComponent } from './sentinel-image-viewer.component';
import { SentinelHubService } from '../../services/sentinel-hub.service';
import { FieldInfo } from '../../models/sentinel-hub.model';

/**
 * EXAMPLE INTEGRATION: How to use SentinelImageViewerComponent
 * 
 * This example shows different scenarios:
 * 1. Basic integration with a selected field
 * 2. Multiple fields with tabs
 * 3. Field selector with real-time updates
 * 4. Dashboard layout with multiple viewers
 */

@Component({
  selector: 'app-sentinel-image-viewer-example',
  standalone: true,
  imports: [CommonModule, FormsModule, SentinelImageViewerComponent],
  template: `
    <div class="example-container">
      <!-- Example 1: Basic Usage -->
      <section class="example-section">
        <h2>Example 1: Basic Integration</h2>
        <p>Simple component with a selected field ID</p>
        
        <div class="example-code">
          <pre><code>&lt;app-sentinel-image-viewer 
  [fieldId]="selectedFieldId"&gt;
&lt;/app-sentinel-image-viewer&gt;</code></pre>
        </div>

        <div class="example-demo">
          <label>
            Select Field:
            <input 
              type="number" 
              [(ngModel)]="selectedFieldId" 
              min="1"
              placeholder="Enter field ID"
            />
          </label>
          <app-sentinel-image-viewer 
            [fieldId]="selectedFieldId">
          </app-sentinel-image-viewer>
        </div>
      </section>

      <!-- Example 2: Multiple Fields with Tabs -->
      <section class="example-section">
        <h2>Example 2: Multiple Fields with Tabs</h2>
        <p>Switch between different fields using tabs</p>

        <div class="tabs">
          <button 
            *ngFor="let field of fieldList"
            [class.active]="selectedField?.id === field.id"
            (click)="selectField(field)"
            class="tab-button"
          >
            {{ field.name }}
          </button>
        </div>

        <app-sentinel-image-viewer 
          *ngIf="selectedField"
          [fieldId]="selectedField.id">
        </app-sentinel-image-viewer>
      </section>

      <!-- Example 3: Dashboard Layout -->
      <section class="example-section">
        <h2>Example 3: Dashboard with Multiple Viewers</h2>
        <p>Display multiple field satellite images in a grid</p>

        <div class="grid-container">
          <app-sentinel-image-viewer 
            *ngFor="let field of dashboardFields; trackBy: trackByFieldId"
            [fieldId]="field.id"
            class="grid-item">
          </app-sentinel-image-viewer>
        </div>
      </section>

      <!-- Example 4: Service Usage -->
      <section class="example-section">
        <h2>Example 4: Direct Service Usage</h2>
        <p>Using the SentinelHubService directly for custom implementations</p>

        <div class="example-code">
          <pre><code>// In your component.ts
constructor(private sentinelService: SentinelHubService) {{}

loadImage() {{
  this.sentinelService.getFieldImage(fieldId, 'NDVI')
    .subscribe(
      (blob) => {{
        this.imageUrl = this.sentinelService.blobToObjectUrl(blob);
      }},
      (error) => console.error('Error:', error)
    );
}}

downloadImage() {{
  this.sentinelService.downloadImage(fieldId, 'NDVI')
    .subscribe((blob) => {{
      // Handle download
    }});
}}
</code></pre>
        </div>

        <button (click)="demonstrateServiceUsage()" class="demo-button">
          Load Image via Service
        </button>

        <div *ngIf="serviceImageUrl" class="service-demo">
          <h4>Image Loaded via Service:</h4>
          <img [src]="serviceImageUrl" alt="Service loaded image" />
        </div>
      </section>
    </div>
  `,
  styles: [`
    .example-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 2rem;
    }

    .example-section {
      margin-bottom: 3rem;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .example-section h2 {
      margin: 0 0 0.5rem 0;
      color: #2ecc71;
      font-size: 1.3rem;
    }

    .example-section > p {
      margin: 0 0 1.5rem 0;
      color: #666;
      font-size: 0.95rem;
    }

    .example-code {
      background: #f5f5f5;
      border-left: 4px solid #2ecc71;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 4px;
      overflow-x: auto;
    }

    .example-code pre {
      margin: 0;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      color: #333;
    }

    .example-demo {
      padding: 1.5rem;
      background: white;
      border-radius: 8px;
    }

    .example-demo label {
      display: block;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .example-demo input {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 200px;
      font-size: 1rem;
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      border-bottom: 2px solid #eee;
    }

    .tab-button {
      padding: 0.75rem 1.5rem;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      font-weight: 500;
      color: #666;
      transition: all 0.3s ease;

      &.active {
        color: #2ecc71;
        border-bottom-color: #2ecc71;
      }

      &:hover {
        color: #2ecc71;
      }
    }

    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
      margin-top: 1rem;
    }

    .grid-item {
      display: block;
    }

    .demo-button {
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(46, 204, 113, 0.35);
      }
    }

    .service-demo {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: rgba(46, 204, 113, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(46, 204, 113, 0.2);
    }

    .service-demo h4 {
      margin: 0 0 1rem 0;
      color: #2ecc71;
    }

    .service-demo img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }

    @media (max-width: 768px) {
      .grid-container {
        grid-template-columns: 1fr;
      }

      .example-section {
        padding: 1.5rem;
      }

      .example-demo input {
        width: 100%;
      }
    }
  `]
})
export class SentinelImageViewerExampleComponent implements OnInit {
  // Example 1: Basic usage
  selectedFieldId = 1;

  // Example 2: Multiple fields
  fieldList: FieldInfo[] = [];
  selectedField: FieldInfo | null = null;

  // Example 3: Dashboard
  dashboardFields: FieldInfo[] = [];

  // Example 4: Service usage
  serviceImageUrl: string | null = null;

  constructor(private sentinelService: SentinelHubService) {}

  ngOnInit(): void {
    this.loadFieldList();
    this.loadDashboardFields();
  }

  /**
   * Load sample field list
   */
  private loadFieldList(): void {
    // This would typically load from an API
    // For demo purposes, using sample data
    this.fieldList = [
      { 
        id: 1, 
        name: 'North Field', 
        cropType: 'Wheat',
        area: 12.5,
        season: 'Winter 2024',
        polygon: { type: 'Polygon', coordinates: [[[-2.456, 35.123]]] },
        coordinates: { latitude: 35.123, longitude: -2.456 },
        farmerId: 1,
        imageTypes: ['NDVI', 'TrueColor', 'Moisture'],
        status: 'active'
      },
      { 
        id: 2, 
        name: 'South Field', 
        cropType: 'Corn',
        area: 15.0,
        season: 'Summer 2024',
        polygon: { type: 'Polygon', coordinates: [[[-2.450, 35.100]]] },
        coordinates: { latitude: 35.100, longitude: -2.450 },
        farmerId: 1,
        imageTypes: ['NDVI', 'TrueColor', 'Moisture'],
        status: 'active'
      }
    ];
    this.selectedField = this.fieldList[0];
  }

  /**
   * Load dashboard fields
   */
  private loadDashboardFields(): void {
    this.dashboardFields = [
      { 
        id: 1, 
        name: 'North Field',
        cropType: 'Wheat',
        area: 12.5,
        season: 'Winter 2024',
        polygon: { type: 'Polygon', coordinates: [[[-2.456, 35.123]]] },
        coordinates: { latitude: 35.123, longitude: -2.456 },
        farmerId: 1,
        imageTypes: ['NDVI', 'TrueColor', 'Moisture'],
        status: 'active'
      },
      { 
        id: 2, 
        name: 'South Field',
        cropType: 'Corn',
        area: 15.0,
        season: 'Summer 2024',
        polygon: { type: 'Polygon', coordinates: [[[-2.450, 35.100]]] },
        coordinates: { latitude: 35.100, longitude: -2.450 },
        farmerId: 1,
        imageTypes: ['NDVI', 'TrueColor', 'Moisture'],
        status: 'active'
      }
    ];
  }

  /**
   * Select a field from the list
   */
  selectField(field: FieldInfo): void {
    this.selectedField = field;
  }

  /**
   * Track by function for ngFor
   */
  trackByFieldId(index: number, field: FieldInfo): number {
    return field.id;
  }

  /**
   * Demonstrate service usage
   */
  demonstrateServiceUsage(): void {
    const fieldId = this.selectedFieldId;
    
    this.sentinelService.getFieldImage(fieldId, 'NDVI').subscribe({
      next: (blob: Blob) => {
        this.serviceImageUrl = this.sentinelService.blobToObjectUrl(blob);
        console.log('Image loaded successfully');
      },
      error: (error) => {
        console.error('Error loading image:', error);
        alert('Failed to load image: ' + error.message);
      }
    });
  }
}
