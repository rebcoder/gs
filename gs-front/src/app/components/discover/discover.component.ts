import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import * as L from 'leaflet';
import { MarketplaceService } from '../../services/marketplace.service';
import { ProfileService } from '../../services/profile.service';
import { Coordinates, MarketplaceFilters, MarketplaceSale, SaleDateFilter } from '../../models/marketplace.models';
import { SaleCardComponent } from '../ui/sale-card/sale-card.component';
import { SaleCardSkeletonComponent } from '../ui/sale-card-skeleton/sale-card-skeleton.component';
import { EmptyStateComponent } from '../ui/empty-state/empty-state.component';
import {
  DiscoverFiltersSheetComponent,
  DiscoverFiltersSheetData
} from './discover-filters-sheet.component';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSnackBarModule,
    MatBottomSheetModule,
    SaleCardComponent,
    SaleCardSkeletonComponent,
    EmptyStateComponent
  ],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.scss'
})
export class DiscoverComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapHost') mapHost?: ElementRef<HTMLDivElement>;
  @ViewChild('loadTrigger') loadTrigger?: ElementRef<HTMLDivElement>;
  @ViewChildren('saleCardElement') saleCardElements?: QueryList<ElementRef<HTMLElement>>;

  private map?: L.Map;
  private markers = new Map<number, L.Marker>();
  private observer?: IntersectionObserver;

  readonly defaultCenter: Coordinates = { lat: 40.7128, lng: -74.006 };
  readonly distanceOptions = [5, 10, 25, 50];
  readonly dateOptions: { key: SaleDateFilter; label: string }[] = [
    { key: 'any', label: 'Any Day' },
    { key: 'today', label: 'Today' },
    { key: 'weekend', label: 'This Weekend' },
    { key: 'upcoming', label: 'Upcoming' }
  ];

  loading = true;
  loadingMore = false;
  mobileMapOpen = false;

  allSales: MarketplaceSale[] = [];
  filteredSales: MarketplaceSale[] = [];
  visibleSales: MarketplaceSale[] = [];
  categories: string[] = [];

  filters: MarketplaceFilters = {
    query: '',
    date: 'any',
    distanceKm: null,
    category: null,
    minPrice: null,
    maxPrice: null
  };

  selectedSaleId: number | null = null;
  hoveredSaleId: number | null = null;

  private origin: Coordinates | null = null;
  private readonly pageSize = 8;

  constructor(
    private marketplaceService: MarketplaceService,
    private profileService: ProfileService,
    private route: ActivatedRoute,
    private bottomSheet: MatBottomSheet,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.filters = {
        ...this.filters,
        query: this.toString(params['q']),
        date: this.parseDateFilter(params['date']),
        category: this.toString(params['category']) || null,
        distanceKm: this.parseNumber(params['distance'])
      };
      this.resolveOriginAndLoad();
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.setupInfiniteObserver();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  onSearch(): void {
    this.applyFiltersAndRender(true);
  }

  onDateFilterChange(date: SaleDateFilter): void {
    this.filters.date = date;
    this.applyFiltersAndRender(true);
  }

  onDistanceFilterChange(distanceKm: number | null): void {
    this.filters.distanceKm = distanceKm;
    this.applyFiltersAndRender(true);
  }

  onCategoryFilterChange(category: string | null): void {
    this.filters.category = category;
    this.applyFiltersAndRender(true);
  }

  applyAdvancedFilters(): void {
    this.filters.minPrice = this.normalizeNumber(this.filters.minPrice);
    this.filters.maxPrice = this.normalizeNumber(this.filters.maxPrice);
    this.applyFiltersAndRender(true);
  }

  clearFilters(): void {
    this.filters = {
      query: '',
      date: 'any',
      distanceKm: null,
      category: null,
      minPrice: null,
      maxPrice: null
    };
    this.applyFiltersAndRender(true);
  }

  openMobileFilters(): void {
    const data: DiscoverFiltersSheetData = {
      filters: { ...this.filters },
      categories: this.categories,
      distanceOptions: this.distanceOptions
    };

    this.bottomSheet
      .open(DiscoverFiltersSheetComponent, { data })
      .afterDismissed()
      .subscribe((result: MarketplaceFilters | undefined) => {
        if (!result) return;
        this.filters = { ...result };
        this.applyFiltersAndRender(true);
      });
  }

  toggleSavedSale(saleId: number): void {
    const saved = this.marketplaceService.toggleSavedSale(saleId);
    this.snackBar.open(saved ? 'Saved sale' : 'Removed from saved', 'Close', { duration: 1800 });
  }

  isSaved(saleId: number): boolean {
    return this.marketplaceService.isSaleSaved(saleId);
  }

  onCardHover(saleId: number | null): void {
    this.hoveredSaleId = saleId;
    this.updateMarkerStyles();
  }

  focusSale(saleId: number): void {
    this.selectedSaleId = saleId;
    this.ensureVisibleAndScroll(saleId);
    const marker = this.markers.get(saleId);
    if (marker && this.map) {
      this.map.panTo(marker.getLatLng(), { animate: true, duration: 0.35 });
      marker.openPopup();
    }
    this.updateMarkerStyles();
  }

  openMobileMap(): void {
    this.mobileMapOpen = true;
    this.refreshMapSizeSoon();
  }

  closeMobileMap(): void {
    this.mobileMapOpen = false;
  }

  loadMore(): void {
    if (this.visibleSales.length >= this.filteredSales.length) return;

    this.loadingMore = true;
    const nextChunk = this.filteredSales.slice(this.visibleSales.length, this.visibleSales.length + this.pageSize);
    this.visibleSales = [...this.visibleSales, ...nextChunk];
    this.loadingMore = false;
  }

  trackBySaleId(_: number, sale: MarketplaceSale): number {
    return sale.id;
  }

  hasMoreResults(): boolean {
    return this.visibleSales.length < this.filteredSales.length;
  }

  private resolveOriginAndLoad(): void {
    this.loading = true;

    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        const lat = this.normalizeNumber(profile?.preferredLatitude ?? null);
        const lng = this.normalizeNumber(profile?.preferredLongitude ?? null);
        this.origin = lat != null && lng != null ? { lat, lng } : null;
        this.loadAllSales();
      },
      error: () => {
        this.origin = null;
        this.loadAllSales();
      }
    });
  }

  private loadAllSales(): void {
    this.marketplaceService.getAllSales().subscribe({
      next: (sales) => {
        this.allSales = this.marketplaceService.withDistance(sales, this.origin);
        this.categories = this.marketplaceService.getCategories(this.allSales);
        this.applyFiltersAndRender(true);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.allSales = [];
        this.filteredSales = [];
        this.visibleSales = [];
        this.renderMarkers();
        console.error('Failed to load discover sales', err);
      }
    });
  }

  private applyFiltersAndRender(resetVisible: boolean): void {
    const result = this.marketplaceService.applyFilters(this.allSales, this.filters);

    this.filteredSales = [...result].sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      return (a.date || '').localeCompare(b.date || '');
    });

    if (resetVisible) {
      this.visibleSales = [];
    }

    this.loadMore();
    this.renderMarkers();

    if (this.selectedSaleId == null && this.visibleSales.length) {
      this.selectedSaleId = this.visibleSales[0].id;
    }
  }

  private initMap(): void {
    if (this.map || !this.mapHost) return;

    this.map = L.map(this.mapHost.nativeElement, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([this.defaultCenter.lat, this.defaultCenter.lng], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private renderMarkers(): void {
    if (!this.map) return;

    for (const marker of this.markers.values()) {
      marker.remove();
    }
    this.markers.clear();

    const bounds: L.LatLngTuple[] = [];
    this.filteredSales.forEach((sale) => {
      if (sale.latitude == null || sale.longitude == null) return;

      const marker = L.marker([sale.latitude, sale.longitude], {
        icon: this.createMarkerIcon(this.resolveMarkerState(sale.id))
      });

      marker.bindPopup(this.buildPopupHtml(sale), { minWidth: 240, maxWidth: 280 });
      marker.on('click', () => {
        this.selectedSaleId = sale.id;
        this.ensureVisibleAndScroll(sale.id);
        this.updateMarkerStyles();
      });

      marker.addTo(this.map!);
      this.markers.set(sale.id, marker);
      bounds.push([sale.latitude, sale.longitude]);
    });

    if (!bounds.length) return;

    if (bounds.length === 1) {
      this.map.setView(bounds[0], 12);
    } else {
      this.map.fitBounds(bounds, { padding: [32, 32], maxZoom: 13 });
    }
  }

  private updateMarkerStyles(): void {
    this.markers.forEach((marker, saleId) => {
      marker.setIcon(this.createMarkerIcon(this.resolveMarkerState(saleId)));
    });
  }

  private resolveMarkerState(saleId: number): 'default' | 'hovered' | 'selected' {
    if (this.selectedSaleId === saleId) return 'selected';
    if (this.hoveredSaleId === saleId) return 'hovered';
    return 'default';
  }

  private createMarkerIcon(state: 'default' | 'hovered' | 'selected'): L.DivIcon {
    const className = state === 'selected'
      ? 'is-selected'
      : state === 'hovered'
        ? 'is-hovered'
        : 'is-default';
    return L.divIcon({
      className: `discover-marker ${className}`,
      html: '<span class="discover-marker-dot"></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }

  private ensureVisibleAndScroll(saleId: number): void {
    const index = this.filteredSales.findIndex((sale) => sale.id === saleId);
    if (index < 0) return;

    while (this.visibleSales.length <= index) {
      this.loadMore();
      if (!this.hasMoreResults()) break;
    }

    requestAnimationFrame(() => {
      const target = document.getElementById(`discover-sale-${saleId}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private buildPopupHtml(sale: MarketplaceSale): string {
    const itemsHtml = sale.topItems.length
      ? `<p class="popup-items">${sale.topItems.map((item) => this.escapeHtml(item)).join(' • ')}</p>`
      : '<p class="popup-items muted">No items listed yet</p>';

    return `
      <div class="discover-popup">
        <p class="popup-title">${this.escapeHtml(sale.title)}</p>
        <p class="popup-meta">${this.escapeHtml(sale.date || 'Date TBA')} · ${this.escapeHtml(sale.locationLabel)}</p>
        ${itemsHtml}
        <a class="popup-link" href="/sale/${sale.id}">View sale</a>
      </div>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private setupInfiniteObserver(): void {
    if (!this.loadTrigger) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (this.loading || this.loadingMore) return;
        this.loadMore();
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: '180px'
      }
    );

    this.observer.observe(this.loadTrigger.nativeElement);
  }

  private refreshMapSizeSoon(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.map?.invalidateSize();
      });
    });
  }

  private toString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private parseNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private parseDateFilter(value: unknown): SaleDateFilter {
    return value === 'today' || value === 'weekend' || value === 'upcoming' ? value : 'any';
  }

  private normalizeNumber(value: number | null): number | null {
    if (value == null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
