import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ui-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" (click)="close.emit()">
      <div class="modal-panel w-full max-w-3xl overflow-hidden" (click)="$event.stopPropagation()">
        <header class="modal-header flex items-center justify-between px-6 py-4">
          <h3 class="modal-title">{{ title }}</h3>
          <button type="button" class="modal-close-btn" (click)="close.emit()" aria-label="Close modal">
            <mat-icon class="!h-5 !w-5 !text-lg">close</mat-icon>
          </button>
        </header>
        <div class="max-h-[75vh] overflow-y-auto px-6 py-5">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-panel {
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--border-color);
      background: var(--background-white);
      box-shadow: var(--shadow-xl);
    }

    .modal-header {
      border-bottom: 1px solid var(--border-color);
    }

    .modal-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .modal-close-btn {
      display: inline-flex;
      border-radius: var(--border-radius-md);
      padding: 0.35rem;
      color: var(--text-secondary);
      background: transparent;
      transition: background-color 0.2s ease;
    }

    .modal-close-btn:hover {
      background: var(--background-light);
    }
  `]
})
export class UiModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() close = new EventEmitter<void>();
}
