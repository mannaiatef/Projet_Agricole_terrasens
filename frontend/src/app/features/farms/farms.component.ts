import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FarmService } from '../../core/services/farm.service';
import { Farm } from '../../core/models/app.models';
import { ParcelFormDrawerComponent } from '../../components/parcel-form-drawer/parcel-form-drawer.component';
import { ParcelStressDisplayComponent } from '../../components/parcel-stress-display.component';

@Component({
  selector: 'app-farms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ParcelFormDrawerComponent, ParcelStressDisplayComponent],
  template: `
    <div class="farms-page">
      <div class="header">
        <div class="header-left">
          <h1>🌿 My Managed Fields</h1>
          <span class="farm-count">{{ farms.length }} parcelle(s)</span>
        </div>
        <button class="btn-primary" id="add-farm-btn" (click)="openCreateModal()">
          <span class="plus-icon">＋</span> Ajouter une Parcelle
        </button>
      </div>

      <!-- Liste des fermes -->
      <div class="farms-list">
        <div *ngIf="loading" class="empty-state card">
          <div class="loader"></div>
          <p>Chargement de vos parcelles...</p>
        </div>

        <div class="farm-item card" *ngFor="let farm of farms">
          <div class="farm-meta">
            <span class="crop-icon">🌾</span>
            <div class="info">
              <h3>{{ farm.name }}</h3>
              <p>{{ (farm.crop_type || 'Culture non assignée') }} • {{ farm.area }} Ha</p>
            </div>
          </div>
          <div class="farm-stats">
            <div class="stat" *ngIf="farm.sowing_date">
              <span class="label">Date de semis</span>
              <span class="val">{{ farm.sowing_date | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="stat" *ngIf="!farm.crop_type" class="stat-warning">
              <span class="label">Status</span>
              <span class="val warning">⚠ À configurer</span>
            </div>
          </div>
          <div class="actions">
            <button class="btn-text" (click)="openEditModal(farm)">✏️ Modifier</button>
            <button class="btn-text" (click)="openStressModal(farm)">📊 Voir Stress</button>
            <button class="btn-text" *ngIf="!farm.crop_type" (click)="openAssignCropModal(farm)">🌿 Assigner culture</button>
            <button class="btn-text danger" (click)="deleteFarm(farm.id)">🗑️ Supprimer</button>
          </div>
        </div>

        <div *ngIf="!loading && farms.length === 0" class="empty-state card">
          <div class="empty-icon">🌱</div>
          <p>Aucune parcelle ajoutée. Commencez par créer votre première parcelle.</p>
          <button class="btn-primary" (click)="openCreateModal()">+ Ajouter ma première parcelle</button>
        </div>
      </div>

      <!-- Modal - Create Parcelle (NEW) -->
      <div class="modal-overlay" *ngIf="showModal && modalMode === 'create'" (click)="closeModal()">
        <div class="modal-content large-modal" (click)="$event.stopPropagation()">
          <app-parcel-form-drawer
            [editMode]="false"
            (parcelCreated)="onParcelCreated($event)"
            (closed)="closeModal()">
          </app-parcel-form-drawer>
        </div>
      </div>

      <!-- Modal - Edit Parcelle -->
      <div class="modal-overlay" *ngIf="showModal && modalMode === 'edit'" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Modifier Parcelle</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="editForm" (ngSubmit)="submitEditFarm()" class="modal-form">
            <div *ngIf="submitError" class="error-banner">{{ submitError }}</div>

            <div class="form-group">
              <label for="edit-name">Nom de la parcelle</label>
              <input
                id="edit-name"
                type="text"
                formControlName="name"
                placeholder="Ex: Parcelle A"
                [class.error]="isFieldInvalid('name', editForm)"
              />
              <span class="error-msg" *ngIf="isFieldInvalid('name', editForm)">Nom requis</span>
            </div>

            <div class="form-group">
              <label for="edit-area">Surface (hectares)</label>
              <input
                id="edit-area"
                type="number"
                step="0.1"
                formControlName="area"
                [class.error]="isFieldInvalid('area', editForm)"
              />
              <span class="error-msg" *ngIf="isFieldInvalid('area', editForm)">Surface requise</span>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="closeModal()" [disabled]="submitting">
                Annuler
              </button>
              <button type="submit" class="btn-primary" [disabled]="editForm.invalid || submitting">
                {{ submitting ? 'Modification...' : 'Modifier Parcelle' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal - Assign Crop -->
      <div class="modal-overlay" *ngIf="showModal && modalMode === 'assign-crop'" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>🌿 Assigner une Culture</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="assignCropForm" (ngSubmit)="submitAssignCrop()" class="modal-form">
            <div *ngIf="submitError" class="error-banner">{{ submitError }}</div>

            <div class="form-group">
              <label for="crop_type">Type de culture *</label>
              <select 
                id="crop_type" 
                formControlName="crop_type"
                [class.error]="isFieldInvalid('crop_type', assignCropForm)"
              >
                <option value="" disabled selected>Sélectionner une culture</option>
                <option *ngFor="let crop of availableCrops" [value]="crop">{{ crop }}</option>
              </select>
              <span class="error-msg" *ngIf="isFieldInvalid('crop_type', assignCropForm)">Culture requise</span>
            </div>

            <div class="form-group">
              <label for="sowing_date">Date de semis *</label>
              <input
                id="sowing_date"
                type="date"
                formControlName="sowing_date"
                [class.error]="isFieldInvalid('sowing_date', assignCropForm)"
              />
              <span class="error-msg" *ngIf="isFieldInvalid('sowing_date', assignCropForm)">Date requise</span>
            </div>

            <div class="info-box">
              <p><strong>ℹ️ Info:</strong> Un calendrier cultural sera généré automatiquement après assignation.</p>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="closeModal()" [disabled]="submitting">
                Annuler
              </button>
              <button type="submit" class="btn-primary" [disabled]="assignCropForm.invalid || submitting">
                {{ submitting ? 'Traitement...' : 'Assigner & Générer' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal - View Parcel Stress -->
      <div class="modal-overlay" *ngIf="showStressModal" (click)="closeStressModal()">
        <div class="modal-content large-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>📊 Analyse de Stress - {{ selectedParcelForStress?.name }}</h2>
            <button class="close-btn" (click)="closeStressModal()">✕</button>
          </div>
          <div class="modal-body" style="padding: 20px; overflow-y: auto;">
            <app-parcel-stress-display
              *ngIf="selectedParcelForStress"
              [parcelId]="selectedParcelForStress.id"
              [parcelName]="selectedParcelForStress.name"
              [latitude]="selectedParcelForStress.latitude"
              [longitude]="selectedParcelForStress.longitude"
              [polygon]="selectedParcelForStress.polygon">
            </app-parcel-stress-display>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .farms-page { padding: 30px; font-family: 'Segoe UI', system-ui, sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .header-left h1 { font-size: 24px; font-weight: 700; color: #1a2a1a; margin: 0; }
    .farm-count { font-size: 13px; color: #6b7280; background: #f0f7f0; padding: 3px 10px; border-radius: 20px; width: fit-content; }
    .btn-primary { background: linear-gradient(135deg, #2d5a27, #4caf50); color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(76, 175, 80, 0.35); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(76, 175, 80, 0.45); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #f0f2f0; color: #333; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background 0.2s; }
    .btn-secondary:hover:not(:disabled) { background: #e5e7eb; }
    .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
    .plus-icon { font-size: 18px; }
    .card { background: white; border-radius: 14px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .farm-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border: 1px solid #f0f2f0; transition: box-shadow 0.2s; }
    .farm-item:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .farm-meta { display: flex; align-items: center; gap: 20px; flex: 1; }
    .crop-icon { font-size: 28px; background: #f0f7f0; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0; }
    .info h3 { font-size: 17px; margin: 0 0 4px; color: #1a2a1a; font-weight: 600; }
    .info p { color: #888; font-size: 13px; margin: 0; }
    .farm-stats { display: flex; gap: 30px; }
    .stat { display: flex; flex-direction: column; align-items: center; }
    .stat .label { font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .stat .val { font-weight: 600; font-size: 14px; color: #333; }
    .stat.stat-warning .val.warning { color: #ff9800; }
    .btn-text { background: transparent; border: none; font-weight: 600; color: #4caf50; cursor: pointer; padding: 8px 12px; border-radius: 6px; transition: background 0.15s; font-size: 13px; }
    .btn-text:hover { background: #f0f7f0; }
    .btn-text.danger { color: #f44336; }
    .btn-text.danger:hover { background: #fef2f2; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .empty-state { text-align: center; color: #888; padding: 60px 40px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .empty-icon { font-size: 48px; }
    .loader { width: 32px; height: 32px; border: 3px solid #f0f2f0; border-top-color: #4caf50; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Modal styles */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 14px; width: 90%; max-width: 500px; max-height: 90vh; min-height: 400px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
    .modal-content.large-modal { max-width: 1200px; width: 95%; max-height: 90vh; min-height: 600px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid #f0f2f0; flex-shrink: 0; }
    .modal-header h2 { margin: 0; font-size: 18px; font-weight: 700; color: #1a2a1a; }
    .modal-body { flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; }
    .close-btn { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: background 0.2s; }
    .close-btn:hover { background: #f0f2f0; color: #333; }
    .modal-form { padding: 24px; }
    .error-banner { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
    .form-group { margin-bottom: 18px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group label { display: block; font-weight: 600; color: #333; font-size: 14px; margin-bottom: 6px; }
    .form-group input, .form-group select { width: 100%; padding: 10px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 14px; transition: border-color 0.2s; background: white; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #4caf50; box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1); }
    .form-group input.error, .form-group select.error { border-color: #f44336; }
    .error-msg { display: block; font-size: 12px; color: #f44336; margin-top: 4px; }
    .info-box { background: #f0f7f0; border: 1px solid #c8e6c9; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #2e7d32; }
    .modal-footer { display: flex; gap: 12px; padding: 24px; border-top: 1px solid #f0f2f0; justify-content: flex-end; }
  `]
})
export class FarmsComponent implements OnInit {
  farms: Farm[] = [];
  loading = true;
  showModal = false;
  modalMode: 'create' | 'edit' | 'assign-crop' = 'create';
  submitting = false;
  submitError = '';
  
