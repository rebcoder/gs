import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly API = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getSellerAppointments(): Observable<any[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<any[]>(`${this.API}/appointments/seller`, { headers });
  }

  updateStatus(appointmentId: number, status: string) {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post(`${this.API}/appointments/seller/appointments/${appointmentId}/status?status=${status}`, null, { headers });
  }

  createAppointment(appointmentData: any): Observable<any> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post(`${this.API}/appointments`, appointmentData, { headers });
  }

  updateAppointment(appointmentId: number, dto: any): Observable<any> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.put(`${this.API}/appointments/${appointmentId}`, dto, { headers });
  }

  deleteAppointment(appointmentId: number): Observable<any> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.delete(`${this.API}/appointments/${appointmentId}`, { headers });
  }

  getUserAppointments(userId: number): Observable<any[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<any[]>(`${this.API}/appointments/user/${userId}`, { headers });
  }

  getBuyerAppointments(): Observable<any[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<any[]>(`${this.API}/appointments`, { headers });
  }

  getMyAppointments(): Observable<any[]> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<any[]>(`${this.API}/appointments/mine`, { headers });
  }

  notifyItemRemoved(saleId: number, itemId: number): Observable<any> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    // backend may implement this route to inform affected buyers; best-effort call
    return this.http.post(`${this.API}/appointments/notify-item-removed`, { saleId, itemId }, { headers });
  }

  getSlotCount(saleId: number, timeSlot: string, dateIso: string): Observable<number> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    // backend should return { count: number } or just a number; map accordingly on caller
    return this.http.get<number>(`${this.API}/appointments/slot-count?saleId=${saleId}&timeSlot=${encodeURIComponent(timeSlot)}&date=${encodeURIComponent(dateIso)}`, { headers });
  }
}
