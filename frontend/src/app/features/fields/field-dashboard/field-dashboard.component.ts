import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-field-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="field-dashboard-page">
      <h1>🌾 Field Dashboard</h1>
      <p>Detailed field/parcel analysis and monitoring</p>
      <div class="info-card">
        <p>Field {{ fieldId }} details coming soon...</p>
      </div>
    </div>
  `,
  styles: [`
    .field-dashboard-page { padding: 30px; }
    h1 { color: #1a2a1a; }
    .info-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #eee; }
  `]
})
export class FieldDashboardComponent {
  fieldId: string | null = null;

  constructor(private route: ActivatedRoute) {
    this.fieldId = this.route.snapshot.paramMap.get('fieldId');
  }
}
