import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppointmentService } from '../../services/appointment.service';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="appointments-container">
      <div class="appointments-header">
        <div class="header-left">
          <h2>
            <mat-icon>event</mat-icon>
            Appointments
          </h2>
          <p>View and manage your appointments</p>
        </div>
        <div class="header-right" *ngIf="appointments.length">
          <div class="filter-chips">
            <button mat-stroked-button [color]="selectedStatus === 'ALL' ? 'primary' : undefined" (click)="setStatus('ALL')">
              <mat-icon>all_inclusive</mat-icon>
              All
            </button>
            <button mat-stroked-button [color]="selectedStatus === 'PENDING' ? 'primary' : undefined" (click)="setStatus('PENDING')">
              <mat-icon>hourglass_empty</mat-icon>
              Pending
            </button>
            <button mat-stroked-button [color]="selectedStatus === 'CONFIRMED' ? 'primary' : undefined" (click)="setStatus('CONFIRMED')">
              <mat-icon>check_circle</mat-icon>
              Confirmed
            </button>
            <button mat-stroked-button [color]="selectedStatus === 'CANCELLED' ? 'primary' : undefined" (click)="setStatus('CANCELLED')">
              <mat-icon>cancel</mat-icon>
              Cancelled
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading appointments...</p>
      </div>

      <div *ngIf="!isLoading && !appointments.length" class="empty-state">
        <mat-icon>event_busy</mat-icon>
        <h3>No appointments yet</h3>
        <p>When appointments are created, they will appear here.</p>
      </div>

      <div *ngIf="!isLoading && filteredAppointments.length" class="appointments-grid">
        <mat-card *ngFor="let appointment of filteredAppointments" class="appointment-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>person</mat-icon>
              <span class="name">{{ appointment.buyerName || appointment.sellerName || ('User ' + (appointment.buyerId || appointment.sellerId)) }}</span>
            </mat-card-title>
            <mat-card-subtitle>
              <mat-icon>event</mat-icon>
              {{ appointment.appointmentTime | date:'EEE, MMM d, h:mm a' }}
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="meta-row">
              <div class="meta">
                <mat-icon>sell</mat-icon>
                Sale #{{ appointment.saleId }}
              </div>
              <div class="meta" *ngIf="appointment.homeArea || appointment.homeCity">
                <mat-icon>location_on</mat-icon>
                {{ appointment.homeArea }}<ng-container *ngIf="appointment.homeCity">, {{ appointment.homeCity }}</ng-container>
              </div>
              <div class="meta" *ngIf="appointment.timeSlot">
                <mat-icon>schedule</mat-icon>
                Slot {{ appointment.timeSlot }}
              </div>
            </div>

            <div class="notes" *ngIf="appointment.notes">
              <mat-icon>notes</mat-icon>
              <span>{{ appointment.notes }}</span>
            </div>

            <div class="status-chip">
              <mat-chip [ngClass]="'status-' + (appointment.statusNorm || '').toLowerCase()" selected>
                {{ appointment.statusNorm || 'UNKNOWN' }}
              </mat-chip>
            </div>
          </mat-card-content>

          <mat-card-actions class="actions" *ngIf="appointment.statusNorm === 'PENDING'">
            <button mat-raised-button color="primary"
                    (click)="confirmAppointment(appointment.id)"
                    [disabled]="isUpdating === appointment.id">
              <mat-icon>check</mat-icon>
              {{ isUpdating === appointment.id ? 'Confirming...' : 'Confirm' }}
            </button>
            <button mat-raised-button color="warn"
                    (click)="cancelAppointment(appointment.id)"
                    [disabled]="isUpdating === appointment.id">
              <mat-icon>close</mat-icon>
              {{ isUpdating === appointment.id ? 'Cancelling...' : 'Cancel' }}
            </button>
          </mat-card-actions>

          <mat-card-actions class="actions" *ngIf="appointment.statusNorm !== 'PENDING'">
            <span class="status-message">
              <mat-icon>info</mat-icon>
              Appointment {{ appointment.statusNorm?.toLowerCase() }}
            </span>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .appointments-container { max-width: 1100px; margin: 0 auto; padding: var(--spacing-lg); }
    .appointments-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md); }
    .appointments-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .appointments-header p { color: var(--text-secondary); margin: 4px 0 0 32px; }
    .filter-chips { display: flex; gap: 8px; align-items: center; }

    .loading-container, .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: var(--spacing-xl); color: var(--text-secondary); }
    .empty-state mat-icon { font-size: 40px; height: 40px; width: 40px; color: var(--text-light); }

    .appointments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--spacing-md); }
    .appointment-card { border: 1px solid var(--border-color); border-radius: var(--border-radius-lg); }
    .name { margin-left: 6px; }
    .meta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
    .meta { display: inline-flex; align-items: center; gap: 6px; color: var(--text-secondary); }
    .notes { display: flex; align-items: flex-start; gap: 8px; color: var(--text-primary); background: var(--background-gray); padding: 8px 12px; border-radius: var(--border-radius-sm); }
    .status-chip { margin-top: 8px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; }

    .status-pending { background-color: rgba(255, 193, 7, 0.15); color: #b26a00; }
    .status-confirmed { background-color: rgba(76, 175, 80, 0.15); color: #1b5e20; }
    .status-cancelled { background-color: rgba(244, 67, 54, 0.15); color: #b71c1c; }
  `]
})
export class AppointmentsComponent implements OnInit {
  appointments: any[] = [];
  isLoading = false;
  isUpdating: number | null = null;
  selectedStatus: 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' = 'ALL';

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.isLoading = true;
    forkJoin({
      mine: this.appointmentService.getMyAppointments().pipe(catchError(() => of([]))),
      seller: this.appointmentService.getSellerAppointments().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ mine, seller }) => {
        const merged = [...(mine || []), ...(seller || [])];
        const byId = new Map<number, any>();
        for (const appt of merged) {
          if (appt?.id != null) {
            byId.set(appt.id, {
              ...appt,
              statusNorm: this.appointmentService.normalizeStatus(appt?.status)
            });
          }
        }
        this.appointments = Array.from(byId.values()).sort((a, b) => {
          const at = new Date(a?.appointmentTime || 0).getTime();
          const bt = new Date(b?.appointmentTime || 0).getTime();
          return bt - at;
        });
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load appointments. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.appointments = [];
        this.isLoading = false;
      }
    });
  }

  confirmAppointment(id: number) {
    this.isUpdating = id;
    this.appointmentService.confirmAppointment(id).subscribe({
      next: () => {
        const appointment = this.appointments.find(a => a.id === id);
        if (appointment) {
          appointment.status = 'CONFIRMED';
          appointment.statusNorm = 'CONFIRMED';
          this.snackBar.open('Appointment confirmed successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
        this.isUpdating = null;
      },
      error: (error) => {
        this.snackBar.open('Failed to confirm appointment. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isUpdating = null;
      }
    });
  }

  cancelAppointment(id: number) {
    this.isUpdating = id;
    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => {
        const appointment = this.appointments.find(a => a.id === id);
        if (appointment) {
          appointment.status = 'CANCELLED';
          appointment.statusNorm = 'CANCELLED';
          this.snackBar.open('Appointment cancelled successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
        this.isUpdating = null;
      },
      error: (error) => {
        this.snackBar.open('Failed to cancel appointment. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isUpdating = null;
      }
    });
  }

  get filteredAppointments() {
    if (this.selectedStatus === 'ALL') return this.appointments;
    return this.appointments.filter(a => a.statusNorm === this.selectedStatus);
  }

  setStatus(status: 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED') {
    this.selectedStatus = status;
  }
}
