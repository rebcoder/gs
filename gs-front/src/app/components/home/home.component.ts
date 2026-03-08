import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { BookAppointmentDialogComponent } from '../book-appointment-dialog/book-appointment-dialog.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  featuredSales = [
    {
      id: 1,
      saleName: "Weekend Furniture Sale",
      title: "Weekend Furniture Sale",
      area: "Downtown Area",
      city: "DemoCity",
      latitude: 12.34,
      longitude: 56.78,
      description: "Quality furniture at great prices",
      category: "Furniture",
      location: "Downtown Area, DemoCity",
      date: "2024-12-28",
      time: "9:00 AM - 5:00 PM",
      items: [
        { id: 1, name: "Vintage Lamp", price: 25.00, category: "HOME_DECOR" },
        { id: 2, name: "Wooden Chair", price: 40.00, category: "FURNITURE" }
      ]
    },
    {
      id: 2,
      saleName: "Electronics & Gadgets",
      title: "Electronics & Gadgets",
      area: "Westside Neighborhood",
      city: "DemoCity",
      latitude: 12.35,
      longitude: 56.79,
      description: "Latest electronics and gadgets",
      category: "Electronics",
      location: "Westside Neighborhood, DemoCity",
      date: "2024-12-29",
      time: "10:00 AM - 4:00 PM",
      items: [
        { id: 3, name: "Wireless Headphones", price: 75.00, category: "ELECTRONICS" },
        { id: 4, name: "Smart Watch", price: 150.00, category: "ELECTRONICS" }
      ]
    },
    {
      id: 3,
      saleName: "Vintage Collectibles",
      title: "Vintage Collectibles",
      area: "Historic District",
      city: "DemoCity",
      latitude: 12.36,
      longitude: 56.80,
      description: "Rare vintage collectibles",
      category: "Collectibles",
      location: "Historic District, DemoCity",
      date: "2024-12-28",
      time: "11:00 AM - 6:00 PM",
      items: [
        { id: 5, name: "Antique Clock", price: 120.00, category: "ANTIQUES" },
        { id: 6, name: "Vintage Camera", price: 200.00, category: "COLLECTIBLES" }
      ]
    }
  ];

  categories = [
    { name: 'Furniture', icon: 'chair', count: 45 },
    { name: 'Electronics', icon: 'devices', count: 32 },
    { name: 'Clothing', icon: 'checkroom', count: 67 },
    { name: 'Books', icon: 'book', count: 23 },
    { name: 'Toys', icon: 'toys', count: 18 },
    { name: 'Sports', icon: 'sports_soccer', count: 29 }
  ];

  bookAppointment(sale: any) {
    const dialogRef = this.dialog.open(BookAppointmentDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        sale: sale,
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
}
