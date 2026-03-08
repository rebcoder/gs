import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <div class="loading-container" [class]="size">
      <div class="loading-content">
        <div class="loading-spinner">
          <mat-spinner [diameter]="spinnerSize"></mat-spinner>
        </div>

        <div class="loading-text" *ngIf="message">
          <mat-icon class="loading-icon">{{icon}}</mat-icon>
          <span>{{message}}</span>
        </div>

        <div class="loading-subtitle" *ngIf="subtitle">
          {{subtitle}}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-3xl);

      &.small {
        padding: var(--spacing-xl);
        min-height: 120px;
      }

      &.medium {
        padding: var(--spacing-2xl);
        min-height: 200px;
      }

      &.large {
        padding: var(--spacing-3xl);
        min-height: 300px;
      }

      &.full-screen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(4px);
        z-index: 9999;
      }
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-lg);
      text-align: center;
      max-width: 400px;
    }

    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;

      ::ng-deep .mat-mdc-progress-spinner {
        circle {
          stroke: var(--primary-color) !important;
        }
      }
    }

    .loading-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);

      .loading-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: var(--primary-color);
        animation: spin 2s linear infinite;
      }

      span {
        font-size: var(--font-size-lg);
        font-weight: 500;
        color: var(--text-primary);
      }
    }

    .loading-subtitle {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      max-width: 280px;
      line-height: var(--line-height-relaxed);
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    // Responsive design
    @media (max-width: 480px) {
      .loading-container {
        padding: var(--spacing-lg);

        &.large {
          min-height: 200px;
        }
      }

      .loading-text span {
        font-size: var(--font-size-base);
      }

      .loading-subtitle {
        font-size: var(--font-size-xs);
        max-width: 250px;
      }
    }
  `]
})
export class LoadingComponent {
  @Input() message = 'Loading...';
  @Input() subtitle = '';
  @Input() icon = 'refresh';
  @Input() size: 'small' | 'medium' | 'large' | 'full-screen' = 'medium';

  get spinnerSize(): number {
    switch (this.size) {
      case 'small': return 32;
      case 'medium': return 48;
      case 'large': return 64;
      case 'full-screen': return 48;
      default: return 48;
    }
  }
}