  showStressModal = false;
  selectedParcelForStress: Farm | null = null;
  
  farmForm!: FormGroup;
  editForm!: FormGroup;
  assignCropForm!: FormGroup;
  
  selectedFarm: Farm | null = null;
  availableCrops: string[] = [
    'Blé', 'Orge', 'Maïs', 'Tomate', 'Piment', 
    'Pomme de terre', 'Olivier', 'Vigne'
  ];

  constructor(
    private farmService: FarmService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.initForms();
    this.loadFarms();
  }

  initForms() {
    // Form for creating new farm
    this.farmForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      area: [null, [Validators.required, Validators.min(0.1)]],
      latitude: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
    });

    // Form for editing farm
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      area: [null, [Validators.required, Validators.min(0.1)]],
    });

    // Form for assigning crop
    this.assignCropForm = this.fb.group({
      crop_type: ['', Validators.required],
      sowing_date: ['', Validators.required],
    });
  }

  loadFarms() {
    this.loading = true;
    this.farmService.getFarms().subscribe({
      next: (data) => {
        this.farms = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        console.error('Failed to load farms');
      }
    });
  }

  openCreateModal() {
    this.modalMode = 'create';
    this.farmForm.reset();
    this.submitError = '';
    this.showModal = true;
  }

  openEditModal(farm: Farm) {
    this.modalMode = 'edit';
    this.selectedFarm = farm;
    this.editForm.patchValue({
      name: farm.name,
      area: farm.area,
    });
    this.submitError = '';
    this.showModal = true;
  }

  openAssignCropModal(farm: Farm) {
    this.modalMode = 'assign-crop';
    this.selectedFarm = farm;
    this.assignCropForm.reset();
    this.submitError = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedFarm = null;
  }

  openStressModal(farm: Farm) {
    this.selectedParcelForStress = farm;
    this.showStressModal = true;
  }

  closeStressModal() {
    this.showStressModal = false;
    this.selectedParcelForStress = null;
  }

  /**
   * Handle parcel creation from new map-based form
   */
  onParcelCreated(parcelData: any) {
    // Reload farms list after creation
    this.loadFarms();
  }

  isFieldInvalid(field: string, form: FormGroup): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  submitFarm() {
    if (this.farmForm.invalid) {
      this.farmForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.submitError = '';

    const formValue = this.farmForm.value;
    const parcelle = {
      name: formValue.name,
      location: `${formValue.latitude},${formValue.longitude}`,
      surface: formValue.area,
    };

    this.farmService.createFarm(parcelle).subscribe({
      next: () => {
        this.submitting = false;
        this.closeModal();
        this.loadFarms();
      },
      error: (err) => {
        this.submitting = false;
        this.submitError = err?.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }

  submitEditFarm() {
    if (!this.selectedFarm || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.submitError = '';

    const formValue = this.editForm.value;
    const updates = {
      name: formValue.name,
      surface: formValue.area,
    };

    this.farmService.updateFarm(this.selectedFarm.id, updates).subscribe({
      next: () => {
        this.submitting = false;
        this.closeModal();
        this.loadFarms();
      },
      error: (err) => {
        this.submitting = false;
        this.submitError = err?.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }

  submitAssignCrop() {
    console.log('[FarmsComponent] submitAssignCrop called');
    console.log('[FarmsComponent] selectedFarm:', this.selectedFarm);
    console.log('[FarmsComponent] assignCropForm.invalid:', this.assignCropForm.invalid);
    console.log('[FarmsComponent] assignCropForm.value:', this.assignCropForm.value);
    
    if (!this.selectedFarm || this.assignCropForm.invalid) {
      console.log('[FarmsComponent] Form validation failed');
      this.assignCropForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.submitError = '';

    const formValue = this.assignCropForm.value;
    console.log('[FarmsComponent] Submitting assign crop request');
    console.log('[FarmsComponent] farmId:', this.selectedFarm.id);
    console.log('[FarmsComponent] crop_type:', formValue.crop_type);
    console.log('[FarmsComponent] sowing_date:', formValue.sowing_date);

    this.farmService.assignCropToParcelle(
      this.selectedFarm.id,
      formValue.crop_type,
      formValue.sowing_date
    ).subscribe({
      next: (result) => {
        console.log('[FarmsComponent] Assign crop successful:', result);
        this.submitting = false;
        this.closeModal();
        this.loadFarms();
      },
      error: (err) => {
        console.error('[FarmsComponent] Assign crop error:', err);
        this.submitting = false;
        this.submitError = err?.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }

  deleteFarm(farmId: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette parcelle?')) {
      return;
    }
    
    this.farmService.deleteFarm(farmId).subscribe({
      next: () => {
        this.loadFarms();
      },
      error: (err) => {
        console.error('Error deleting farm:', err);
        alert('Erreur lors de la suppression: ' + (err?.error?.message || 'Réessayez plus tard'));
      }
    });
  }
}
