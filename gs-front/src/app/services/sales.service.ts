import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

/**
 * Mirrors the backend `ItemDto` (see gs-back ItemDto.java). Fields are optional
 * because the same shape is used both for read responses and for the partial
 * payloads sent when creating/updating an item from a form.
 */
export interface GarageSaleItem {
  id?: number;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  category?: string | null;
  condition?: string | null;
  brand?: string | null;
  model?: string | null;
  isSold?: boolean;
  isAvailable?: boolean;
  imageUrl?: string | null;
  imageUrls?: string[];
  saleId?: number;
  homeId?: number;
}

/**
 * Mirrors the backend `GarageSaleDto` (see gs-back GarageSaleDto.java). Used
 * both for API responses and, as a `Partial<GarageSale>`, for create/update
 * request bodies.
 */
export interface GarageSale {
  id?: number;
  saleName?: string | null;
  title?: string | null;
  description?: string | null;
  saleDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  homeId?: number;
  sellerId?: number;
  items?: GarageSaleItem[];
  area?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: string | null;
  maxAppointmentsPerSlot?: number | null;
  featured?: boolean;
}

export type GarageSalePayload = Partial<GarageSale>;
export type GarageSaleItemPayload = Partial<GarageSaleItem>;

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly API = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getGarageSales(): Observable<GarageSale[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<GarageSale[]>(`${this.API}/garage-sales`, { headers });
  }

  getFeaturedGarageSales(): Observable<GarageSale[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<GarageSale[]>(`${this.API}/garage-sales/featured`, { headers });
  }

  searchGarageSales(query: string): Observable<GarageSale[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const params = new HttpParams().set('q', query || '');
    return this.http.get<GarageSale[]>(`${this.API}/garage-sales/search`, { headers, params });
  }

  getNearbyGarageSales(lat: number, lng: number, radius: number = 10): Observable<GarageSale[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const params = new HttpParams()
      .set('lat', lat)
      .set('lng', lng)
      .set('radius', radius);

    return this.http.get<GarageSale[]>(`${this.API}/garage-sales/nearby`, { headers, params });
  }

  getMyGarageSales(): Observable<GarageSale[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<GarageSale[]>(`${this.API}/garage-sales/mine`, { headers });
  }

  getGarageSaleById(id: number): Observable<GarageSale> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<GarageSale>(`${this.API}/garage-sales/${id}`, { headers });
  }

  createGarageSale(sale: GarageSalePayload): Observable<GarageSale> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<GarageSale>(`${this.API}/garage-sales`, sale, { headers });
  }

  deleteGarageSale(id: number): Observable<void> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.delete<void>(`${this.API}/garage-sales/${id}`, { headers });
  }

  cancelGarageSale(id: number): Observable<void> {
    // Current backend implementation removes the sale; keep this alias for seller dashboard semantics.
    return this.deleteGarageSale(id);
  }

  addItemToSale(saleId: number, item: GarageSaleItemPayload): Observable<GarageSaleItem> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<GarageSaleItem>(`${this.API}/garage-sales/${saleId}/items`, item, { headers });
  }

  uploadItemImage(itemId: number, file: File): Observable<GarageSaleItem> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<GarageSaleItem>(`${this.API}/items/${itemId}/image`, formData, { headers });
  }

  removeItemFromSale(saleId: number, itemId: number): Observable<void> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.delete<void>(`${this.API}/garage-sales/${saleId}/items/${itemId}`, { headers });
  }

  resolveImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const base = environment.apiBaseUrl.endsWith('/')
      ? environment.apiBaseUrl.slice(0, -1)
      : environment.apiBaseUrl;
    const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${base}${path}`;
  }
}
