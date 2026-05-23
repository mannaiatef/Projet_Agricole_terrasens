import { Component, OnInit } from '@angular/core';
import { ParcelleService, Parcelle } from '../../core/services/parcelle.service';
import { CalendarService, CalendarCrop } from '../../core/services/calendar.service';

@Component({
  selector: 'app-parcelles',
  templateUrl: './parcelles.component.html',
  styleUrls: ['./parcelles.component.css'],
})
export class ParcellesComponent implements OnInit {
  parcelles: Parcelle[] = [];
  crops: CalendarCrop[] = [];
  
  isLoading = false;
  showCreateForm = false;
  showAssignForm = false;
  selectedParcelle: Parcelle | null = null;
  errorMessage = '';
  successMessage = '';

  // Create form
  newParcelleForm = {
    name: '',
    location: '',
    surface: 0,
  };

  // Assign crop form
  assignCropForm = {
    crop_id: 0,
    sowing_date: '',
  };

  constructor(
    private parcelleService: ParcelleService,
    private calendarService: CalendarService
  ) {}

  ngOnInit(): void {
    this.loadParcelles();
    this.loadCrops();
  }

  /**
   * Load all parcelles for the user
   */
  loadParcelles(): void {
    this.isLoading = true;
    this.parcelleService.getParcelles().subscribe({
      next: (response: any) => {
        this.parcelles = response.data;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load parcelles';
        this.isLoading = false;
      },
    });
  }

  /**
   * Load all available crops
   */
  loadCrops(): void {
    this.calendarService.getAllCrops().subscribe({
      next: (response: any) => {
        this.crops = response.data;
      },
      error: (error: any) => {
        console.error('Failed to load crops:', error);
      },
    });
  }

  /**
   * Create a new parcelle
   */
  createParcelle(): void {
    if (!this.newParcelleForm.name || !this.newParcelleForm.location || this.newParcelleForm.surface <= 0) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.parcelleService.createParcelle(this.newParcelleForm).subscribe({
      next: (response) => {
        this.successMessage = 'Parcelle created successfully!';
        this.showCreateForm = false;
        this.newParcelleForm = { name: '', location: '', surface: 0 };
        this.loadParcelles();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to create parcelle';
        this.isLoading = false;
      },
    });
  }

  /**
   * Open assign crop form for a parcelle
   */
  openAssignForm(parcelle: Parcelle): void {
    this.selectedParcelle = parcelle;
    this.showAssignForm = true;
    this.assignCropForm = { crop_id: 0, sowing_date: '' };
  }

  /**
   * Assign a crop to a parcelle
   */
  assignCrop(): void {
    if (!this.selectedParcelle || !this.assignCropForm.crop_id || this.assignCropForm.crop_id === 0 || !this.assignCropForm.sowing_date) {
      this.errorMessage = 'Please select a crop and sowing date';
      return;
    }

    this.isLoading = true;
    this.parcelleService.assignCrop(this.selectedParcelle.id, this.assignCropForm).subscribe({
      next: (response) => {
        this.successMessage = '✅ Crop assigned successfully! Your calendar has been generated automatically. Go to Crop Calendar to view it.';
        this.showAssignForm = false;
        this.selectedParcelle = null;
        this.assignCropForm = { crop_id: 0, sowing_date: '' };
        this.loadParcelles();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to assign crop';
        this.isLoading = false;
      },
    });
  }

  /**
   * Delete a parcelle
   */
  deleteParcelle(parcelle: Parcelle): void {
    if (!confirm(`Are you sure you want to delete "${parcelle.name}"?`)) {
      return;
    }

    this.isLoading = true;
    this.parcelleService.deleteParcelle(parcelle.id).subscribe({
      next: (response) => {
        this.successMessage = 'Parcelle deleted successfully!';
        this.loadParcelles();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to delete parcelle';
        this.isLoading = false;
      },
    });
  }

  /**
   * Get crop name by ID
   */
  getGroupName(cropId: number | undefined): string {
    if (!cropId) return 'Not assigned';
    const crop = this.crops.find((c) => c.id === cropId);
    return crop ? crop.name : 'Unknown';
  }

  /**
   * Close forms and clear messages
   */
  closeForm(): void {
    this.showCreateForm = false;
    this.showAssignForm = false;
    this.selectedParcelle = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Clear messages only
   */
  closeMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
