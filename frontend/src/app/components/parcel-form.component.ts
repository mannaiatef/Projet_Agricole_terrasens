/**
 * Parcel Creation/Edit Component Example
 * Shows how to use the new Parcel model and service
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ParcelService } from '../services/parcel.service';
import { Parcel, CreateParcelRequest, GeoJSONPolygon } from '../models/stress.model';

@Component({
  selector: 'app-parcel-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, JsonPipe],
  templateUrl: './parcel-form.component.html',
  styleUrls: ['./parcel-form.component.css']
})
export class ParcelFormComponent implements OnInit {
  parcelForm: FormGroup;
  parcels: Parcel[] = [];
  selectedParcel: Parcel | null = null;
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Map-related properties
  mapInstance: any; // L.map instance from Leaflet
  drawnShapes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private parcelService: ParcelService
  ) {
    this.parcelForm = this.createForm();
  }

  ngOnInit() {
    this.loadParcels();
  }

  /**
   * Create form with validation
   */
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      latitude: ['', [Validators.required, this.latitudeValidator.bind(this)]],
      longitude: ['', [Validators.required, this.longitudeValidator.bind(this)]],
      surface: ['', [Validators.min(0)]],
      soil_type: [''],
      irrigation_type: [''],
      polygon: [null, Validators.required]
    });
  }

  /**
   * Load all parcels
   */
  loadParcels() {
    this.isLoading = true;
    this.error = null;

    this.parcelService.loadAndCacheParcels().subscribe({
      next: (parcels) => {
        this.parcels = parcels;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    });
  }

  /**
   * Create new parcel
   */
  createParcel() {
    if (this.parcelForm.invalid) {
      this.error = 'Please fill all required fields correctly';
      return;
    }

    // Get polygon from map or form
    const polygon = this.getPolygonFromMap();
    if (!polygon) {
      this.error = 'Please draw a polygon on the map';
      return;
    }

    const formValue = this.parcelForm.value;
    const parcelData: CreateParcelRequest = {
      name: formValue.name,
      latitude: parseFloat(formValue.latitude),
      longitude: parseFloat(formValue.longitude),
      polygon: polygon,
      surface: formValue.surface ? parseFloat(formValue.surface) : undefined,
      soil_type: formValue.soil_type || undefined,
      irrigation_type: formValue.irrigation_type || undefined
    };

    // Validate before sending
    const validation = this.parcelService.validateParcelData(parcelData);
    if (!validation.valid) {
      this.error = validation.errors.join(', ');
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.parcelService.createParcel(parcelData).subscribe({
      next: (parcel) => {
        this.successMessage = `Parcel "${parcel.name}" created successfully!`;
        this.parcelForm.reset();
        this.parcels.push(parcel);
        this.isLoading = false;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    });
  }

  /**
   * Update existing parcel
   */
  updateParcel(parcelId: number) {
    if (this.parcelForm.invalid) {
      this.error = 'Please fill all required fields correctly';
      return;
    }

    const formValue = this.parcelForm.value;
    const updateData: Partial<CreateParcelRequest> = {
      name: formValue.name,
      latitude: parseFloat(formValue.latitude),
      longitude: parseFloat(formValue.longitude),
      surface: formValue.surface ? parseFloat(formValue.surface) : undefined,
      soil_type: formValue.soil_type || undefined,
      irrigation_type: formValue.irrigation_type || undefined
    };

    this.isLoading = true;
    this.error = null;

    this.parcelService.updateParcel(parcelId, updateData).subscribe({
      next: (parcel) => {
        this.successMessage = `Parcel updated successfully!`;
        const index = this.parcels.findIndex(p => p.id === parcelId);
        if (index > -1) {
          this.parcels[index] = parcel;
        }
        this.isLoading = false;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    });
  }

  /**
   * Delete parcel
   */
  deleteParcel(parcelId: number) {
    if (!confirm('Are you sure you want to delete this parcel?')) {
      return;
    }

    this.parcelService.deleteParcel(parcelId).subscribe({
      next: () => {
        this.parcels = this.parcels.filter(p => p.id !== parcelId);
        this.successMessage = 'Parcel deleted successfully!';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message;
      }
    });
  }

  /**
   * Edit existing parcel in form
   */
  editParcel(parcel: Parcel) {
    this.selectedParcel = parcel;
    this.parcelForm.patchValue({
      name: parcel.name,
      latitude: parcel.latitude,
      longitude: parcel.longitude,
      surface: parcel.surface,
      soil_type: parcel.soil_type,
      irrigation_type: parcel.irrigation_type,
      polygon: parcel.polygon
    });
  }

  /**
   * Assign crop to parcel
   */
  assignCrop(parcelId: number, cropId: number, sowingDate: string) {
    this.parcelService.assignCrop(parcelId, cropId, sowingDate).subscribe({
      next: (parcel) => {
        const index = this.parcels.findIndex(p => p.id === parcelId);
        if (index > -1) {
          this.parcels[index] = parcel;
        }
        this.successMessage = 'Crop assigned and calendar generated!';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.message;
      }
    });
  }

  /**
   * Get polygon from map drawing tool (Leaflet-Draw)
   * or return form value
   */
  private getPolygonFromMap(): GeoJSONPolygon | null {
    if (this.drawnShapes.length > 0) {
      const lastShape = this.drawnShapes[this.drawnShapes.length - 1];
      return lastShape.toGeoJSON().geometry;
    }

    // Return polygon from form if manually set
    return this.parcelForm.get('polygon')?.value;
  }

  /**
   * Custom validators
   */
  latitudeValidator(control: any) {
    const value = parseFloat(control.value);
    if (isNaN(value) || value < -90 || value > 90) {
      return { invalidLatitude: true };
    }
    return null;
  }

  longitudeValidator(control: any) {
    const value = parseFloat(control.value);
    if (isNaN(value) || value < -180 || value > 180) {
      return { invalidLongitude: true };
    }
    return null;
  }

  /**
   * Handle map polygon drawing (integration with Leaflet-Draw)
   */
  onPolygonDrawn(polygon: GeoJSONPolygon, bounds: any) {
    // Calculate center
    const centerLat = bounds.getCenter().lat;
    const centerLng = bounds.getCenter().lng;

    this.parcelForm.patchValue({
      polygon: polygon,
      latitude: centerLat,
      longitude: centerLng
    });

    this.drawnShapes.push(polygon);
  }

  /**
   * Reset form
   */
  resetForm() {
    this.parcelForm.reset();
    this.selectedParcel = null;
    this.error = null;
    this.successMessage = null;
  }
}
