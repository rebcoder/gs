import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SalesService } from '../../services/sales.service';
import { ProfileService } from '../../services/profile.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit {
  garageSales: any[] = [];
  center: { lat: number, lng: number } | null = null;
  city: string | null = null;

  constructor(private sales: SalesService, private profile: ProfileService) {}

  ngOnInit() {
    this.profile.getMyProfile().subscribe({ next: (p) => {
      this.city = p?.preferredCity || null;
      if (p?.preferredLatitude != null && p?.preferredLongitude != null) {
        this.center = { lat: p.preferredLatitude, lng: p.preferredLongitude };
      }
      this.loadSales();
    }, error: () => {
      this.loadSales();
    }});
  }

  private loadSales() {
    this.sales.getGarageSales().subscribe({ next: (data) => {
      if (Array.isArray(data)) {
        const mapped = data.map((s: any) => ({
          id: s.id,
          title: s.saleName || s.sale_name || s.title,
          location: (s.area || '') + (s.city ? ', ' + s.city : ''),
          coordinates: s.coordinates || ((s.latitude != null && s.longitude != null) ? { lat: s.latitude, lng: s.longitude } : undefined),
          city: s.city,
          date: s.saleDate || s.sale_date || '',
          time: (s.startTime || s.start_time || '') + (s.endTime || s.end_time ? ' - ' + (s.endTime || s.end_time) : '')
        }));
        this.garageSales = this.city ? mapped.filter((m: any) => (m.city || '').toLowerCase() === this.city!.toLowerCase()) : mapped;
        if (!this.center && this.garageSales.length && this.garageSales[0].coordinates) {
          this.center = this.garageSales[0].coordinates;
        }
      }
    }, error: (err) => {
      console.warn('Failed to load sales for map', err);
    }});
  }
}
