import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppointmentService } from '../../services/appointment.service';
import { SalesService } from '../../services/sales.service';

type SellerStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'UNKNOWN';

@Component({
  selector: 'app-my-sale-appointments',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="page">
      <div class="header">
        <div>
          <a class="back-link" routerLink="/my-sales">
            <mat-icon>arrow_back</mat-icon>
            Back to My Sales
          </a>
          <h2>
            <mat-icon>event</mat-icon>
            Sale Appointments
          </h2>
          <p *ngIf="sale">{{ sale.saleName || sale.title }} • {{ sale.area }}, {{ sale.city }}</p>
        </div>
      </div>

      <div *ngIf="isLoading" class="state">
        <mat-icon>hourglass_empty</mat-icon>
        <p>Loading appointments...</p>
      </div>

      <div *ngIf="!isLoading && appointments.length === 0" class="state">
        <mat-icon>event_busy</mat-icon>
        <h3>No appointments yet</h3>
        <p>Appointments for this sale will appear here.</p>
      </div>

      <div class="list" *ngIf="!isLoading && appointments.length">
        <mat-card class="card" *ngFor="let appointment of appointments">
          <mat-card-header>
            <mat-card-title>{{ appointment.buyerName || ('Buyer #' + appointment.buyerId) }}</mat-card-title>
            <mat-card-subtitle>
              {{ appointment.appointmentTime | date:'EEE, MMM d, y, h:mm a' }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="meta">
              <span *ngIf="appointment.timeSlot"><mat-icon>schedule</mat-icon>{{ appointment.timeSlot }}</span>
              <span *ngIf="appointment.notes"><mat-icon>notes</mat-icon>{{ appointment.notes }}</span>
            </div>
            <mat-chip class="status-badge" [ngClass]="statusClass(appointment.statusNorm)" selected>
              {{ appointment.statusNorm }}
            </mat-chip>
          </mat-card-content>
          <mat-card-actions class="actions">
            <button
              mat-raised-button
              color="primary"
              *ngIf="appointment.statusNorm === 'PENDING'"
              [disabled]="isUpdatingId === appointment.id"
              (click)="confirm(appointment.id)">
              <mat-icon>check_circle</mat-icon>
              Confirm
            </button>
            <button
              mat-stroked-button
              color="warn"
              *ngIf="appointment.statusNorm !== 'CANCELLED'"
              [disabled]="isUpdatingId === appointment.id"
              (click)="cancel(appointment.id)">
              <mat-icon>cancel</mat-icon>
              Cancel
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 980px; margin: 0 auto; padding: var(--spacing-lg); }
    .header { margin-bottom: 16px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: #475569; text-decoration: none; margin-bottom: 10px; font-weight: 600; }
    .back-link:hover { color: #0f172a; }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    p { margin: 6px 0 0 32px; color: #64748b; }

    .state { border: 1px dashed #cbd5e1; border-radius: 14px; background: #f8fafc; padding: 28px; text-align: center; color: #64748b; }
    .state mat-icon { font-size: 36px; width: 36px; height: 36px; }

    .list { display: grid; gap: 12px; }
    .card { border: 1px solid #e2e8f0; border-radius: 14px; }
    .meta { display: flex; flex-wrap: wrap; gap: 12px; color: #475569; margin-bottom: 8px; }
    .meta span { display: inline-flex; align-items: center; gap: 6px; }
    .meta mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .status-badge { font-weight: 700; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-confirmed { background: #dcfce7; color: #166534; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    .status-unknown { background: #e2e8f0; color: #334155; }

    .actions { display: flex; gap: 8px; justify-content: flex-end; }
  `]
})
export class MySaleAppointmentsComponent implements OnInit {
  saleId = 0;
  sale: any = null;
  appointments: Array<any & { statusNorm: SellerStatus }> = [];
  isLoading = false;
  isUpdatingId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private salesService: SalesService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.saleId = Number(this.route.snapshot.paramMap.get('saleId'));
    if (!this.saleId) {
      this.snack.open('Invalid sale id', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }
    this.load();
  }

  load(): void {
    this.isLoading = true;
    forkJoin({
      sale: this.salesService.getGarageSaleById(this.saleId).pipe(catchError(() => of(null))),
      appointments: this.appointmentService.getSellerAppointmentsBySale(this.saleId).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ sale, appointments }) => {
        this.sale = sale;
        this.appointments = (appointments as any[])
          .map((appt) => ({
            ...appt,
            statusNorm: this.appointmentService.normalizeStatus(appt?.status)
          }))
          .sort((a, b) => new Date(a?.appointmentTime || 0).getTime() - new Date(b?.appointmentTime || 0).getTime());
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.appointments = [];
        this.snack.open('Failed to load appointments', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
      }
    });
  }

  confirm(id: number): void {
    this.isUpdatingId = id;
    this.appointmentService.confirmAppointment(id).subscribe({
      next: () => {
        this.updateLocalStatus(id, 'CONFIRMED');
        this.isUpdatingId = null;
        this.snack.open('Appointment confirmed', 'Close', { duration: 2500, panelClass: ['success-snackbar'] });
      },
      error: () => {
        this.isUpdatingId = null;
        this.snack.open('Failed to confirm appointment', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
      }
    });
  }

  cancel(id: number): void {
    this.isUpdatingId = id;
    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => {
        this.updateLocalStatus(id, 'CANCELLED');
        this.isUpdatingId = null;
        this.snack.open('Appointment cancelled', 'Close', { duration: 2500, panelClass: ['success-snackbar'] });
      },
      error: () => {
        this.isUpdatingId = null;
        this.snack.open('Failed to cancel appointment', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
      }
    });
  }

  statusClass(status: SellerStatus): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'CONFIRMED': return 'status-confirmed';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  private updateLocalStatus(id: number, status: SellerStatus): void {
    const target = this.appointments.find((item) => item.id === id);
    if (target) {
      target.statusNorm = status;
      target.status = status;
    }
  }
}

