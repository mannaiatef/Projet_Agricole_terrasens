import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface IrrigationRecord {
  id: number;
  date: Date;
  amount: number;
  duration: number;
  method: 'automatic' | 'manual' | 'scheduled';
  notes?: string;
  weather_condition?: string;
}

@Component({
  selector: 'app-irrigation-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './irrigation-history.component.html',
  styleUrls: ['./irrigation-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IrrigationHistoryComponent implements OnInit {
  @Input() records: IrrigationRecord[] = [];
  @Input() parcelId: number | null = null;

  filteredRecords: IrrigationRecord[] = [];
  selectedFilter = 'all';
  sortBy = 'date';

  ngOnInit() {
    this.applyFilters();
  }

  ngOnChanges() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.records];

    // Apply filter
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(r => r.method === this.selectedFilter);
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (this.sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (this.sortBy === 'amount') {
        return b.amount - a.amount;
      }
      return 0;
    });

    this.filteredRecords = filtered;
  }

  getMethodEmoji(method: string): string {
    switch (method) {
      case 'automatic':
        return '🤖';
      case 'manual':
        return '👤';
      case 'scheduled':
        return '📅';
      default:
        return '❓';
    }
  }

  getMethodColor(method: string): string {
    switch (method) {
      case 'automatic':
        return '#667eea';
      case 'manual':
        return '#f57c00';
      case 'scheduled':
        return '#388e3c';
      default:
        return '#666';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalWater(): number {
    return this.filteredRecords.reduce((sum, r) => sum + r.amount, 0);
  }

  getAverageWater(): number {
    if (this.filteredRecords.length === 0) return 0;
    return this.getTotalWater() / this.filteredRecords.length;
  }

  getTotalSessions(): number {
    return this.filteredRecords.length;
  }
}
