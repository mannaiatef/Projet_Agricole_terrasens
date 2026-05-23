import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FarmService } from '../../core/services/farm.service';
import { Farm } from '../../core/models/app.models';

interface CropStage {
    number: number;
    name: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    kc_value: number;
    day_from_sowing: number;
    actions: any[];
    alerts: any[];
    description?: string;
    color?: string;
    fertilization: {
        type: string;
        dose_kg_ha: number;
        product: string;
        day_from_start?: number;
    } | null;
}

interface CropCalendar {
    farm_id: number;
    farm_name: string;
    crop_type: string;
    sowing_date: string;
    total_days: number;
    stages: CropStage[];
}

@Component({
    selector: 'app-crop-calendar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="crop-calendar-page">

      <!-- En-tête -->
      <div class="page-header">
        <div class="header-left">
          <h1>📅 Plan Cultural Automatique</h1>
          <p class="subtitle">Calendrier agronomique généré depuis la date de semis</p>
        </div>
        <div class="header-right">
          <select id="farm-selector" [(ngModel)]="selectedFarmId" (ngModelChange)="onFarmChange($event)" class="farm-select">
            <option value="">-- Sélectionner une parcelle --</option>
            <option *ngFor="let f of farms" [value]="f.id">{{ f.name }} ({{ f.crop_type }})</option>
          </select>
        </div>
      </div>

      <!-- État chargement -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Génération du plan cultural...</p>
      </div>

      <!-- Aucune ferme -->
      <div class="empty-hint card" *ngIf="!loading && farms.length === 0">
        <span class="hint-icon">🌱</span>
        <p>Aucune parcelle trouvée. Ajoutez d'abord une parcelle dans la section <strong>Mes Parcelles</strong>.</p>
      </div>

      <!-- Sélection requise -->
      <div class="empty-hint card" *ngIf="!loading && farms.length > 0 && !calendar && !selectedFarmId">
        <span class="hint-icon">☝️</span>
        <p>Sélectionnez une parcelle pour afficher son plan cultural automatique.</p>
      </div>

      <!-- Pas de calendrier pour la parcelle sélectionnée -->
      <div class="empty-hint card" *ngIf="!loading && selectedFarmId && !calendar">
        <span class="hint-icon">📋</span>
        <p>Aucun plan cultural généré pour cette parcelle. Vous devez d'abord assigner une culture et génère un calendrier.</p>
        <p style="font-size: 13px; margin-top: 12px; color: #888;">
          Allez dans <strong>Mes Parcelles</strong> pour assigner une culture, puis générez le calendrier automatique.
        </p>
      </div>

      <!-- Contenu du calendrier -->
      <div *ngIf="calendar && !loading">

        <!-- Résumé parcelle -->
        <div class="farm-summary card">
          <div class="summary-item">
            <span class="sub-label">Parcelle</span>
            <span class="sub-val">{{ calendar.farm_name }}</span>
          </div>
          <div class="summary-item">
            <span class="sub-label">Culture</span>
            <span class="sub-val crop-badge">{{ calendar.crop_type }}</span>
          </div>
          <div class="summary-item">
            <span class="sub-label">Date de semis</span>
            <span class="sub-val">{{ calendar.sowing_date | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="summary-item">
            <span class="sub-label">Durée totale</span>
            <span class="sub-val">{{ calendar.total_days }} jours</span>
          </div>
          <div class="summary-item" *ngIf="currentStage">
            <span class="sub-label">Stade actuel</span>
            <span class="sub-val active-badge">{{ currentStage.name }}</span>
          </div>
        </div>

        <!-- Timeline des stades -->
        <div class="timeline-section">
          <h2 class="section-title">📆 Calendrier des stades phénologiques</h2>

          <div class="timeline">
            <div
              *ngFor="let stage of calendar.stages; let i = index"
              class="timeline-item"
              [class.active]="isCurrentStage(stage)"
              [class.past]="isPastStage(stage)"
              [class.future]="isFutureStage(stage)"
            >
              <!-- Marker -->
              <div class="timeline-marker">
                <div class="marker-circle">
                  <span *ngIf="isPastStage(stage)">✓</span>
                  <span *ngIf="isCurrentStage(stage)">●</span>
                  <span *ngIf="isFutureStage(stage)">{{ stage.number }}</span>
                </div>
                <div class="marker-line" *ngIf="i < calendar.stages.length - 1"></div>
              </div>

              <!-- Contenu du stade -->
              <div class="stage-card card" [id]="'stage-' + stage.number">
                <!-- En-tête du stade -->
                <div class="stage-header" (click)="toggleStage(stage.number)">
                  <div class="stage-info">
                    <span class="stage-number">Stade {{ stage.number }}</span>
                    <h3 class="stage-name">{{ stage.name }}</h3>
                    <div class="stage-dates">
                      {{ stage.start_date | date:'dd MMM' }} → {{ stage.end_date | date:'dd MMM yyyy' }}
                      <span class="day-badge">J+{{ stage.day_from_sowing }}</span>
                      <span class="duration-badge">{{ stage.duration_days }}j</span>
                    </div>
                  </div>
                  <div class="stage-kc">
                    <div class="kc-circle" [style.background]="getKcColor(stage.kc_value)">
                      Kc {{ stage.kc_value }}
                    </div>
                  </div>
                  <span class="toggle-icon">{{ expandedStages.has(stage.number) ? '▲' : '▼' }}</span>
                </div>

                <!-- Contenu expandable -->
                <div class="stage-body" *ngIf="expandedStages.has(stage.number)">

                  <!-- Actions -->
                  <div class="stage-section">
                    <h4>✅ Actions recommandées</h4>
                    <ul class="action-list">
                      <li *ngFor="let action of stage.actions">{{ action }}</li>
                    </ul>
                  </div>

                  <!-- Fertilisation -->
                  <div class="stage-section" *ngIf="stage.fertilization">
                    <h4>🌱 Plan de fertilisation</h4>
                    <div class="fert-box">
                      <div class="fert-details">
                        <div class="fert-row">
                          <span class="fert-label">Type</span>
                          <span class="fert-value">{{ stage.fertilization.type }}</span>
                        </div>
                        <div class="fert-row">
                          <span class="fert-label">Dose</span>
                          <span class="fert-value">{{ stage.fertilization.dose_kg_ha }} kg/ha</span>
                        </div>
                        <div class="fert-row">
                          <span class="fert-label">Produit</span>
                          <span class="fert-value">{{ stage.fertilization.product }}</span>
                        </div>
                        <div class="fert-row" *ngIf="stage.fertilization.day_from_start">
                          <span class="fert-label">Application</span>
                          <span class="fert-value">Jour {{ stage.fertilization.day_from_start }} du stade</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Alertes & Vigilance -->
                  <div class="stage-section" *ngIf="stage.alerts && stage.alerts.length > 0">
                    <h4>⚠️ Alertes & Vigilance</h4>
                    <div class="alerts-box">
                      <ul class="alert-list">
                        <li *ngFor="let alert of stage.alerts" class="alert-item">{{ alert }}</li>
                      </ul>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
    styles: [`
    /* ---- LAYOUT ---- */
    .crop-calendar-page { padding: 30px; font-family: 'Segoe UI', system-ui, sans-serif; max-width: 1100px; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    h1 { font-size: 24px; font-weight: 700; color: #1a2a1a; margin: 0 0 6px; }
    .subtitle { color: #6b7280; font-size: 14px; margin: 0; }

    .farm-select {
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      padding: 10px 16px;
      font-size: 14px;
      background: white;
      cursor: pointer;
      min-width: 260px;
      outline: none;
      transition: border-color 0.2s;
    }
    .farm-select:focus { border-color: #4caf50; box-shadow: 0 0 0 3px rgba(76,175,80,0.12); }

    .card {
      background: white;
      border-radius: 14px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
      border: 1px solid #f0f2f0;
    }

    /* ---- LOADING ---- */
    .loading-state { text-align: center; padding: 60px; color: #888; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .spinner { width: 36px; height: 36px; border: 3px solid #eee; border-top-color: #4caf50; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ---- EMPTY ---- */
    .empty-hint {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 30px;
      margin-top: 20px;
      color: #555;
    }
    .hint-icon { font-size: 32px; }

    /* ---- RÉSUMÉ ---- */
    .farm-summary {
      display: flex;
      gap: 0;
      padding: 20px 28px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .summary-item { display: flex; flex-direction: column; gap: 4px; padding-right: 32px; border-right: 1px solid #f0f2f0; margin-right: 32px; }
    .summary-item:last-child { border: none; margin: 0; }
    .sub-label { font-size: 11px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px; }
    .sub-val { font-weight: 600; font-size: 15px; color: #1a2a1a; }
    .crop-badge { background: #f0f7f0; color: #2d6a4f; padding: 3px 10px; border-radius: 20px; font-size: 13px; }
    .active-badge { background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 20px; font-size: 12px; border: 1px solid #bbf7d0; }

    /* ---- SECTION TITLE ---- */
    .section-title { font-size: 17px; font-weight: 700; color: #1a2a1a; margin: 0 0 24px; }

    /* ---- TIMELINE ---- */
    .timeline { display: flex; flex-direction: column; gap: 0; }

    .timeline-item {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    /* Marker */
    .timeline-marker { display: flex; flex-direction: column; align-items: center; width: 40px; flex-shrink: 0; padding-top: 16px; }
    .marker-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      border: 2px solid #e5e7eb;
      background: white;
      color: #9ca3af;
      flex-shrink: 0;
      z-index: 1;
    }
    .timeline-item.active .marker-circle {
      background: #4caf50;
      border-color: #4caf50;
      color: white;
      box-shadow: 0 0 0 4px rgba(76,175,80,0.15);
    }
    .timeline-item.past .marker-circle {
      background: #d1fae5;
      border-color: #10b981;
      color: #047857;
    }
    .marker-line {
      width: 2px;
      flex: 1;
      min-height: 20px;
      background: #e5e7eb;
      margin: 4px 0;
    }
    .timeline-item.active .marker-line { background: #4caf50; }
    .timeline-item.past .marker-line { background: #10b981; }

    /* Stage Card */
    .stage-card {
      flex: 1;
      margin-bottom: 16px;
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    .stage-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }

    .timeline-item.active .stage-card {
      border-color: #4caf50;
      box-shadow: 0 0 0 2px rgba(76,175,80,0.2);
    }

    .stage-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px 22px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .stage-header:hover { background: #f9fafb; }

    .stage-info { flex: 1; }
    .stage-number { font-size: 11px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px; }
    .stage-name { font-size: 15px; font-weight: 600; color: #1a2a1a; margin: 3px 0; }
    .stage-dates { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 8px; }
    .day-badge {
      background: #f0f7f0;
      color: #166534;
      padding: 1px 7px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
    }
    .duration-badge {
      background: #f1f5f9;
      color: #475569;
      padding: 1px 7px;
      border-radius: 10px;
      font-size: 11px;
    }
    .kc-circle {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      color: white;
      white-space: nowrap;
    }
    .toggle-icon { color: #9ca3af; font-size: 12px; margin-left: 8px; }

    /* Stage Body */
    .stage-body { padding: 0 22px 22px; border-top: 1px solid #f0f2f0; margin-top: 0; }

    /* Staging sections */
    .stage-section { margin-top: 16px; }
    .stage-section h4 { 
      font-size: 13px; 
      font-weight: 700; 
      color: #374151; 
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    /* Action list */
    .action-list { 
      margin: 0; 
      padding-left: 20px; 
      list-style: disc;
    }
    .action-list li { 
      font-size: 13px; 
      color: #4b5563; 
      margin-bottom: 8px; 
      line-height: 1.6;
    }

    /* Fertilization box */
    .fert-box {
      background: linear-gradient(135deg, #f0fdf4 0%, #f7ffed 100%);
      border: 1.5px solid #bbf7d0;
      border-radius: 8px;
      overflow: hidden;
      padding: 0;
    }
    .fert-details {
      display: flex;
      flex-direction: column;
    }
    .fert-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #d1fae5;
      gap: 16px;
    }
    .fert-row:last-child {
      border-bottom: none;
    }
    .fert-label {
      font-size: 12px;
      font-weight: 600;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      min-width: 100px;
    }
    .fert-value {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
      text-align: right;
      flex: 1;
    }

    /* Alerts box */
    .alerts-box {
      background: linear-gradient(135deg, #fffbeb 0%, #fef8f0 100%);
      border: 1.5px solid #fed7aa;
      border-radius: 8px;
      overflow: hidden;
      padding: 0;
    }
    .alert-list { 
      margin: 0; 
      padding: 12px 16px;
      list-style: none;
    }
    .alert-item {
      font-size: 13px;
      color: #78350f;
      margin-bottom: 8px;
      line-height: 1.6;
      padding-left: 16px;
      position: relative;
    }
    .alert-item:before {
      content: '⚠';
      position: absolute;
      left: 0;
      color: #d97706;
    }
    .alert-item:last-child {
      margin-bottom: 0;
    }
  `]
})
export class CropCalendarComponent implements OnInit {
    farms: Farm[] = [];
    selectedFarmId: number | '' = '';
    calendar: CropCalendar | null = null;
    currentStage: CropStage | null = null;
    loading = false;
    expandedStages = new Set<number>();

    constructor(private farmService: FarmService) { }

    ngOnInit() {
        this.farmService.getFarms().subscribe({
            next: (farms) => {
                this.farms = farms;
                // Auto-select first farm if only one
                if (farms.length === 1) {
                    this.selectedFarmId = farms[0].id;
                    this.loadCalendar(farms[0].id);
                }
            },
            error: (err) => console.error('Error loading farms', err)
        });
    }

    onFarmChange(farmId: number | '') {
        if (farmId) {
            this.loadCalendar(farmId as number);
        } else {
            this.calendar = null;
            this.currentStage = null;
        }
    }

    loadCalendar(farmId: number) {
        this.loading = true;
        this.calendar = null;
        this.expandedStages.clear();

        this.farmService.getFarmCalendar(farmId).subscribe({
            next: (cal) => {
                console.log('[CropCalendarComponent] Calendar loaded:', cal);
                this.calendar = cal;
                this.loading = false;
                
                // Only process if calendar exists and has stages
                if (!cal || !cal.stages || !Array.isArray(cal.stages)) {
                    console.warn('[CropCalendarComponent] No stages found');
                    return;
                }
                
                console.log(`[CropCalendarComponent] ${cal.stages.length} stages loaded`);
                
                // Auto-expand current stage
                const today = new Date().toISOString().split('T')[0];
                console.log('[CropCalendarComponent] Today:', today);
                
                for (const stage of cal.stages) {
                    console.log(`[CropCalendarComponent] Checking stage ${stage.number}: ${stage.name}, dates: ${stage.start_date} to ${stage.end_date}`);
                    if (stage.start_date <= today && stage.end_date >= today) {
                        console.log(`[CropCalendarComponent] Current stage found: ${stage.name}`);
                        this.expandedStages.add(stage.number);
                        this.currentStage = stage;
                        break;
                    }
                }
                // If no current, expand first
                if (this.expandedStages.size === 0 && cal.stages.length > 0) {
                    console.log(`[CropCalendarComponent] No current stage, expanding first stage`);
                    this.expandedStages.add(cal.stages[0].number);
                }
                
                console.log('[CropCalendarComponent] Expanded stages:', Array.from(this.expandedStages));
            },
            error: (err) => {
                this.loading = false;
                // Calendar doesn't exist yet - this is normal for new parcelles
                // User can generate calendar after assigning a crop
                this.calendar = null;
                console.error('No calendar found for this farm (normal if new)', err);
            }
        });
    }

    toggleStage(stageNumber: number) {
        if (this.expandedStages.has(stageNumber)) {
            this.expandedStages.delete(stageNumber);
        } else {
            this.expandedStages.add(stageNumber);
        }
    }

    isCurrentStage(stage: CropStage): boolean {
        const today = new Date().toISOString().split('T')[0];
        return stage.start_date <= today && stage.end_date >= today;
    }

    isPastStage(stage: CropStage): boolean {
        const today = new Date().toISOString().split('T')[0];
        return stage.end_date < today;
    }

    isFutureStage(stage: CropStage): boolean {
        return !this.isCurrentStage(stage) && !this.isPastStage(stage);
    }

    getKcColor(kc: number): string {
        if (kc < 0.5) return '#94a3b8';
        if (kc < 0.8) return '#22c55e';
        if (kc < 1.0) return '#f59e0b';
        return '#ef4444';
    }
}
