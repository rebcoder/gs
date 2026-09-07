import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BookAppointmentDialogComponent } from '../book-appointment-dialog/book-appointment-dialog.component';
import { LoadingComponent } from '../loading/loading.component';
import { AppointmentService } from '../../services/appointment.service';
import { SalesService } from '../../services/sales.service';
import { MarketplaceService } from '../../services/marketplace.service';
import { MarketplaceItem, MarketplaceSale } from '../../models/marketplace.models';
import { SaleItemModalComponent } from '../sale-item-modal/sale-item-modal.component';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    LoadingComponent
  ],
  templateUrl: './sale-detail.component.html',
  styleUrl: './sale-detail.component.scss'
})
export class SaleDetailComponent implements OnInit, OnDestroy {
  sale: MarketplaceSale | null = null;
  itemForm;
  isAdding = false;
  itemImageFile: File | null = null;
  itemImagePreviewUrl: string | null = null;
  selectedImageUrl = '';

  readonly categories = [
    'FURNITURE',
    'ELECTRONICS',
    'CLOTHING',
    'HOME_DECOR',
    'KITCHEN_APPLIANCES',
    'BOOKS',
    'SPORTS_EQUIPMENT',
    'COLLECTIBLES',
    'ANTIQUES',
    'OTHER'
  ];

  constructor(
    private route: ActivatedRoute,
    private salesService: SalesService,
    private marketplaceService: MarketplaceService,
    private appointments: AppointmentService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.itemForm = this.fb.group({
      name: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      category: ['OTHER', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    const idValue = this.route.snapshot.paramMap.get('id');
    const saleId = idValue ? Number(idValue) : Number.NaN;
    if (!Number.isFinite(saleId) || saleId <= 0) {
      this.snackBar.open('Invalid sale ID', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      this.router.navigate(['/browse']);
      return;
    }
    this.loadSaleDetails(saleId);
  }

  ngOnDestroy(): void {
    this.clearItemImage();
  }

  loadSaleDetails(id: number): void {
    this.marketplaceService.getSaleById(id).subscribe({
      next: (sale) => {
        this.sale = sale;
        this.selectedImageUrl = sale.imageUrl || sale.items[0]?.imageUrl || '';
      },
      error: (err) => {
        console.error('Failed to load sale details:', err);
        this.snackBar.open('Failed to load sale details', 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/browse']);
      }
    });
  }

  selectImage(url: string): void {
    this.selectedImageUrl = url;
  }

  itemGalleryImages(): string[] {
    if (!this.sale) return [];
    const images = this.sale.items.map((item) => item.imageUrl).filter((url) => !!url);
    if (this.sale.imageUrl) {
      images.unshift(this.sale.imageUrl);
    }
    return Array.from(new Set(images));
  }

  openItemPreview(item: MarketplaceItem): void {
    if (!this.sale) return;
    const sellerRaw = this.sale.raw['seller'] as { username?: string } | undefined;
    const sellerName = sellerRaw?.username || undefined;

    const ref = this.dialog.open(SaleItemModalComponent, {
      width: '820px',
      maxWidth: '95vw',
      data: {
        sale: this.sale,
        item,
        sellerName
      }
    });

    ref.afterClosed().subscribe((result: { openVisitPlan?: boolean } | undefined) => {
      if (result?.openVisitPlan) {
        this.router.navigate(['/visit-plan']);
      }
    });
  }

  addItem(): void {
    if (this.itemForm.invalid || !this.sale) return;

    this.isAdding = true;
    const payload = this.itemForm.value;
    this.salesService.addItemToSale(this.sale.id, payload).subscribe({
      next: (created) => {
        const createdItemId = Number(created?.id);
        if (this.itemImageFile && Number.isFinite(createdItemId) && createdItemId > 0) {
          this.salesService.uploadItemImage(createdItemId, this.itemImageFile).subscribe({
            next: () => {
              this.handleAddItemSuccess('Item and image added');
            },
            error: (uploadErr) => {
              console.error('Item image upload failed', uploadErr);
              this.handleAddItemSuccess('Item added, but image upload failed', true);
            }
          });
          return;
        }

        this.handleAddItemSuccess('Item added');
      },
      error: (err) => {
        this.isAdding = false;
        console.error('Failed to add item', err);
        this.snackBar.open(err?.message || 'Failed to add item', 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  removeItem(itemId: number): void {
    if (!this.sale) return;
    if (!confirm('Remove this item? Buyers with appointments for this item will be notified.')) return;

    const saleId = this.sale.id;
    this.salesService.removeItemFromSale(saleId, itemId).subscribe({
      next: () => {
        if (this.sale) {
          this.sale.items = this.sale.items.filter((item) => item.id !== itemId);
        }

        this.snackBar.open('Item removed', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        this.appointments.notifyItemRemoved(saleId, itemId).subscribe({
          next: (res: { notifiedCount?: number }) => {
            const count = res?.notifiedCount ?? 0;
            if (count > 0) {
              this.snackBar.open(`${count} buyers notified about removed item`, 'Close', {
                duration: 3000,
                panelClass: ['info-snackbar']
              });
            }
          },
          error: (notifyErr) => {
            console.warn('Notify failed', notifyErr);
            this.snackBar.open('Item removed, but buyers could not be notified', 'Close', {
              duration: 3500,
              panelClass: ['warning-snackbar']
            });
          }
        });
      },
      error: (err) => {
        console.error('Failed to remove item', err);
        this.snackBar.open(err?.message || 'Failed to remove item', 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  book(): void {
    if (!this.sale) return;

    const dialogRef = this.dialog.open(BookAppointmentDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        sale: this.sale.raw,
        saleId: this.sale.id
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.snackBar.open('Appointment booked successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  onItemImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select a valid image file', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('Image must be 5MB or smaller', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      input.value = '';
      return;
    }

    this.itemImageFile = file;
    if (this.itemImagePreviewUrl) {
      URL.revokeObjectURL(this.itemImagePreviewUrl);
    }
    this.itemImagePreviewUrl = URL.createObjectURL(file);
  }

  clearItemImage(input?: HTMLInputElement): void {
    this.itemImageFile = null;
    if (this.itemImagePreviewUrl) {
      URL.revokeObjectURL(this.itemImagePreviewUrl);
      this.itemImagePreviewUrl = null;
    }
    if (input) input.value = '';
  }

  canManageSale(): boolean {
    return true;
  }

  trackByItemId(_: number, item: MarketplaceItem): number {
    return item.id;
  }

  trackByImageUrl(_: number, url: string): string {
    return url;
  }

  humanizeCategory(category: string): string {
    return this.marketplaceService.humanizeCategory(category || 'OTHER');
  }

  private handleAddItemSuccess(message: string, warning = false): void {
    this.isAdding = false;
    this.itemForm.reset({ name: '', price: null, category: 'OTHER', description: '' });
    this.clearItemImage();

    if (this.sale) {
      this.loadSaleDetails(this.sale.id);
    }

    this.snackBar.open(message, 'Close', {
      duration: 3200,
      panelClass: [warning ? 'warning-snackbar' : 'success-snackbar']
    });
  }
}
