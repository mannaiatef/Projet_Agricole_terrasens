/**
 * Enhanced Parcel Form Component
 * Integrates map-based drawing with form submission
 * Uses the parcel-drawer component for visual polygon creation
 */

import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ParcelService } from '../../services/parcel.service';
import { ParcelDrawerComponent } from '../parcel-drawer/parcel-drawer.component';
import { ParcelDrawData } from '../../services/map-drawing.service';
import { Parcel, CreateParcelRequest } from '../../models/stress.model';

@Component({
  selector: 'app-parcel-form-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ParcelDrawerComponent
  ],
  templateUrl: './parcel-form-drawer.component.html',
  styleUrls: ['./parcel-form-drawer.component.css']
})
export class ParcelFormDrawerComponent implements OnInit {
  @ViewChild('drawer') drawer!: ParcelDrawerComponent;

  @Input() editMode: boolean = false;
  @Input() editingParcel: Parcel | null = null;
  
  @Output() parcelCreated = new EventEmitter<any>();
  @Output() parcelUpdated = new EventEmitter<any>();
  @Output() closed = new EventEmitter<void>();

  // Form state
  parcelForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  successMessage: string | null = null;
  drawnData: ParcelDrawData | null = null;

  // Form visibility
  showMap = true;

  // Current step
  currentStep: 'map' | 'details' | 'review' = 'map';

  constructor(
    private fb: FormBuilder,
    private parcelService: ParcelService
  ) {
    this.parcelForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.editingParcel) {
      this.populateForm(this.editingParcel);
    }
  }

  /**
   * Create form group with validation
   * Only contains user input fields: name
   * Other fields (polygon, lang, latitude, longitude, surface, crop_id, sowing_date) come from maps or are auto-set
   */
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  /**
   * Populate form with existing parcel data
   */
  private populateForm(parcel: Parcel): void {
    this.parcelForm.patchValue({
      name: parcel.name
    });
  }

  /**
   * Handle geometry drawn on map
   */
  onGeometryDrawn(data: ParcelDrawData): void {
    this.drawnData = data;
    this.error = null;
  }

  /**
   * Handle geometry cleared
   */
  onGeometryCleared(): void {
    this.drawnData = null;
  }

  /**
   * Progress to next step
   */
  nextStep(): void {
    if (this.currentStep === 'map') {
      if (!this.drawnData) {
        this.error = 'Please draw a parcel boundary on the map';
        return;
      }
      this.currentStep = 'details';
      this.error = null;
    } else if (this.currentStep === 'details') {
      if (this.parcelForm.invalid) {
        this.error = 'Please fill in all required details';
        return;
      }
      this.currentStep = 'review';
      this.error = null;
    }
  }

  /**
   * Go back to previous step
   */
  previousStep(): void {
    if (this.currentStep === 'details') {
      this.currentStep = 'map';
    } else if (this.currentStep === 'review') {
      this.currentStep = 'details';
    }
  }

  /**
   * Submit the parcel form
   */
  submitForm(): void {
    if (!this.drawnData) {
      this.error = 'Parcel geometry is required';
      return;
    }

    if (this.parcelForm.invalid) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    this.successMessage = null;

    const formValue = this.parcelForm.value;
    
    // Get language from document or use default 'en'
    const lang = document.documentElement.lang || 'en';
    
    // Convert area from square meters to hectares
    const surfaceInHectares = this.drawnData.area / 10000;
    
    const parcelData: CreateParcelRequest = {
      name: formValue.name.trim(),
      polygon: this.drawnData.geometry,
      latitude: this.drawnData.center[0],
      longitude: this.drawnData.center[1],
      surface: surfaceInHectares,
      lang: lang
    };

    const operation = this.editingParcel
      ? this.parcelService.updateParcel(this.editingParcel.id, parcelData)
      : this.parcelService.createParcel(parcelData);

    operation.subscribe({
      next: (result: any) => {
        this.isSubmitting = false;
        this.successMessage = this.editMode
          ? 'Parcel updated successfully!'
          : 'Parcel created successfully!';

        // Emit events for parent component
        if (this.editMode) {
          this.parcelUpdated.emit(result);
        } else {
          this.parcelCreated.emit(result);
        }

        // Reset form after success
        setTimeout(() => {
          this.resetForm();
          this.closed.emit();
        }, 2000);
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.error = error.error?.message || 'Failed to save parcel';
      }
    });
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.parcelForm.reset();
    this.drawnData = null;
    this.currentStep = 'map';
    this.successMessage = null;
    this.error = null;
    if (this.drawer) {
      this.drawer.clearDrawing();
    }
  }

  /**
   * Get formatted area
   */
  getFormattedArea(): string {
    if (!this.drawnData) return '-';
    return (this.drawnData.area / 10000).toFixed(2) + ' ha';
  }

  /**
   * Get step completion status
   */
  isStepComplete(step: string): boolean {
    if (step === 'map') return !!this.drawnData;
    if (step === 'details') return this.parcelForm.valid && !!this.drawnData;
    if (step === 'review') return this.parcelForm.valid && !!this.drawnData;
    return false;
  }
}
