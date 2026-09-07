import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [class]="buttonClass"
      (click)="clicked.emit($event)">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      border-radius: var(--border-radius-md);
      padding: 0.6rem 1.15rem;
      font-size: 0.875rem;
      font-weight: 600;
      border: 1px solid transparent;
      transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .ui-btn-full {
      width: 100%;
    }

    .ui-btn-primary {
      background: var(--primary-color);
      color: #fff;
      box-shadow: var(--shadow-xs);
    }

    .ui-btn-primary:hover:not(:disabled) {
      background: color-mix(in srgb, var(--primary-color) 88%, black);
      box-shadow: var(--shadow-sm);
    }

    .ui-btn-secondary {
      background: var(--background-white);
      border-color: var(--border-color);
      color: var(--text-primary);
    }

    .ui-btn-secondary:hover:not(:disabled) {
      background: var(--background-light);
      border-color: var(--text-light);
    }
  `]
})
export class UiButtonComponent {
  @Input() variant: 'primary' | 'secondary' = 'primary';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Output() clicked = new EventEmitter<Event>();

  get buttonClass(): string {
    const variantClass = this.variant === 'secondary' ? 'ui-btn-secondary' : 'ui-btn-primary';
    return this.fullWidth ? `${variantClass} ui-btn-full` : variantClass;
  }
}
