import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <label class="block space-y-2">
      <span *ngIf="label" class="ui-input-label">{{ label }}</span>
      <input
        class="ui-input"
        [attr.type]="type"
        [attr.placeholder]="placeholder"
        [ngModel]="value"
        [disabled]="disabled"
        (ngModelChange)="valueChange.emit($event)"
        (keyup.enter)="enterPressed.emit()" />
    </label>
  `,
  styles: [`
    .ui-input-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .ui-input {
      width: 100%;
      border-radius: var(--border-radius-md);
      border: 1px solid var(--border-color);
      background: var(--background-white);
      padding: 0.6rem 0.85rem;
      font-size: 0.875rem;
      color: var(--text-primary);
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .ui-input::placeholder {
      color: var(--text-light);
    }

    .ui-input:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 18%, transparent);
    }

    .ui-input:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  `]
})
export class UiInputComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() value = '';
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() enterPressed = new EventEmitter<void>();
}
