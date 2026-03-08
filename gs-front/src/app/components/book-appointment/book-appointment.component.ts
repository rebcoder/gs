import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppointmentService } from '../../services/appointment.service';
import { SalesService } from '../../services/sales.service';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="book-appointment-container">
      <div *ngIf="isSaleLoading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading sale details...</p>
      </div>

      <mat-card *ngIf="!isSaleLoading && sale" class="appointment-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>schedule</mat-icon>
            Book Appointment
          </mat-card-title>
          <mat-card-subtitle>Schedule a visit to {{sale.saleName}}</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="appointment-form">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Preferred Date</mat-label>
                <input matInput [matDatepicker]="datePicker" formControlName="preferredDate" placeholder="Choose a date">
                <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
                <mat-datepicker #datePicker></mat-datepicker>
                <mat-error *ngIf="form.get('preferredDate')?.hasError('required')">
                  Please select a preferred date
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Preferred Time</mat-label>
                <mat-select formControlName="preferredTime" placeholder="Choose a time">
                  <mat-option value="09:00">9:00 AM</mat-option>
                  <mat-option value="10:00">10:00 AM</mat-option>
                  <mat-option value="11:00">11:00 AM</mat-option>
                  <mat-option value="12:00">12:00 PM</mat-option>
                  <mat-option value="13:00">1:00 PM</mat-option>
                  <mat-option value="14:00">2:00 PM</mat-option>
                  <mat-option value="15:00">3:00 PM</mat-option>
                  <mat-option value="16:00">4:00 PM</mat-option>
                  <mat-option value="17:00">5:00 PM</mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('preferredTime')?.hasError('required')">
                  Please select a preferred time
                </mat-error>
                <mat-hint *ngIf="slotsLeft !== null && !slotFull">Slots left: {{slotsLeft}}</mat-hint>
                <mat-hint color="warn" *ngIf="slotFull">Selected time slot is full</mat-hint>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Notes for Seller</mat-label>
              <textarea matInput formControlName="notes" rows="3" 
                        placeholder="Any specific items you're interested in or special requests..."></textarea>
              <mat-hint>Optional: Let the seller know what you're looking for</mat-hint>
            </mat-form-field>

            <div class="form-actions">
              <button mat-button type="button" (click)="goBack()" [disabled]="isLoading">
                <mat-icon>arrow_back</mat-icon>
                Cancel
              </button>
              <button mat-raised-button color="primary" type="submit" [disabled]="isLoading || !form.valid">
                <mat-icon *ngIf="!isLoading">schedule</mat-icon>
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                {{ isLoading ? 'Booking...' : 'Book Appointment' }}
              </button>
            </div>

            <div class="disclaimer" style="margin-top: 12px; font-size: 12px; color: rgba(0,0,0,0.6)">
              <mat-icon style="font-size: 14px; vertical-align: middle;">info</mat-icon>
              Disclaimer: Maximum 3 visitors per time slot. Verify the item matches the listing at the appointment. Exact address and contact details are exchanged directly between buyer and seller.
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class BookAppointmentComponent implements OnInit {
  form: any;
  saleId: number | null = null;
  sale: any = null;
  isLoading = false;
  isSaleLoading = false;
  slotFull = false;
  slotsLeft: number | null = null;

  constructor(
    private fb: FormBuilder, 
    private route: ActivatedRoute, 
    private appointmentService: AppointmentService,
    private salesService: SalesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.saleId = Number(this.route.snapshot.paramMap.get('id'));
    this.form = this.fb.group({
      preferredDate: ['', Validators.required],
      preferredTime: ['', Validators.required],
      notes: ['']
    });
    // watch changes to date/time to check slot availability
    this.form.get('preferredDate').valueChanges.subscribe(() => this.checkSlotAvailability());
    this.form.get('preferredTime').valueChanges.subscribe(() => this.checkSlotAvailability());
    
    if (this.saleId) {
      this.loadSaleData();
    }
  }

  loadSaleData() {
    this.isSaleLoading = true;
    this.salesService.getGarageSaleById(this.saleId!).subscribe({
      next: (sale: any) => {
        this.sale = sale;
        this.isSaleLoading = false;
      },
      error: (error: any) => {
        this.snackBar.open('Failed to load sale details. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isSaleLoading = false;
        this.router.navigate(['/browse']);
      }
    });
  }

  submit() {
    if (this.form.valid && this.saleId) {
      this.isLoading = true;
      
      const { preferredDate, preferredTime, notes } = this.form.value;
      const appointmentTime = new Date(preferredDate);
      const [hours, minutes] = preferredTime.split(':');
      appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Get current user ID from auth service
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser || !this.sale) {
        this.snackBar.open('Unable to get user or sale information. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
        return;
      }

      const appointmentData = {
        saleId: this.saleId,
        appointmentTime: appointmentTime.toISOString(),
        timeSlot: preferredTime,
        notes: notes || '',
        sellerId: this.sale.sellerId || this.sale.seller?.id,
        homeId: this.sale.homeId || this.sale.home?.id
      };

      if (this.slotFull) {
        this.isLoading = false;
        this.snackBar.open('Selected time slot is full. Please choose another time.', 'Close', { duration: 4000, panelClass: ['warning-snackbar'] });
        return;
      }

      this.appointmentService.createAppointment(appointmentData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.snackBar.open('Appointment booked successfully! The seller will contact you soon.', 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/appointments']);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.snackBar.open(
            error.message || 'Failed to book appointment. Please try again.', 
            'Close', 
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
        }
      });
    } else {
      this.snackBar.open('Please fill in all required fields correctly.', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  private checkSlotAvailability() {
    const date = this.form.get('preferredDate')?.value;
    const time = this.form.get('preferredTime')?.value;
    if (!date || !time || !this.saleId) {
      this.slotFull = false;
      return;
    }

    const dateIso = new Date(date).toISOString().split('T')[0];
    this.appointmentService.getSlotCount(this.saleId, time, dateIso).subscribe({ next: (count: any) => {
      // If backend returns object, handle gracefully
      const num = typeof count === 'number' ? count : (count && count.count) ? count.count : 0;
      this.slotsLeft = Math.max(0, 3 - num);
      this.slotFull = num >= 3;
    }, error: (err) => {
      // On error, allow booking but warn
      console.warn('Failed to check slot availability', err);
      this.slotFull = false;
      this.slotsLeft = null;
    }});
  }

  goBack() {
    this.router.navigate(['/sale', this.saleId]);
  }
}
