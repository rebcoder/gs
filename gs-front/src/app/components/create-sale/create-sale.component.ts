import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-create-sale',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './create-sale.component.html',
  styleUrl: './create-sale.component.scss'
})
export class CreateSaleComponent implements OnDestroy {
  form: any;
  isLoading = false;
  createItemImageFile: File | null = null;
  createItemImagePreviewUrl: string | null = null;
  readonly itemCategories = [
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
    private fb: FormBuilder,
    private sales: SalesService,
    private snack: MatSnackBar,
    private router: Router
  ) {
    this.form = this.fb.group({
      saleName: ['', Validators.required],
      description: [''],
      saleDate: [''],
      startTime: ['09:00', Validators.required],
      endTime: ['17:00', Validators.required],
      city: ['', Validators.required],
      area: ['', Validators.required],
      maxAppointmentsPerSlot: [3],
      firstItemName: [''],
      firstItemPrice: [''],
      firstItemCategory: ['OTHER'],
      firstItemDescription: ['']
    });
  }

  ngOnDestroy(): void {
    this.clearCreateItemImage();
  }

  submit(): void {
    if (this.form.invalid) return;
    const firstItem = this.buildFirstItemPayload();
    if (firstItem === null) {
      this.snack.open('For first item, please provide both name and price', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading = true;
    const payload = {
      saleName: this.form.value.saleName,
      description: this.form.value.description,
      saleDate: this.form.value.saleDate || undefined,
      city: this.form.value.city,
      area: this.form.value.area,
      startTime: this.form.value.startTime,
      endTime: this.form.value.endTime,
      maxAppointmentsPerSlot: this.form.value.maxAppointmentsPerSlot
    };

    this.sales.createGarageSale(payload).subscribe({
      next: (createdSale) => {
        if (!firstItem || !createdSale?.id) {
          this.isLoading = false;
          this.snack.open('Garage sale created', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
          this.router.navigate(['/my-sales']);
          return;
        }

        this.sales.addItemToSale(createdSale.id, firstItem).subscribe({
          next: (createdItem) => {
            if (this.createItemImageFile && createdItem?.id) {
              this.sales.uploadItemImage(createdItem.id, this.createItemImageFile).subscribe({
                next: () => {
                  this.isLoading = false;
                  this.snack.open('Garage sale and first item created', 'Close', {
                    duration: 3000,
                    panelClass: ['success-snackbar']
                  });
                  this.router.navigate(['/my-sales']);
                },
                error: (uploadErr) => {
                  this.isLoading = false;
                  console.error('First item image upload failed', uploadErr);
                  this.snack.open('Sale created, but first item image upload failed', 'Close', {
                    duration: 4000,
                    panelClass: ['warning-snackbar']
                  });
                  this.router.navigate(['/my-sales']);
                }
              });
              return;
            }

            this.isLoading = false;
            this.snack.open('Garage sale and first item created', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/my-sales']);
          },
          error: (itemErr) => {
            this.isLoading = false;
            console.error('First item create failed', itemErr);
            this.snack.open('Sale created, but failed to add first item', 'Close', {
              duration: 4000,
              panelClass: ['warning-snackbar']
            });
            this.router.navigate(['/my-sales']);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Create sale failed', err);
        this.snack.open(err?.message || 'Failed to create sale', 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onCreateItemImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.snack.open('Please select a valid image file', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.snack.open('Image must be 5MB or smaller', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      input.value = '';
      return;
    }

    this.createItemImageFile = file;
    if (this.createItemImagePreviewUrl) {
      URL.revokeObjectURL(this.createItemImagePreviewUrl);
    }
    this.createItemImagePreviewUrl = URL.createObjectURL(file);
  }

  clearCreateItemImage(input?: HTMLInputElement): void {
    this.createItemImageFile = null;
    if (this.createItemImagePreviewUrl) {
      URL.revokeObjectURL(this.createItemImagePreviewUrl);
      this.createItemImagePreviewUrl = null;
    }
    if (input) input.value = '';
  }

  cancel(): void {
    this.router.navigate(['/my-sales']);
  }

  private buildFirstItemPayload(): any | null | undefined {
    const name = this.form.value.firstItemName?.trim();
    const rawPrice = this.form.value.firstItemPrice;
    const hasName = !!name;
    const hasPrice = rawPrice !== null && rawPrice !== undefined && rawPrice !== '';

    if (!hasName && !hasPrice) {
      return undefined;
    }
    if (!hasName || !hasPrice) {
      return null;
    }

    return {
      name,
      price: Number(rawPrice),
      category: this.form.value.firstItemCategory || 'OTHER',
      description: this.form.value.firstItemDescription || ''
    };
  }
}
