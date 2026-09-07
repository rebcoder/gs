import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="empty-state px-6 py-10 text-center">
      <div class="empty-state-icon mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <h3 class="empty-state-title text-xl font-medium">{{ title }}</h3>
      <p class="empty-state-message mx-auto mt-2 max-w-xl text-sm">{{ message }}</p>
      <a
        *ngIf="actionLabel && actionLink"
        [routerLink]="actionLink"
        class="btn-primary mt-6">
        {{ actionLabel }}
      </a>
    </div>
  `,
  styles: [`
    .empty-state {
      border-radius: var(--border-radius-lg);
      border: 1px dashed var(--border-color);
      background: var(--background-white);
    }

    .empty-state-icon {
      background: var(--background-light);
      color: var(--text-secondary);
    }

    .empty-state-title {
      color: var(--text-primary);
    }

    .empty-state-message {
      color: var(--text-secondary);
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nothing to show';
  @Input() message = 'There is no data available right now.';
  @Input() actionLabel = '';
  @Input() actionLink = '';
}
