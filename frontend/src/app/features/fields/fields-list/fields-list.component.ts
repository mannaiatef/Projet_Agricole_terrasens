import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fields-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fields-page">
      <h1>🗂️ My Fields (Parcelles)</h1>
      <p>Field and parcel management with enriched data integration</p>
      <div class="info-card">
        <p>Fields management interface coming soon...</p>
      </div>
    </div>
  `,
  styles: [`
    .fields-page { padding: 30px; }
    h1 { color: #1a2a1a; }
    .info-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #eee; }
  `]
})
export class FieldsListComponent { }
