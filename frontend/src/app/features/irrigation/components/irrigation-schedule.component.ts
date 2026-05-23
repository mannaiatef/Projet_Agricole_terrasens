import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IrrigationRecommendation } from '../models/irrigation.model';

interface ScheduleEntry {
  date: Date;
  time: string;
  amount: number;
  duration: number;
  status: 'planned' | 'completed' | 'skipped';
}

@Component({
  selector: 'app-irrigation-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './irrigation-schedule.component.html',
  styleUrls: ['./irrigation-schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IrrigationScheduleComponent implements OnInit {
  @Input() parcelId: number | null = null;
  @Input() recommendation: IrrigationRecommendation | null = null;

  schedules: ScheduleEntry[] = [];
  newSchedule: ScheduleEntry = {
    date: new Date(),
    time: '06:00',
    amount: 0,
    duration: 0,
    status: 'planned'
  };

  showAddForm = false;

  ngOnInit() {
    this.loadSchedules();
  }

  loadSchedules() {
    // Load schedules from service/API
    // For now, create sample schedule based on recommendation
    if (this.recommendation) {
      const today = new Date();
      this.schedules = [
        {
          date: today,
          time: '06:00',
          amount: this.recommendation.irrigation_amount,
          duration: Math.ceil(this.recommendation.irrigation_amount / 2),
          status: 'completed'
        },
        {
          date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
          time: '06:00',
          amount: this.recommendation.irrigation_amount * 0.8,
          duration: Math.ceil((this.recommendation.irrigation_amount * 0.8) / 2),
          status: 'planned'
        },
        {
          date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
          time: '06:00',
          amount: this.recommendation.irrigation_amount * 0.6,
          duration: Math.ceil((this.recommendation.irrigation_amount * 0.6) / 2),
          status: 'planned'
        }
      ];
    }
  }

  addSchedule() {
    if (this.validateSchedule(this.newSchedule)) {
      this.schedules = [...this.schedules, { ...this.newSchedule }];
      this.resetForm();
    }
  }

  updateSchedule(schedule: ScheduleEntry) {
    // Update via service/API
  }

  deleteSchedule(index: number) {
    this.schedules = this.schedules.filter((_, i) => i !== index);
  }

  executeNow(schedule: ScheduleEntry) {
    schedule.status = 'completed';
    this.updateSchedule(schedule);
  }

  private validateSchedule(schedule: ScheduleEntry): boolean {
    return schedule.amount > 0 && schedule.duration > 0;
  }

  private resetForm() {
    this.newSchedule = {
      date: new Date(),
      time: '06:00',
      amount: 0,
      duration: 0,
      status: 'planned'
    };
    this.showAddForm = false;
  }

  getStatusEmoji(status: string): string {
    switch (status) {
      case 'completed':
        return '✅';
      case 'planned':
        return '📅';
      case 'skipped':
        return '⏭️';
      default:
        return '❓';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#388e3c';
      case 'planned':
        return '#667eea';
      case 'skipped':
        return '#999';
      default:
        return '#666';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
}
