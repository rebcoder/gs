import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MarketplaceItem, MarketplaceSale } from '../../models/marketplace.models';
import { MarketplaceService } from '../../services/marketplace.service';

export interface SaleItemModalData {
  sale: MarketplaceSale;
  item: MarketplaceItem;
  sellerName?: string;
}

@Component({
  selector: 'app-sale-item-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="max-w-3xl">
      <h2 mat-dialog-title class="text-xl font-semibold text-gray-900">{{ data.item.name }}</h2>

      <mat-dialog-content>
        <div class="grid gap-6 pt-2 md:grid-cols-[1.25fr_1fr]">
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
            <img
              *ngIf="data.item.imageUrl"
              [src]="data.item.imageUrl"
              [alt]="data.item.name"
              class="h-full max-h-[380px] w-full object-cover" />
            <div *ngIf="!data.item.imageUrl" class="flex h-[280px] items-center justify-center text-gray-400">
              <mat-icon class="!h-8 !w-8 !text-3xl">image</mat-icon>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Price</p>
              <p class="mt-1 text-2xl font-bold text-gray-900">$&nbsp;{{ data.item.price }}</p>
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Description</p>
              <p class="mt-1 text-sm leading-6 text-gray-700">{{ data.item.description || 'No description provided.' }}</p>
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Seller</p>
              <p class="mt-1 text-sm text-gray-700">{{ data.sellerName || 'GarageSale host' }}</p>
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Sale</p>
              <p class="mt-1 text-sm text-gray-700">{{ data.sale.title }} · {{ data.sale.locationLabel }}</p>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="!mt-2">
        <button mat-button type="button" (click)="close()">Close</button>
        <button mat-raised-button color="primary" type="button" (click)="addToVisitList()">
          <mat-icon class="!h-4 !w-4 !text-base">playlist_add</mat-icon>
          Add to Visit List
        </button>
      </mat-dialog-actions>
    </div>
  `
})
export class SaleItemModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SaleItemModalData,
    private dialogRef: MatDialogRef<SaleItemModalComponent>,
    private marketplaceService: MarketplaceService,
    private snackBar: MatSnackBar
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  addToVisitList(): void {
    this.marketplaceService.addVisitItem({
      saleId: this.data.sale.id,
      saleTitle: this.data.sale.title,
      saleLocation: this.data.sale.locationLabel,
      saleLatitude: this.data.sale.latitude,
      saleLongitude: this.data.sale.longitude,
      itemId: this.data.item.id,
      itemName: this.data.item.name,
      itemDescription: this.data.item.description,
      itemPrice: this.data.item.price,
      itemImageUrl: this.data.item.imageUrl
    });

    this.snackBar.open('Added to Visit List', 'Open planner', {
      duration: 3200
    }).onAction().subscribe(() => {
      this.dialogRef.close({ openVisitPlan: true });
    });
  }
}
