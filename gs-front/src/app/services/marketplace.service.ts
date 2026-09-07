import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { SalesService } from './sales.service';
import {
  Coordinates,
  MarketplaceFilters,
  MarketplaceItem,
  MarketplaceSale,
  SaleDateFilter,
  VisitPlanEntry,
  VisitPlanGroup
} from '../models/marketplace.models';

@Injectable({ providedIn: 'root' })
export class MarketplaceService {
  private readonly savedSalesStorageKey = 'gs.marketplace.savedSales.v1';
  private readonly visitPlanStorageKey = 'gs.marketplace.visitPlan.v1';

  private readonly savedSalesSubject = new BehaviorSubject<Set<number>>(this.readSavedSales());
  private readonly visitPlanSubject = new BehaviorSubject<VisitPlanEntry[]>(this.readVisitPlan());

  readonly savedSaleIds$ = this.savedSalesSubject.asObservable();
  readonly visitPlan$ = this.visitPlanSubject.asObservable();

  constructor(private salesService: SalesService) {}

  getAllSales(query = ''): Observable<MarketplaceSale[]> {
    const request$ = query.trim()
      ? this.salesService.searchGarageSales(query.trim())
      : this.salesService.getGarageSales();
    return request$.pipe(map((sales) => (Array.isArray(sales) ? sales : []).map((sale) => this.mapSale(sale))));
  }

  getFeaturedSales(): Observable<MarketplaceSale[]> {
    return this.salesService
      .getFeaturedGarageSales()
      .pipe(map((sales) => (Array.isArray(sales) ? sales : []).map((sale) => this.mapSale(sale))));
  }

  getNearbySales(lat: number, lng: number, radiusKm = 20): Observable<MarketplaceSale[]> {
    return this.salesService.getNearbyGarageSales(lat, lng, radiusKm).pipe(
      map((sales) => (Array.isArray(sales) ? sales : []).map((sale) => this.mapSale(sale, { lat, lng })))
    );
  }

  getSaleById(id: number, origin?: Coordinates | null): Observable<MarketplaceSale> {
    return this.salesService
      .getGarageSaleById(id)
      .pipe(map((sale) => this.mapSale(sale, origin ?? null)));
  }

  withDistance(sales: MarketplaceSale[], origin?: Coordinates | null): MarketplaceSale[] {
    if (!origin) return sales;
    return sales.map((sale) => {
      if (sale.latitude == null || sale.longitude == null) return sale;
      return {
        ...sale,
        distanceKm: this.haversineDistanceKm(origin.lat, origin.lng, sale.latitude, sale.longitude)
      };
    });
  }

  applyFilters(sales: MarketplaceSale[], filters: MarketplaceFilters): MarketplaceSale[] {
    let result = [...sales];

    const query = filters.query.trim().toLowerCase();
    if (query) {
      result = result.filter((sale) => {
        const inSale =
          sale.title.toLowerCase().includes(query)
          || sale.description.toLowerCase().includes(query)
          || sale.locationLabel.toLowerCase().includes(query)
          || sale.topItems.some((itemName) => itemName.toLowerCase().includes(query));
        if (inSale) return true;
        return sale.items.some((item) => {
          return (
            item.name.toLowerCase().includes(query)
            || item.description.toLowerCase().includes(query)
            || item.category.toLowerCase().includes(query)
          );
        });
      });
    }

    if (filters.date !== 'any') {
      result = result.filter((sale) => this.matchesDateFilter(sale.date, filters.date));
    }

    if (filters.distanceKm != null) {
      result = result.filter((sale) => sale.distanceKm != null && sale.distanceKm <= filters.distanceKm!);
    }

    if (filters.category) {
      const category = filters.category.toLowerCase();
      result = result.filter((sale) =>
        sale.items.some((item) => (item.category || '').toLowerCase() === category)
      );
    }

    if (filters.minPrice != null || filters.maxPrice != null) {
      const min = filters.minPrice ?? Number.NEGATIVE_INFINITY;
      const max = filters.maxPrice ?? Number.POSITIVE_INFINITY;
      result = result.filter((sale) => sale.items.some((item) => item.price >= min && item.price <= max));
    }

    return result;
  }

