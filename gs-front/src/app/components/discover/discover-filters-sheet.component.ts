import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MarketplaceFilters, SaleDateFilter } from '../../models/marketplace.models';

export interface DiscoverFiltersSheetData {
  filters: MarketplaceFilters;
  categories: string[];
  distanceOptions: number[];
}

@Component({
  selector: 'app-discover-filters-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, MatBottomSheetModule],
  template: `
    <section class="space-y-5 p-5">
      <header>
        <h2 class="sheet-title text-lg font-semibold">Filters</h2>
        <p class="sheet-subtitle text-sm">Fine-tune discovery results</p>
      </header>

      <div class="space-y-3">
        <p class="sheet-label text-xs font-semibold uppercase tracking-wide">Date</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="pill" [class.pill-active]="draft.date === 'any'" (click)="draft.date = 'any'">Any day</button>
          <button type="button" class="pill" [class.pill-active]="draft.date === 'today'" (click)="draft.date = 'today'">Today</button>
          <button type="button" class="pill" [class.pill-active]="draft.date === 'weekend'" (click)="draft.date = 'weekend'">This Weekend</button>
          <button type="button" class="pill" [class.pill-active]="draft.date === 'upcoming'" (click)="draft.date = 'upcoming'">Upcoming</button>
        </div>
      </div>

      <div class="space-y-3">
        <p class="sheet-label text-xs font-semibold uppercase tracking-wide">Distance</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="pill" [class.pill-active]="draft.distanceKm === null" (click)="draft.distanceKm = null">Any</button>
          <button
            *ngFor="let option of data.distanceOptions"
            type="button"
            class="pill"
            [class.pill-active]="draft.distanceKm === option"
            (click)="draft.distanceKm = option">
            {{ option }} km
          </button>
        </div>
      </div>

      <div class="space-y-2" *ngIf="data.categories.length">
        <label for="mobile-category" class="sheet-label text-xs font-semibold uppercase tracking-wide">Category</label>
        <select id="mobile-category" class="input-modern" [(ngModel)]="draft.category">
          <option [ngValue]="null">All categories</option>
          <option *ngFor="let category of data.categories" [ngValue]="category">{{ category }}</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <label class="space-y-2">
          <span class="sheet-label text-xs font-semibold uppercase tracking-wide">Min Price</span>
          <input type="number" class="input-modern" [(ngModel)]="draft.minPrice" placeholder="0" />
        </label>
        <label class="space-y-2">
          <span class="sheet-label text-xs font-semibold uppercase tracking-wide">Max Price</span>
          <input type="number" class="input-modern" [(ngModel)]="draft.maxPrice" placeholder="500" />
        </label>
      </div>

      <div class="flex gap-2">
        <button type="button" class="btn-secondary flex-1" (click)="reset()">Reset</button>
        <button type="button" class="btn-primary flex-1" (click)="apply()">Apply</button>
      </div>
    </section>
  `,
  styles: [
    `
      .sheet-title {
        color: var(--text-primary);
      }

      .sheet-subtitle,
      .sheet-label {
        color: var(--text-secondary);
      }

      .pill {
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-pill);
        background: var(--background-white);
        padding: 0.4rem 0.8rem;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-secondary);
        transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
      }

      .pill-active {
        border-color: var(--text-primary);
        background: var(--text-primary);
        color: #fff;
      }
    `
  ]
})
export class DiscoverFiltersSheetComponent {
  draft: MarketplaceFilters;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: DiscoverFiltersSheetData,
    private sheetRef: MatBottomSheetRef<DiscoverFiltersSheetComponent>
  ) {
    this.draft = { ...data.filters };
  }

  setDate(value: SaleDateFilter): void {
    this.draft.date = value;
  }

  reset(): void {
    this.sheetRef.dismiss({
      query: this.draft.query,
      date: 'any',
      distanceKm: null,
      category: null,
      minPrice: null,
      maxPrice: null
    } satisfies MarketplaceFilters);
  }

  apply(): void {
    this.sheetRef.dismiss({
      ...this.draft,
      minPrice: this.normalizeNumber(this.draft.minPrice),
      maxPrice: this.normalizeNumber(this.draft.maxPrice)
    } satisfies MarketplaceFilters);
  }

  private normalizeNumber(value: number | null): number | null {
    if (value == null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
