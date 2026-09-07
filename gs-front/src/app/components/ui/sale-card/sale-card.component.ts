import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sale-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <article
      class="sale-card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1"
      (mouseenter)="cardHovered.emit(true)"
      (mouseleave)="cardHovered.emit(false)">
      <div class="sale-card-media relative aspect-[4/3] overflow-hidden">
        <img
          *ngIf="imageUrl"
          [src]="imageUrl"
          [alt]="title + ' preview'"
          class="h-full w-full object-cover transition duration-300 ease-out group-hover:scale-[1.06]"
          loading="lazy" />

        <div *ngIf="!imageUrl" class="sale-card-media-placeholder flex h-full w-full items-center justify-center">
          <mat-icon>storefront</mat-icon>
        </div>

        <button
          *ngIf="showSave"
          type="button"
          class="save-btn absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-105"
          [class.saved]="saved"
          [attr.aria-label]="saved ? 'Remove from saved' : 'Save sale'"
          (click)="onSaveToggle($event)">
          <mat-icon class="!h-5 !w-5 !text-lg">{{ saved ? 'favorite' : 'favorite_border' }}</mat-icon>
        </button>
      </div>

      <div class="flex flex-1 flex-col gap-3 p-5">
        <h3 class="sale-card-title line-clamp-1 text-xl font-semibold">{{ title }}</h3>

        <div class="sale-card-meta space-y-1 text-sm">
          <p class="flex items-center gap-2">
            <mat-icon class="!h-4 !w-4 !text-base sale-card-meta-icon">event</mat-icon>
            {{ date || 'Date TBA' }}<span *ngIf="time"> · {{ time }}</span>
          </p>
          <p class="flex items-center gap-2">
            <mat-icon class="!h-4 !w-4 !text-base sale-card-meta-icon">location_on</mat-icon>
            {{ location }}
            <span *ngIf="distanceKm != null" class="sale-card-distance"> · {{ distanceKm }} km</span>
          </p>
        </div>

        <p *ngIf="description" class="sale-card-meta line-clamp-2 text-sm">{{ description }}</p>

        <div *ngIf="topItems.length" class="flex flex-wrap gap-2">
          <span
            *ngFor="let item of topItems; trackBy: trackByItem"
            class="sale-card-pill inline-flex items-center px-2.5 py-1 text-xs font-medium">
            {{ item }}
          </span>
        </div>

        <div class="mt-auto flex items-center gap-2 pt-2">
          <a [routerLink]="['/sale', saleId]" class="btn-primary">
            View Sale
          </a>
          <button
            *ngIf="showBook"
            type="button"
            class="btn-secondary"
            (click)="onBook($event)">
            Book
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .sale-card {
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--border-color);
      background: var(--background-white);
      box-shadow: var(--shadow-xs);
      transition: box-shadow 0.25s ease, transform 0.25s ease;
    }

    .sale-card:hover {
      box-shadow: var(--shadow-lg);
    }

    .sale-card-media {
      background: var(--background-light);
    }

    .sale-card-media-placeholder {
      color: var(--text-light);
    }

    .sale-card-title {
      color: var(--text-primary);
    }

    .sale-card-meta {
      color: var(--text-secondary);
    }

    .sale-card-meta-icon {
      color: var(--text-light);
    }

    .sale-card-distance {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .sale-card-pill {
      border-radius: var(--border-radius-pill);
      border: 1px solid var(--border-color);
      background: var(--background-light);
      color: var(--text-secondary);
    }

    .save-btn {
      border: 1px solid var(--border-color);
      background: rgba(255, 255, 255, 0.95);
      color: var(--text-secondary);
      box-shadow: var(--shadow-xs);
    }

    .save-btn:hover {
      background: #fff;
    }

    .save-btn.saved {
      color: var(--primary-color);
      border-color: color-mix(in srgb, var(--primary-color) 35%, white);
    }
  `]
})
export class SaleCardComponent {
  @Input() saleId!: number;
  @Input() title = 'Garage Sale';
  @Input() date = 'Date TBA';
  @Input() time = '';
  @Input() location = 'Location shared after booking';
  @Input() imageUrl = '';
  @Input() description = '';
  @Input() topItems: string[] = [];
  @Input() distanceKm: number | null = null;
  @Input() showBook = false;
  @Input() showSave = true;
  @Input() saved = false;

  @Output() book = new EventEmitter<void>();
  @Output() saveToggle = new EventEmitter<number>();
  @Output() cardHovered = new EventEmitter<boolean>();

  onBook(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.book.emit();
  }

  onSaveToggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.saveToggle.emit(this.saleId);
  }

  trackByItem(index: number, item: string): string {
    return `${item}-${index}`;
  }
}
