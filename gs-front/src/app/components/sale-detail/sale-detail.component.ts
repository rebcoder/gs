import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { SalesService } from '../../services/sales.service';

import { AppointmentService } from '../../services/appointment.service';
import { BookAppointmentDialogComponent } from '../book-appointment-dialog/book-appointment-dialog.component';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatDialogModule,
    LoadingComponent
  ],
  templateUrl: './sale-detail.component.html',
})
export class SaleDetailComponent implements OnInit {
  sale: any = null;
  itemForm: any;
  isAdding = false;

  constructor(
    private route: ActivatedRoute,
    private sales: SalesService,
    private appointments: AppointmentService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.itemForm = this.fb.group({ name: ['', Validators.required], price: ['', Validators.required], category: ['Other'] });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadSaleDetails(id);
    } else {
      this.snack.open('Invalid sale ID', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      this.router.navigate(['/browse']);
    }
  }

  loadSaleDetails(id: number) {
    this.sales.getGarageSaleById(id).subscribe({
      next: (sale) => {
        this.sale = sale;
        console.log('Loaded sale details:', sale);
      },
      error: (err) => {
        console.error('Failed to load sale details:', err);
        this.snack.open('Failed to load sale details', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
        this.router.navigate(['/browse']);
      }
    });
  }

  addItem() {
    if (this.itemForm.invalid || !this.sale) return;
    this.isAdding = true;
    const payload = this.itemForm.value;
    this.sales.addItemToSale(this.sale.id, payload).subscribe({ next: (res) => {
      this.isAdding = false;
      // refresh local sale items
      this.sale.items = this.sale.items || [];
      this.sale.items.push(res);
      this.itemForm.reset({ name: '', price: '', category: 'Other' });
      this.snack.open('Item added', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
    }, error: (err) => {
      this.isAdding = false;
      console.error('Failed to add item', err);
      this.snack.open(err?.message || 'Failed to add item', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
    }});
  }

  removeItem(itemId: number) {
    if (!this.sale) return;
    if (!confirm('Remove this item? Buyers with appointments for this item will be notified.')) return;
    this.sales.removeItemFromSale(this.sale.id, itemId).subscribe({ next: () => {
      this.sale.items = this.sale.items.filter((it: any) => it.id !== itemId);
      this.snack.open('Item removed', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
      // notify backend to inform affected appointment holders (best-effort)
      this.appointments.notifyItemRemoved(this.sale.id, itemId).subscribe({ next: (res: any) => {
        // notification succeeded
        const count = res?.notifiedCount || 0;
        if (count > 0) {
          this.snack.open(count + ' buyers notified about removed item', 'Close', { duration: 3000, panelClass: ['info-snackbar'] });
        }
      }, error: (err) => {
        console.warn('Notify failed', err);
      }});
    }, error: (err) => {
      console.error('Failed to remove item', err);
      this.snack.open(err?.message || 'Failed to remove item', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
    }});
  }

  book() {
    if (!this.sale) return;

    const dialogRef = this.dialog.open(BookAppointmentDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        sale: this.sale,
        saleId: this.sale.id
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Appointment was booked successfully
        this.snack.open('Appointment booked successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  calculateDistance(lat: number, lng: number): string {
    // Mock distance calculation - in a real app, you'd use user's location
    const mockUserLat = 12.34;
    const mockUserLng = 56.78;
    const distance = Math.sqrt(Math.pow(lat - mockUserLat, 2) + Math.pow(lng - mockUserLng, 2)) * 10;
    return distance.toFixed(1);
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'FURNITURE': 'primary',
      'ELECTRONICS': 'accent',
      'CLOTHING': 'warn',
      'HOME_DECOR': 'primary',
      'KITCHEN_APPLIANCES': 'accent',
      'BOOKS': 'warn',
      'SPORTS_EQUIPMENT': 'primary',
      'COLLECTIBLES': 'accent',
      'ANTIQUES': 'warn',
      'OTHER': 'basic'
    };
    return colors[category] || 'basic';
  }

  formatCategory(category: string): string {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  canManageSale(): boolean {
    // In a real app, you'd check if the current user is the seller of this sale
    // For now, we'll allow management for demo purposes
    return true;
  }
}
