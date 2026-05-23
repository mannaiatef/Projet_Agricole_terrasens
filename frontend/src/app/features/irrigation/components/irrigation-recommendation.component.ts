import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IrrigationRecommendation } from '../models/irrigation.model';
import { IrrigationAlertComponent } from './irrigation-alert.component';

@Component({
  selector: 'app-irrigation-recommendation',
  standalone: true,
  imports: [CommonModule, IrrigationAlertComponent],
  templateUrl: './irrigation-recommendation.component.html',
  styleUrls: ['./irrigation-recommendation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IrrigationRecommendationComponent implements OnInit {
  @Input() recommendation: IrrigationRecommendation | null = null;
  @Output() onCalculate = new EventEmitter<void>();
  @Output() onSchedule = new EventEmitter<void>();

  priorityColor: string = '';
  decisionEmoji: string = '';
  healthStatus: string = '';

  ngOnInit() {
    this.updateVisualization();
  }

  ngOnChanges() {
    this.updateVisualization();
  }

  private updateVisualization() {
    if (!this.recommendation) return;

    // Set priority color
    switch (this.recommendation.priority) {
      case 'HIGH':
        this.priorityColor = '#c62828';
        this.decisionEmoji = '⚠️';
        break;
      case 'MEDIUM':
        this.priorityColor = '#f57c00';
        this.decisionEmoji = '⚡';
        break;
      case 'LOW':
        this.priorityColor = '#388e3c';
        this.decisionEmoji = '✅';
        break;
      default:
        this.priorityColor = '#666';
        this.decisionEmoji = '❓';
    }

    // Set health status
    const stress = this.recommendation.conditions?.stress_percentage || 0;
    if (stress > 70) {
      this.healthStatus = 'Critical';
    } else if (stress > 50) {
      this.healthStatus = 'Stressed';
    } else if (stress > 30) {
      this.healthStatus = 'Moderate';
    } else {
      this.healthStatus = 'Healthy';
    }
  }

  calculateIrrigation() {
    this.onCalculate.emit();
  }

  scheduleIrrigation() {
    this.onSchedule.emit();
  }

  get irrigationAmount(): number {
    if (!this.recommendation?.water_amount_mm) return 0;
    return Math.round(this.recommendation.water_amount_mm * 100) / 100;
  }

  get soilMoisture(): number {
    // Calculate based on stress (inverse relationship)
    if (!this.recommendation?.conditions?.stress_percentage === undefined) return 0;
    return Math.round(100 - this.recommendation.conditions.stress_percentage);
  }

  get stressPercentage(): number {
    if (!this.recommendation?.conditions?.stress_percentage === undefined) return 0;
    return Math.round(this.recommendation.conditions.stress_percentage);
  }

  get temperature(): number {
    return this.recommendation?.conditions?.temperature || 0;
  }

  get humidity(): number {
    return this.recommendation?.conditions?.humidity || 0;
  }

  get windSpeed(): number {
    return 0; // Not in model, can be added
  }

  get solarRadiation(): number {
    return 0; // Not in model, can be added
  }

  get parcelName(): string {
    return this.recommendation?.parcel_name || 'Unknown';
  }

  get cropName(): string {
    return this.recommendation?.crop_name || 'Unknown';
  }

  get recommendedTime(): string {
    return this.recommendation?.recommended_time || '--:--';
  }
}
