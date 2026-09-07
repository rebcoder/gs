import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiSkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-item-card-skeleton',
  standalone: true,
  imports: [CommonModule, UiSkeletonComponent],
  template: `
    <article class="card overflow-hidden">
      <app-ui-skeleton rounded="none" heightClass="h-40" widthClass="w-full"></app-ui-skeleton>
      <div class="space-y-3 p-4">
        <app-ui-skeleton heightClass="h-5" widthClass="w-3/4"></app-ui-skeleton>
        <app-ui-skeleton heightClass="h-4" widthClass="w-1/3"></app-ui-skeleton>
        <app-ui-skeleton heightClass="h-4" widthClass="w-full"></app-ui-skeleton>
      </div>
    </article>
  `,
  styles: [`
    .card {
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--border-color);
      background: var(--background-white);
      box-shadow: var(--shadow-xs);
    }
  `]
})
export class ItemCardSkeletonComponent {}
