import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { SalesService } from '../../services/sales.service';
import { ProfileService } from '../../services/profile.service';
import { BookAppointmentDialogComponent } from '../book-appointment-dialog/book-appointment-dialog.component';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-browse',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSliderModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatDialogModule,
    MatSnackBarModule,
    LoadingComponent
  ],
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.scss'
})
export class BrowseComponent implements OnInit {
  
  searchForm: FormGroup;
  garageSales: any[] = [];
  filteredSales: any[] = [];
  isLoading = false;
  categories = [
    'Furniture', 'Electronics', 'Clothing', 'Books', 'Toys', 
    'Sports Equipment', 'Home Decor', 'Kitchen Appliances', 
    'Garden Tools', 'Automotive', 'Musical Instruments', 
    'Collectibles', 'Antiques', 'Other'
  ];
  
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'date' | 'distance' | 'price' = 'date';
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private salesService: SalesService,
    private profileService: ProfileService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.searchForm = this.fb.group({
      location: [''],
      category: [''],
      date: [''],
      priceRange: [1000],
      radius: [10],
      onlyToday: [false],
      onlyWeekend: [false]
    });
  }
  
  ngOnInit() {
    // Get category from route params
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.searchForm.patchValue({ category: params['category'] });
      }
      if (params['location']) {
        this.searchForm.patchValue({ location: params['location'] });
      }
      if (params['q']) {
        // keyword search will be applied in applyFilters()
        (this as any)._keyword = params['q'];
      }
    });
    
    // Default location filter to user's preferred city if available
    this.profileService.getMyProfile().subscribe({ next: (profile) => {
      if (profile && profile.preferredCity) {
        this.searchForm.patchValue({ location: profile.preferredCity });
      }
      this.loadLiveData();
      this.applyFilters();
    }, error: () => {
      this.loadLiveData();
      this.applyFilters();
    }});
  }
  
  loadMockData() {
    this.garageSales = [
      {
        id: 1,
        title: "Weekend Furniture Sale",
        location: "Downtown Area",
        area: "Downtown",
        city: "New York",
        date: "2024-12-28",
        time: "9:00 AM - 5:00 PM",
        image: "assets/images/furniture-sale.jpg",
        items: 15,
        category: "Furniture",
        priceRange: "Low",
        distance: 2.5,
        description: "Large selection of furniture including sofas, tables, chairs, and more."
      },
      {
        id: 2,
        title: "Electronics & Gadgets",
        location: "Westside Neighborhood",
        area: "Westside",
        city: "New York",
        date: "2024-12-29",
        time: "10:00 AM - 4:00 PM",
        image: "assets/images/electronics-sale.jpg",
        items: 8,
        category: "Electronics",
        priceRange: "Medium",
        distance: 4.2,
        description: "Electronics, computers, phones, and various gadgets in good condition."
      },
      {
        id: 3,
        title: "Vintage Collectibles",
        location: "Historic District",
        area: "Historic",
        city: "New York",
        date: "2024-12-28",
        time: "11:00 AM - 6:00 PM",
        image: "assets/images/vintage-sale.jpg",
        items: 25,
        category: "Collectibles",
        priceRange: "High",
        distance: 1.8,
        description: "Rare vintage items, antiques, and collectibles from various eras."
      },
      {
        id: 4,
        title: "Kids Toys & Games",
        location: "Family Suburb",
        area: "Suburb",
        city: "New York",
        date: "2024-12-30",
        time: "9:00 AM - 3:00 PM",
        image: "assets/images/toys-sale.jpg",
        items: 30,
        category: "Toys",
        priceRange: "Low",
        distance: 6.1,
        description: "Great selection of toys, games, and children's items."
      },
      {
        id: 5,
        title: "Sports Equipment Sale",
        location: "Athletic Club Area",
        area: "Athletic",
        city: "New York",
        date: "2024-12-31",
        time: "8:00 AM - 2:00 PM",
        image: "assets/images/sports-sale.jpg",
        items: 12,
        category: "Sports Equipment",
        priceRange: "Medium",
        distance: 3.7,
        description: "Quality sports equipment including bikes, weights, and outdoor gear."
      }
    ];
  }

  loadLiveData() {
    this.isLoading = true;
    this.salesService.getGarageSales().subscribe({
      next: (data) => {
        this.isLoading = false;
        if (Array.isArray(data) && data.length) {
          // Map backend structure to frontend consumers
          this.garageSales = data.map(s => ({
            id: s.id,
            title: s.saleName || s.sale_name,
            location: (s.area || '') + ', ' + (s.city || ''),
            area: s.area,
            city: s.city,
            date: s.saleDate || s.sale_date,
            time: (s.startTime || s.start_time || '') + ' - ' + (s.endTime || s.end_time || ''),
            image: '',
            items: s.items ? s.items.length : 0,
            category: s.items && s.items.length ? s.items[0].category : 'Other',
            priceRange: 'Varies',
            distance: 0,
            description: s.description || ''
          }));
        } else {
          // Keep existing mock data as fallback
          this.garageSales = [];
        }
        this.applyFilters();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load live sales', err);
        this.loadMockData();
        this.applyFilters();
      }
    });
  }
  
  applyFilters() {
    let filtered = [...this.garageSales];
    const formValue = this.searchForm.value;
    const keyword = (this as any)._keyword ? (this as any)._keyword.toLowerCase() : '';
    
    if (formValue.location) {
      filtered = filtered.filter(sale => 
        sale.city.toLowerCase().includes(formValue.location.toLowerCase()) ||
        sale.area.toLowerCase().includes(formValue.location.toLowerCase())
      );
    }
    if (keyword) {
      filtered = filtered.filter(sale =>
        (sale.title || '').toLowerCase().includes(keyword) ||
        (sale.description || '').toLowerCase().includes(keyword) ||
        (sale.category || '').toLowerCase().includes(keyword)
      );
    }
    
    if (formValue.category) {
      filtered = filtered.filter(sale => sale.category === formValue.category);
    }
    
    if (formValue.date) {
      filtered = filtered.filter(sale => sale.date === formValue.date);
    }
    
    if (formValue.onlyToday) {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(sale => sale.date === today);
    }
    
    if (formValue.onlyWeekend) {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date);
        const day = saleDate.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      });
    }
    
    // Sort results
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'date':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'distance':
          return a.distance - b.distance;
        case 'price':
          const priceOrder: { [key: string]: number } = { 'Low': 1, 'Medium': 2, 'High': 3 };
          return priceOrder[a.priceRange] - priceOrder[b.priceRange];
        default:
          return 0;
      }
    });
    
    this.filteredSales = filtered;
  }
  
  clearFilters() {
    this.searchForm.reset({
      location: '',
      category: '',
      date: '',
      priceRange: 1000,
      radius: 10,
      onlyToday: false,
      onlyWeekend: false
    });
    this.applyFilters();
  }
  
  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }
  
  getPriceRangeColor(range: string): string {
    switch (range) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'accent';
      default: return 'primary';
    }
  }

  calculateDistance(lat: number, lng: number): string {
    // Mock distance calculation - in a real app, you'd use user's location
    const mockUserLat = 12.34;
    const mockUserLng = 56.78;
    const distance = Math.sqrt(Math.pow(lat - mockUserLat, 2) + Math.pow(lng - mockUserLng, 2)) * 10;
    return distance.toFixed(1);
  }

  bookAppointment(sale: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();

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
