import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-irrigation-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alert" [ngClass]="'alert-' + type">
      <div class="alert-content">
        <span class="alert-icon">{{ getIcon() }}</span>
        <p class="alert-message">{{ message }}</p>
      </div>
      <button class="alert-close" (click)="onDismiss.emit()">×</button>
    </div>
  `,
  styles: [
    `
      .alert {
        padding: 1rem 1.5rem;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        animation: slideIn 0.3s ease;

        .alert-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .alert-icon {
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .alert-message {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .alert-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: inherit;
          opacity: 0.7;
          transition: opacity 0.3s;

          &:hover {
            opacity: 1;
          }
        }

        &-success {
          background: #e8f5e9;
          color: #2e7d32;
          border-left: 4px solid #2e7d32;
        }

        &-error {
          background: #ffebee;
          color: #c62828;
          border-left: 4px solid #c62828;
        }

        &-warning {
          background: #fff3e0;
          color: #e65100;
          border-left: 4px solid #e65100;
        }

        &-info {
          background: #e1f5fe;
          color: #01579b;
          border-left: 4px solid #01579b;
        }
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IrrigationAlertComponent {
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() message = '';
  @Output() onDismiss = new EventEmitter<void>();

  getIcon(): string {
    switch (this.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  }
}
