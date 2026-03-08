import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly API = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getGarageSales(): Observable<any[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<any[]>(`${this.API}/garage-sales`, { headers });
  }

  getMyGarageSales(): Observable<any[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<any[]>(`${this.API}/garage-sales/mine`, { headers });
  }

  getGarageSaleById(id: number): Observable<any> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<any>(`${this.API}/garage-sales/${id}`, { headers });
  }

  createGarageSale(sale: any): Observable<any> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<any>(`${this.API}/garage-sales`, sale, { headers });
  }

  deleteGarageSale(id: number): Observable<any> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.delete<any>(`${this.API}/garage-sales/${id}`, { headers });
  }

  addItemToSale(saleId: number, item: any): Observable<any> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<any>(`${this.API}/garage-sales/${saleId}/items`, item, { headers });
  }

  removeItemFromSale(saleId: number, itemId: number): Observable<any> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.delete<any>(`${this.API}/garage-sales/${saleId}/items/${itemId}`, { headers });
  }
}