  getCategories(sales: MarketplaceSale[]): string[] {
    const bucket = new Set<string>();
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const raw = (item.category || '').trim();
        if (!raw) return;
        bucket.add(this.humanizeCategory(raw));
      });
    });
    return Array.from(bucket).sort((a, b) => a.localeCompare(b));
  }

  mapSale(rawSale: unknown, origin?: Coordinates | null): MarketplaceSale {
    const source = (rawSale && typeof rawSale === 'object' ? rawSale : {}) as Record<string, unknown>;
    const rawItems = Array.isArray(source['items']) ? source['items'] : [];
    const items = rawItems.map((item) => this.mapItem(item, Number(source['id']) || 0));

    const latitude = this.parseNumber(source['latitude'] ?? source['lat']);
    const longitude = this.parseNumber(source['longitude'] ?? source['lng']);
    const imageUrl = this.salesService.resolveImageUrl(items[0]?.imageUrl || '');

    const sale: MarketplaceSale = {
      id: Number(source['id']) || 0,
      title: this.toNonEmptyString(source['saleName'])
        || this.toNonEmptyString(source['sale_name'])
        || this.toNonEmptyString(source['title'])
        || 'Garage Sale',
      description: this.toNonEmptyString(source['description']) || 'No description available.',
      date: this.toNonEmptyString(source['saleDate']) || this.toNonEmptyString(source['sale_date']) || '',
      startTime: this.toNonEmptyString(source['startTime']) || this.toNonEmptyString(source['start_time']) || '',
      endTime: this.toNonEmptyString(source['endTime']) || this.toNonEmptyString(source['end_time']) || '',
      timeLabel: this.buildTimeLabel(source),
      area: this.toNonEmptyString(source['area']) || '',
      city: this.toNonEmptyString(source['city']) || '',
      locationLabel: this.buildLocationLabel(source),
      latitude,
      longitude,
      distanceKm: null,
      featured: Boolean(source['featured']),
      imageUrl,
      items,
      topItems: items.slice(0, 3).map((item) => item.name),
      raw: source
    };

    if (origin && latitude != null && longitude != null) {
      sale.distanceKm = this.haversineDistanceKm(origin.lat, origin.lng, latitude, longitude);
    }

    return sale;
  }

  toggleSavedSale(saleId: number): boolean {
    const current = new Set(this.savedSalesSubject.value);
    if (current.has(saleId)) {
      current.delete(saleId);
      this.savedSalesSubject.next(current);
      this.persistSavedSales(current);
      return false;
    }
    current.add(saleId);
    this.savedSalesSubject.next(current);
    this.persistSavedSales(current);
    return true;
  }

  isSaleSaved(saleId: number): boolean {
    return this.savedSalesSubject.value.has(saleId);
  }

  getSavedSaleIdsSnapshot(): number[] {
    return Array.from(this.savedSalesSubject.value);
  }

  addVisitItem(entry: Omit<VisitPlanEntry, 'addedAt'>): void {
    const current = [...this.visitPlanSubject.value];
    const duplicate = current.some((item) => item.saleId === entry.saleId && item.itemId === entry.itemId);
    if (duplicate) return;

    const next: VisitPlanEntry[] = [...current, { ...entry, addedAt: new Date().toISOString() }];
    this.visitPlanSubject.next(next);
    this.persistVisitPlan(next);
  }

  removeVisitItem(saleId: number, itemId: number): void {
    const next = this.visitPlanSubject.value.filter((entry) => !(entry.saleId === saleId && entry.itemId === itemId));
    this.visitPlanSubject.next(next);
    this.persistVisitPlan(next);
  }

  clearVisitPlan(): void {
    this.visitPlanSubject.next([]);
    this.persistVisitPlan([]);
  }

  groupVisitPlanBySale(entries: VisitPlanEntry[]): VisitPlanGroup[] {
    const groups = new Map<number, VisitPlanGroup>();

    entries.forEach((entry) => {
      const existing = groups.get(entry.saleId);
      if (existing) {
        existing.items.push(entry);
        return;
      }
      groups.set(entry.saleId, {
        saleId: entry.saleId,
        saleTitle: entry.saleTitle,
        saleLocation: entry.saleLocation,
        saleLatitude: entry.saleLatitude,
        saleLongitude: entry.saleLongitude,
        items: [entry]
      });
    });

    return Array.from(groups.values()).sort((a, b) => b.items.length - a.items.length);
  }

  getRecommendedRouteOrder(groups: VisitPlanGroup[], start?: Coordinates | null): VisitPlanGroup[] {
    if (!groups.length) return [];
    const remaining = [...groups];

    if (!start) {
      return remaining.sort((a, b) => a.saleLocation.localeCompare(b.saleLocation));
    }

    const route: VisitPlanGroup[] = [];
    let current = start;

    while (remaining.length > 0) {
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < remaining.length; i += 1) {
        const candidate = remaining[i];
        if (candidate.saleLatitude == null || candidate.saleLongitude == null) continue;
        const candidateDistance = this.haversineDistanceKm(
          current.lat,
          current.lng,
          candidate.saleLatitude,
          candidate.saleLongitude
        );
        if (candidateDistance < bestDistance) {
          bestDistance = candidateDistance;
          bestIndex = i;
        }
      }

      const [nextStop] = remaining.splice(bestIndex, 1);
      route.push(nextStop);
      if (nextStop.saleLatitude != null && nextStop.saleLongitude != null) {
        current = { lat: nextStop.saleLatitude, lng: nextStop.saleLongitude };
      }
    }

    return route;
  }

  humanizeCategory(category: string): string {
    if (!category) return 'Other';
    return category
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private mapItem(rawItem: unknown, saleId: number): MarketplaceItem {
    const source = (rawItem && typeof rawItem === 'object' ? rawItem : {}) as Record<string, unknown>;
    const imageUrl = this.salesService.resolveImageUrl(
      this.toNonEmptyString(source['imageUrl'])
      || (Array.isArray(source['imageUrls']) ? this.toNonEmptyString(source['imageUrls'][0]) : '')
      || ''
    );

    return {
      id: Number(source['id']) || 0,
      saleId,
      name: this.toNonEmptyString(source['name']) || 'Unnamed item',
      description: this.toNonEmptyString(source['description']) || '',
      price: this.parseNumber(source['price']) ?? 0,
      category: this.toNonEmptyString(source['category']) || 'OTHER',
      imageUrl
    };
  }

  private buildTimeLabel(source: Record<string, unknown>): string {
    const start = this.toNonEmptyString(source['startTime']) || this.toNonEmptyString(source['start_time']);
    const end = this.toNonEmptyString(source['endTime']) || this.toNonEmptyString(source['end_time']);
    if (start && end) return `${start} - ${end}`;
    if (start) return start;
    return 'Time TBA';
  }

  private buildLocationLabel(source: Record<string, unknown>): string {
    const area = this.toNonEmptyString(source['area']);
    const city = this.toNonEmptyString(source['city']);
    const chunks = [area, city].filter((value): value is string => Boolean(value));
    return chunks.length ? chunks.join(', ') : 'Location shared after booking';
  }

  private matchesDateFilter(rawDate: string, filter: SaleDateFilter): boolean {
    if (!rawDate) return false;
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    if (filter === 'today') {
      return target.getTime() === today.getTime();
    }

    if (filter === 'weekend') {
      const day = target.getDay();
      return day === 0 || day === 6;
    }

    if (filter === 'upcoming') {
      return target.getTime() > today.getTime();
    }

    return true;
  }

  private haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const earthRadiusKm = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((earthRadiusKm * c).toFixed(1));
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  private readSavedSales(): Set<number> {
    const payload = this.readJsonArray<number>(this.savedSalesStorageKey);
    return new Set(payload.filter((value) => Number.isFinite(value)).map((value) => Number(value)));
  }

  private persistSavedSales(savedSales: Set<number>): void {
    this.writeStorage(this.savedSalesStorageKey, JSON.stringify(Array.from(savedSales.values())));
  }

  private readVisitPlan(): VisitPlanEntry[] {
    const payload = this.readJsonArray<VisitPlanEntry>(this.visitPlanStorageKey);
    return payload.filter((entry) => {
      return (
        typeof entry === 'object'
        && entry !== null
        && Number.isFinite(Number((entry as VisitPlanEntry).saleId))
        && Number.isFinite(Number((entry as VisitPlanEntry).itemId))
      );
    });
  }

  private persistVisitPlan(plan: VisitPlanEntry[]): void {
    this.writeStorage(this.visitPlanStorageKey, JSON.stringify(plan));
  }

  private readJsonArray<T>(key: string): T[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  private writeStorage(key: string, value: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore quota errors in local mode
    }
  }

  private parseNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private toNonEmptyString(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.trim();
  }
}
