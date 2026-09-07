import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

/**
 * Mirrors the backend `AppointmentDto` (see gs-back AppointmentDto.java). Used
 * both for API responses and, as a `Partial<Appointment>`, for create/update
 * request bodies.
 */
export interface Appointment {
  id?: number;
  buyerId?: number;
  sellerId?: number;
  homeId?: number;
  saleId?: number;
  appointmentTime?: string;
  timeSlot?: string;
  notes?: string;
  status?: string;
  interestedItemIds?: number[];
  buyerName?: string;
  sellerName?: string;
  homeArea?: string;
  homeCity?: string;
  homeLatitude?: number;
  homeLongitude?: number;
}

export type AppointmentPayload = Partial<Appointment>;

export interface NotifyItemRemovedResult {
  notifiedCount: number;
  buyers: number[];
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly API = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getSellerAppointments(): Observable<Appointment[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<Appointment[]>(`${this.API}/appointments/seller`, { headers });
  }

  getSellerAppointmentsBySale(saleId: number): Observable<Appointment[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<Appointment[]>(`${this.API}/appointments/seller/sales/${saleId}`, { headers });
  }

  updateStatus(appointmentId: number, status: string): Observable<Appointment> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const params = new HttpParams().set('status', status);
    return this.http.post<Appointment>(`${this.API}/appointments/seller/appointments/${appointmentId}/status`, null, { headers, params });
  }

  confirmAppointment(appointmentId: number): Observable<Appointment> {
    return this.updateStatus(appointmentId, 'CONFIRMED');
  }

  cancelAppointment(appointmentId: number): Observable<Appointment> {
    return this.updateStatus(appointmentId, 'CANCELLED');
  }

  createAppointment(appointmentData: AppointmentPayload): Observable<Appointment> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<Appointment>(`${this.API}/appointments`, appointmentData, { headers });
  }

  updateAppointment(appointmentId: number, dto: AppointmentPayload): Observable<Appointment> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.put<Appointment>(`${this.API}/appointments/${appointmentId}`, dto, { headers });
  }

  deleteAppointment(appointmentId: number): Observable<void> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.delete<void>(`${this.API}/appointments/${appointmentId}`, { headers });
  }

  getUserAppointments(userId: number): Observable<Appointment[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<Appointment[]>(`${this.API}/appointments/user/${userId}`, { headers });
  }

  getBuyerAppointments(): Observable<Appointment[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<Appointment[]>(`${this.API}/appointments`, { headers });
  }

  getMyAppointments(): Observable<Appointment[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<Appointment[]>(`${this.API}/appointments/mine`, { headers });
  }

  notifyItemRemoved(saleId: number, itemId: number): Observable<NotifyItemRemovedResult> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    // backend may implement this route to inform affected buyers; best-effort call
    return this.http.post<NotifyItemRemovedResult>(`${this.API}/appointments/notify-item-removed`, { saleId, itemId }, { headers });
  }

  getSlotCount(saleId: number, timeSlot: string, dateIso: string): Observable<number> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http
      .get<number | { count?: number }>(
        `${this.API}/appointments/slot-count?saleId=${saleId}&timeSlot=${encodeURIComponent(timeSlot)}&date=${encodeURIComponent(dateIso)}`,
        { headers }
      )
      .pipe(
        map((res) => {
          if (typeof res === 'number') return res;
          const count = Number(res?.count ?? 0);
          return Number.isFinite(count) ? count : 0;
        })
      );
  }

  normalizeStatus(status: string | null | undefined): 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'UNKNOWN' {
    if (!status) return 'UNKNOWN';
    const normalized = status.toUpperCase();
    if (normalized === 'PENDING') return 'PENDING';
    if (normalized === 'CONFIRMED') return 'CONFIRMED';
    if (normalized === 'CANCELLED' || normalized === 'CANCELED') return 'CANCELLED';
    return 'UNKNOWN';
  }
}
