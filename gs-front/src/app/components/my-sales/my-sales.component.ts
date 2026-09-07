import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SalesService } from '../../services/sales.service';
import { AppointmentService } from '../../services/appointment.service';

@Component({
  selector: 'app-my-sales',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatSnackBarModule, MatIconModule, RouterLink],
  template: `
    <div class="my-sales-wrapper">
      <div class="header">
        <div>
          <h2><mat-icon>store</mat-icon> My Sales</h2>
          <p class="subtitle">Create, track and manage your garage sales</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/create-sale">
          <mat-icon>add</mat-icon>
          Create New Sale
        </button>
      </div>

      <div *ngIf="!sales.length" class="empty-state">
        <mat-icon>inventory_2</mat-icon>
        <h3>No sales yet</h3>
        <p>Create your first sale and start listing items for your neighbors.</p>
        <button mat-raised-button color="primary" routerLink="/create-sale">Create Sale</button>
      </div>

      <div *ngIf="sales.length" class="sales-grid">
        <mat-card *ngFor="let s of sales" class="sale-card">
          <mat-card-header>
            <mat-card-title>{{ s.saleName || s.title }}</mat-card-title>
            <mat-card-subtitle>{{ s.area }}, {{ s.city }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p class="description">{{ s.description }}</p>

            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">Date</span>
                <span class="meta-value">{{ s.saleDate ? (s.saleDate | date:'EEE, MMM d, y') : 'TBD' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Items</span>
                <span class="meta-value">{{ s.itemCount }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Appointments</span>
                <span class="meta-value">{{ s.appointmentCount }}</span>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions class="actions">
            <a mat-stroked-button color="primary" [routerLink]="['/sale', s.id]">
              <mat-icon>edit</mat-icon>
              Edit Sale
            </a>
            <a mat-stroked-button color="accent" [routerLink]="['/my-sales', s.id, 'appointments']">
              <mat-icon>event</mat-icon>
              View Appointments
            </a>
            <button mat-stroked-button color="warn" (click)="cancelSale(s.id)">
              <mat-icon>cancel</mat-icon>
              Cancel Sale
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .my-sales-wrapper { max-width: 1100px; margin: 0 auto; padding: var(--spacing-lg); }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md); }
    .header h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .subtitle { color: var(--text-secondary); margin: 4px 0 0 32px; }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: var(--spacing-xl); color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius: var(--border-radius-lg); background: var(--background-gray); }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; color: var(--text-light); }

    .sales-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: var(--spacing-md); }
    .sale-card { border: 1px solid var(--border-color); border-radius: var(--border-radius-lg); }
    .description { color: var(--text-primary); margin: 0 0 14px; min-height: 40px; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .meta-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
    .meta-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; font-weight: 700; }
    .meta-value { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; padding: 12px 16px 16px; }
    @media (max-width: 768px) {
      .header { flex-direction: column; align-items: stretch; gap: 12px; }
      .subtitle { margin-left: 0; }
      .meta-grid { grid-template-columns: 1fr; }
      .actions { justify-content: stretch; }
      .actions a, .actions button { width: 100%; }
    }
  `]
})
export class MySalesComponent implements OnInit {
  sales: Array<any & { itemCount: number; appointmentCount: number }> = [];

  constructor(
    private salesService: SalesService,
    private appointmentService: AppointmentService,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    forkJoin({
      sales: this.salesService.getMyGarageSales().pipe(catchError(() => of([]))),
      appointments: this.appointmentService.getSellerAppointments().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ sales, appointments }) => {
        const counts = new Map<number, number>();
        for (const appt of appointments as any[]) {
          const saleId = Number(appt?.saleId);
          if (!Number.isFinite(saleId)) continue;
          counts.set(saleId, (counts.get(saleId) || 0) + 1);
        }

        this.sales = (sales as any[]).map((sale) => ({
          ...sale,
          itemCount: Array.isArray(sale?.items) ? sale.items.length : 0,
          appointmentCount: counts.get(Number(sale?.id)) || 0
        }));
      },
      error: () => {
        this.sales = [];
      }
    });
  }

  cancelSale(id: number) {
    if (!confirm('Cancel this sale? This will remove it from your active listings.')) return;
    this.salesService.cancelGarageSale(id).subscribe({ next: () => {
      this.sales = this.sales.filter(s => s.id !== id);
      this.snack.open('Sale cancelled', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
    }, error: (err) => {
      console.error('Failed to cancel sale', err);
      this.snack.open(err?.message || 'Failed to cancel sale', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
    }});
  }
}
