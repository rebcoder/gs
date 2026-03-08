import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-my-sales',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatDialogModule, MatSnackBarModule, MatIconModule, RouterLink],
  template: `
    <div class="my-sales-wrapper">
      <div class="header">
        <div>
          <h2><mat-icon>store</mat-icon> My Sales</h2>
          <p class="subtitle">Create and manage your garage sales</p>
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
            <div class="meta-row">
              <div class="meta" *ngIf="s.startTime || s.endTime">
                <mat-icon>schedule</mat-icon>
                <span>{{ (s.startTime || '') + (s.endTime ? ' - ' + s.endTime : '') }}</span>
              </div>
              <div class="meta" *ngIf="s.items?.length">
                <mat-icon>inventory</mat-icon>
                <span>{{ s.items.length }} items</span>
              </div>
            </div>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-stroked-button color="warn" (click)="deleteSale(s.id)">
              <mat-icon>delete</mat-icon>
              Delete
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

    .sales-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--spacing-md); }
    .sale-card { border: 1px solid var(--border-color); border-radius: var(--border-radius-lg); }
    .description { color: var(--text-primary); margin: 0 0 8px; min-height: 40px; }
    .meta-row { display: flex; gap: 12px; color: var(--text-secondary); }
    .meta { display: inline-flex; align-items: center; gap: 6px; }
  `]
})
export class MySalesComponent implements OnInit {
  sales: any[] = [];

  constructor(private salesService: SalesService, private snack: MatSnackBar) {}

  ngOnInit() {
    this.salesService.getMyGarageSales().subscribe({ next: (data) => this.sales = data || [], error: () => this.sales = [] });
  }

  deleteSale(id: number) {
    if (!confirm('Are you sure you want to delete this sale? This action cannot be undone.')) return;
    this.salesService.deleteGarageSale(id).subscribe({ next: () => {
      this.sales = this.sales.filter(s => s.id !== id);
      this.snack.open('Sale deleted', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
    }, error: (err) => {
      console.error('Failed to delete sale', err);
      this.snack.open(err?.message || 'Failed to delete sale', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
    }});
  }
}
