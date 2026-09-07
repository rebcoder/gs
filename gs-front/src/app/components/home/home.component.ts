import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { BookAppointmentDialogComponent } from '../book-appointment-dialog/book-appointment-dialog.component';
import { MarketplaceService } from '../../services/marketplace.service';
import { ProfileService } from '../../services/profile.service';
import { MarketplaceSale } from '../../models/marketplace.models';
import { SaleCardComponent } from '../ui/sale-card/sale-card.component';
import { EmptyStateComponent } from '../ui/empty-state/empty-state.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    SaleCardComponent,
    EmptyStateComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  featuredSales: MarketplaceSale[] = [];
  featuredLoading = true;
  weekendNearbyCount = 0;

  private preferredCity: string | null = null;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private marketplaceService: MarketplaceService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.loadFeaturedSales();
    this.loadWeekendNearbyBanner();
  }

  bookAppointment(sale: MarketplaceSale): void {
    const dialogRef = this.dialog.open(BookAppointmentDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        sale: sale.raw,
        saleId: sale.id
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.snackBar.open('Appointment booked successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  private loadFeaturedSales(): void {
    this.featuredLoading = true;
    this.marketplaceService.getFeaturedSales().subscribe({
      next: (sales) => {
        this.featuredSales = sales.slice(0, 6);
        this.featuredLoading = false;
      },
      error: () => {
        this.featuredSales = [];
        this.featuredLoading = false;
      }
    });
  }

  private loadWeekendNearbyBanner(): void {
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.preferredCity = profile?.preferredCity || null;
        if (profile?.preferredLatitude != null && profile?.preferredLongitude != null) {
          this.marketplaceService
            .getNearbySales(profile.preferredLatitude, profile.preferredLongitude, profile.searchRadiusKm || 20)
            .subscribe({
              next: (sales) => {
                this.weekendNearbyCount = this.countWeekendSales(sales);
              },
              error: () => {
                this.loadWeekendFallback();
              }
            });
          return;
        }
        this.loadWeekendFallback();
      },
      error: () => this.loadWeekendFallback()
    });
  }

  private loadWeekendFallback(): void {
    this.marketplaceService.getAllSales().subscribe({
      next: (sales) => {
        let source = sales;
        if (this.preferredCity) {
          source = source.filter((sale) =>
            (sale.city || '').toLowerCase().includes(this.preferredCity!.toLowerCase())
          );
        }
        this.weekendNearbyCount = this.countWeekendSales(source);
      },
      error: () => {
        this.weekendNearbyCount = 0;
      }
    });
  }

  private countWeekendSales(sales: MarketplaceSale[]): number {
    return sales.filter((sale) => sale.date && this.isThisWeekend(sale.date)).length;
  }

  private isThisWeekend(rawDate: string): boolean {
    const target = new Date(rawDate);
    if (Number.isNaN(target.getTime())) return false;
    target.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay(); // Sun=0, Sat=6

    const saturday = new Date(today);
    if (day === 6) {
      // today is Saturday
    } else if (day === 0) {
      saturday.setDate(saturday.getDate() - 1);
    } else {
      saturday.setDate(saturday.getDate() + (6 - day));
    }
    const sunday = new Date(saturday);
    sunday.setDate(sunday.getDate() + 1);

    return target.getTime() === saturday.getTime() || target.getTime() === sunday.getTime();
  }
}
