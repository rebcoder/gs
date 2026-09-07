import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    span {
      display: inline-flex;
      align-items: center;
      border-radius: var(--border-radius-pill);
      border: 1px solid transparent;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .ui-badge-neutral {
      border-color: var(--border-color);
      background: var(--background-light);
      color: var(--text-secondary);
    }

    .ui-badge-accent {
      border-color: color-mix(in srgb, var(--primary-color) 30%, white);
      background: color-mix(in srgb, var(--primary-color) 12%, white);
      color: var(--primary-color);
    }

    .ui-badge-success {
      border-color: color-mix(in srgb, var(--success-color) 30%, white);
      background: color-mix(in srgb, var(--success-color) 12%, white);
      color: var(--success-color);
    }

    .ui-badge-warning {
      border-color: color-mix(in srgb, var(--warning-color) 30%, white);
      background: color-mix(in srgb, var(--warning-color) 12%, white);
      color: var(--warning-color);
    }
  `]
})
export class UiBadgeComponent {
  @Input() variant: 'neutral' | 'accent' | 'success' | 'warning' = 'neutral';

  get badgeClasses(): string {
    return `ui-badge-${this.variant}`;
  }
}
