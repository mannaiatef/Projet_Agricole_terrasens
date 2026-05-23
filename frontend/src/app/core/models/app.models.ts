// ============================================================
// Modèles TypeScript – Terrasens DSS Platform
// ============================================================

/** Utilisateur */
export interface User {
    id: number;
    email: string;
    name: string;
    role: string;
}

/** Parcelle/Farm */
export interface Farm {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    area: number;
    crop_type: string;
    sowing_date: string;
    user_id?: number;
    polygon?: any;  // GeoJSON polygon (optional for backward compatibility)
}

/** Champs/Fields */
export interface Field {
    id: number;
    farm_id: number;
    field_code: string;
    name: string;
    latitude: number;
    longitude: number;
    area: number;
    crop_type: string;
    sowing_date: string;
    stage: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

/** Message Chat */
export interface ChatMessage {
    response: string;
    timestamp: string;
}

/** Notifications */
export interface Notification {
    id: number;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

// ========== PLAN CULTURAL (CROP CALENDAR) ==========

export interface FertilizationDetail {
    type: string;
    dose_kg_ha: number;
    product: string;
    day_from_start?: number;
}

export interface CropStageModel {
    number: number;
    name: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    kc_value: number;
    day_from_sowing: number;
    description?: string;
    color?: string;
    actions: any[];
    alerts: any[];
    fertilization: FertilizationDetail | null;
}

export interface CropCalendar {
    farm_id: number;
    farm_name: string;
    crop_type: string;
    sowing_date: string;
    total_days: number;
    stages: CropStageModel[];
}

// ========== IRRIGATION ==========

export interface IrrigationRecommendation {
    farm_id: number;
    farm_name: string;
    date: string;
    et0: number;
    kc: number;
    etc: number;
    rainfall: number;
    net_irrigation_need: number;
    unit: string;
    stage: string;
    stress_level: 'low' | 'moderate' | 'high';
    recommendation: string;
    alert: string | null;
}

// ========== SATELLITE / NDVI ==========

export interface NDVIRecord {
    date: string;
    ndvi_avg: number;
}

export interface SatelliteData {
    id: number;
    farm_id: number;
    date: string;
    ndvi: number;
    evi?: number;
    savi?: number;
    lst?: number;
    cloud_coverage: number;
    created_at: string;
}

// ========== STRESS ==========

export interface StressIndicator {
    id: number;
    farm_id: number;
    date: string;
    water_stress_level: 'NO_STRESS' | 'MODERATE_STRESS' | 'HIGH_STRESS' | 'CRITICAL_STRESS';
    thermal_stress_level: 'NO_STRESS' | 'MODERATE_STRESS' | 'HIGH_STRESS' | 'CRITICAL_STRESS';
    water_stress_score: number;
    thermal_stress_score: number;
    confidence: number;
    recommended_action: string;
    created_at: string;
}

// ========== RISK ==========

export interface RiskScore {
    score: number;
    category: string;
    created_at: string;
}
