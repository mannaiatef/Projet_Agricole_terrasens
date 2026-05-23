import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FieldService, CreateFieldRequest } from '../../core/services/field.service';

@Component({
  selector: 'app-field-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="field-form-container">
      <div class="form-header">
        <button mat-icon-button (click)="goBack()" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-text">
          <h1>{{ isEdit ? '✏️ Edit Field' : '➕ Create New Field' }}</h1>
          <p class="subtitle">{{ isEdit ? 'Update field information' : 'Add a new field to your farm' }}</p>
        </div>
      </div>

      <mat-card class="form-card">
        <mat-card-content>
          <form [formGroup]="fieldForm" (ngSubmit)="onSubmit()">
            <!-- Field Code -->
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Field Code</mat-label>
              <input 
                matInput 
                formControlName="field_code"
                placeholder="e.g., FIELD-001"
                required
              />
              <mat-icon matPrefix>tag</mat-icon>
              <mat-error *ngIf="fieldForm.get('field_code')?.hasError('required')">
                Field code is required
              </mat-error>
            </mat-form-field>

            <!-- Field Name -->
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Field Name</mat-label>
              <input 
                matInput 
                formControlName="name"
                placeholder="e.g., North Plot"
                required
              />
              <mat-icon matPrefix>location_on</mat-icon>
              <mat-error *ngIf="fieldForm.get('name')?.hasError('required')">
                Field name is required
              </mat-error>
            </mat-form-field>

            <!-- Crop Type -->
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Crop Type</mat-label>
              <mat-select formControlName="crop_type" required>
                <mat-option value="">-- Select Crop --</mat-option>
                <mat-option value="Wheat">Wheat</mat-option>
                <mat-option value="Maize">Maize</mat-option>
                <mat-option value="Rice">Rice</mat-option>
                <mat-option value="Cotton">Cotton</mat-option>
                <mat-option value="Soybean">Soybean</mat-option>
                <mat-option value="Barley">Barley</mat-option>
                <mat-option value="Oats">Oats</mat-option>
                <mat-option value="Hay">Hay</mat-option>
                <mat-option value="Other">Other</mat-option>
              </mat-select>
              <mat-icon matPrefix>grass</mat-icon>
              <mat-error *ngIf="fieldForm.get('crop_type')?.hasError('required')">
                Crop type is required
              </mat-error>
            </mat-form-field>

            <!-- Soil Type -->
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Soil Type</mat-label>
              <mat-select formControlName="soil_type">
                <mat-option value="">-- Select Soil Type --</mat-option>
                <mat-option value="Clay">Clay</mat-option>
                <mat-option value="Loam">Loam</mat-option>
                <mat-option value="Sandy">Sandy</mat-option>
                <mat-option value="Silt">Silt</mat-option>
                <mat-option value="Peat">Peat</mat-option>
              </mat-select>
              <mat-icon matPrefix>public</mat-icon>
            </mat-form-field>

            <!-- Area -->
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Area (hectares)</mat-label>
              <input 
                matInput 
                type="number"
                step="0.01"
                formControlName="area"
                placeholder="e.g., 5.5"
                required
              />
              <mat-icon matPrefix>straighten</mat-icon>
              <mat-error *ngIf="fieldForm.get('area')?.hasError('required')">
                Area is required
              </mat-error>
              <mat-error *ngIf="fieldForm.get('area')?.hasError('min')">
                Area must be greater than 0
              </mat-error>
            </mat-form-field>

            <!-- Latitude -->
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Latitude</mat-label>
              <input 
                matInput 
                type="number"
                step="0.0001"
                formControlName="latitude"
                placeholder="e.g., 35.7595"
                required
              />
              <mat-icon matPrefix>location_on</mat-icon>
              <mat-error *ngIf="fieldForm.get('latitude')?.hasError('required')">
                Latitude is required
              </mat-error>
            </mat-form-field>

            <!-- Longitude -->
            <mat-form-field class="full-width" appearance="outline">
              <mat-label>Longitude</mat-label>
              <input 
                matInput 
                type="number"
                step="0.0001"
                formControlName="longitude"
                placeholder="e.g., 139.7604"
                required
              />
              <mat-icon matPrefix>location_on</mat-icon>
              <mat-error *ngIf="fieldForm.get('longitude')?.hasError('required')">
                Longitude is required
              </mat-error>
            </mat-form-field>

            <!-- Error Message -->
            <div *ngIf="error" class="error-message">
              <mat-icon>error</mat-icon>
              <p>{{ error }}</p>
            </div>

            <!-- Action Buttons -->
            <div class="form-actions">
              <button 
                mat-stroked-button 
                color="primary"
                type="button"
                (click)="goBack()"
              >
                <mat-icon>cancel</mat-icon>
                Cancel
              </button>

              <button 
                mat-raised-button 
                color="accent"
                type="submit"
                [disabled]="!fieldForm.valid || loading"
              >
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <mat-icon *ngIf="!loading">{{ isEdit ? 'edit' : 'add' }}</mat-icon>
                {{ loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Field' : 'Create Field') }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .field-form-container {
      padding: 30px;
      background: #fafbfa;
      min-height: 100vh;
    }

    .form-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }

    .back-btn {
      color: #1a2a1a;
    }

    .header-text h1 {
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

    .form-card {
      max-width: 600px;
      background: white;
      border: 1px solid #f0f2f0;
    }

    .form-card mat-card-content {
      padding: 32px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      width: 100%;
    }

    mat-form-field ::ng-deep .mat-form-field-outline {
      color: #e5e7eb !important;
    }

    mat-form-field ::ng-deep .mat-form-field-outline-thick {
      color: #4caf50 !important;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 8px;
      color: #c62828;
      margin: 12px 0;
    }

    .error-message mat-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
      flex-shrink: 0;
    }

    .error-message p {
      margin: 0;
      font-size: 14px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      justify-content: flex-end;
    }

    .form-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
    }

    mat-spinner {
      margin-right: 8px;
    }

    @media (max-width: 640px) {
      .field-form-container {
        padding: 16px;
      }

      .form-card {
        max-width: 100%;
      }

      .form-card mat-card-content {
        padding: 16px;
      }

      .header-text h1 {
        font-size: 22px;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button {
        width: 100%;
      }
    }
  `]
})
export class FieldFormComponent implements OnInit {
  fieldForm!: FormGroup;
  loading = false;
  error: string | null = null;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private fieldService: FieldService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Could add edit mode initialization here if needed
  }

  private initializeForm(): void {
    this.fieldForm = this.fb.group({
      field_code: ['', [Validators.required]],
      name: ['', [Validators.required]],
      crop_type: ['', [Validators.required]],
      soil_type: [''],
      area: ['', [Validators.required, Validators.min(0.01)]],
      latitude: ['', [Validators.required]],
      longitude: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (!this.fieldForm.valid) {
      return;
    }

    this.loading = true;
    this.error = null;

    const request: CreateFieldRequest = {
      field_code: this.fieldForm.get('field_code')?.value,
      name: this.fieldForm.get('name')?.value,
      crop_type: this.fieldForm.get('crop_type')?.value,
      soil_type: this.fieldForm.get('soil_type')?.value || undefined,
      area: parseFloat(this.fieldForm.get('area')?.value),
      latitude: parseFloat(this.fieldForm.get('latitude')?.value),
      longitude: parseFloat(this.fieldForm.get('longitude')?.value),
    };

    this.fieldService.createField(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigate(['/fields', response.data.id]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to create field. Please try again.';
        console.error('Error creating field:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/fields']);
  }
}
