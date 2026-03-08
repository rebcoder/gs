import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AppointmentService } from '../../services/appointment.service';
import { SalesService } from '../../services/sales.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

export interface AppointmentDialogData {
  sale: any;
  saleId: number;
}

@Component({
  selector: 'app-book-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCheckboxModule
  ],
  template: `
    <div class="appointment-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon>schedule</mat-icon>
        Book Appointment
      </h2>

      <mat-dialog-content class="dialog-content">
        <!-- Sale Information -->
        <div class="sale-info" *ngIf="data.sale">
          <mat-icon class="sale-icon">store</mat-icon>
          <div class="sale-details">
            <h3>{{data.sale.saleName || data.sale.sale_name}}</h3>
            <p class="sale-location">
              <mat-icon>location_on</mat-icon>
              {{data.sale.area}}, {{data.sale.city}}
            </p>
            <p class="sale-description" *ngIf="data.sale.description">
              {{data.sale.description}}
            </p>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Appointment Form -->
        <form [formGroup]="appointmentForm" (ngSubmit)="submitAppointment()" class="appointment-form">
          <div class="form-section">
            <h4 class="section-title">
              <mat-icon>event_available</mat-icon>
              Choose Date & Time
            </h4>

            <div class="form-row">
              <mat-form-field appearance="outline" class="date-field">
                <mat-label>Preferred Date</mat-label>
                <input matInput
                       [matDatepicker]="datePicker"
                       formControlName="preferredDate"
                       placeholder="Select date"
                       [min]="minDate">
                <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
                <mat-datepicker #datePicker></mat-datepicker>
                <mat-error *ngIf="appointmentForm.get('preferredDate')?.hasError('required')">
                  Please select a date
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="time-field">
                <mat-label>Preferred Time</mat-label>
                <mat-select formControlName="preferredTime" placeholder="Select time">
                  <mat-option *ngFor="let slot of availableTimeSlots" [value]="slot.value">
                    {{slot.label}}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="appointmentForm.get('preferredTime')?.hasError('required')">
                  Please select a time
                </mat-error>
                <mat-hint *ngIf="slotsLeft !== null && !slotFull" class="slots-info">
                  <mat-icon>info</mat-icon>
                  {{slotsLeft}} slots left for this time
                </mat-hint>
                <mat-hint *ngIf="slotFull" class="slots-full">
                  <mat-icon>warning</mat-icon>
                  This time slot is full
                </mat-hint>
              </mat-form-field>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="form-section">
            <h4 class="section-title">
              <mat-icon>note</mat-icon>
              Additional Information
            </h4>

            <mat-form-field appearance="outline" class="notes-field">
              <mat-label>Message for Seller (Optional)</mat-label>
              <textarea matInput
                        formControlName="notes"
                        rows="3"
                        placeholder="Let the seller know what items you're interested in, or any special requests..."></textarea>
              <mat-hint>Help the seller prepare for your visit</mat-hint>
            </mat-form-field>
          </div>

          <!-- Items Selection (if sale has items) -->
          <div class="form-section" *ngIf="data.sale?.items?.length > 0">
            <h4 class="section-title">
              <mat-icon>shopping_cart</mat-icon>
              Interested Items (Optional)
            </h4>
            <p class="section-subtitle">Select specific items you're interested in:</p>

            <div class="items-grid">
              <mat-checkbox *ngFor="let item of data.sale.items"
                           [formControl]="getItemControl(item.id)"
                           class="item-checkbox">
                <div class="item-info">
                  <span class="item-name">{{item.name}}</span>
                  <span class="item-price">\${{item.price}}</span>
                </div>
              </mat-checkbox>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button
                type="button"
                (click)="closeDialog()"
                [disabled]="isSubmitting">
          <mat-icon>close</mat-icon>
          Cancel
        </button>

        <button mat-raised-button
                color="primary"
                type="submit"
                (click)="submitAppointment()"
                [disabled]="appointmentForm.invalid || isSubmitting || slotFull">
          <mat-icon *ngIf="!isSubmitting">schedule</mat-icon>
          <mat-spinner *ngIf="isSubmitting" diameter="20"></mat-spinner>
          {{ isSubmitting ? 'Booking...' : 'Book Appointment' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .appointment-dialog {
      max-width: 600px;
      width: 100%;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 24px 24px 0;

      mat-icon {
        color: #1976d2;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
      }
    }

    .dialog-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .sale-info {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
      border-radius: 12px;
      border: 1px solid #e1f5fe;
      margin-bottom: 16px;

      .sale-icon {
        color: #1976d2;
        font-size: 32px;
        width: 32px;
        height: 32px;
        margin-top: 4px;
        flex-shrink: 0;
      }

      .sale-details {
        flex: 1;

        h3 {
          margin: 0 0 8px 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1565c0;
        }

        .sale-location {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 0 8px 0;
          font-size: 0.9rem;
          color: #666;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }

        .sale-description {
          margin: 0;
          font-size: 0.9rem;
          color: #555;
          line-height: 1.4;
        }
      }
    }

    .appointment-form {
      .form-section {
        margin-bottom: 24px;

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
            color: #1976d2;
          }
        }

        .section-subtitle {
          margin: 0 0 12px 0;
          font-size: 0.9rem;
          color: #666;
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
          gap: 12px;
        }
      }

      .date-field, .time-field {
        width: 100%;
      }

      .notes-field {
        width: 100%;
      }

      .slots-info {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #2e7d32;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .slots-full {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #d32f2f;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-top: 12px;

      .item-checkbox {
        ::ng-deep .mat-mdc-checkbox {
          .mdc-form-field {
            align-items: flex-start;
          }
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .item-name {
            font-weight: 500;
            color: #333;
          }

          .item-price {
            font-size: 0.9rem;
            color: #1976d2;
            font-weight: 600;
          }
        }
      }
    }

    .dialog-actions {
      padding: 16px 24px 24px;
      display: flex;
      justify-content: space-between;
      gap: 12px;

      button {
        min-width: 120px;

        mat-icon {
          margin-right: 8px;
        }
      }
    }

    mat-divider {
      margin: 24px 0;
    }

    // Responsive design
    @media (max-width: 600px) {
      .dialog-title {
        padding: 16px 16px 0;

        h2 {
          font-size: 1.25rem;
        }
      }

      .dialog-content {
        padding: 16px;
      }

      .dialog-actions {
        padding: 16px;
        flex-direction: column;

        button {
          width: 100%;
          min-width: unset;
        }
      }
    }
  `]
})
export class BookAppointmentDialogComponent implements OnInit {
  appointmentForm: any;
  isSubmitting = false;
  slotFull = false;
  slotsLeft: number | null = null;
  minDate = new Date();

  availableTimeSlots: { value: string, label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BookAppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppointmentDialogData,
    private appointmentService: AppointmentService,
    private salesService: SalesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeForm();

    // Watch for date/time changes to check slot availability
    this.appointmentForm.get('preferredDate').valueChanges.subscribe(() => {
      this.checkSlotAvailability();
    });

    this.appointmentForm.get('preferredTime').valueChanges.subscribe(() => {
      this.checkSlotAvailability();
    });

    // Generate time slots based on sale open hours if available
    this.generateSlotsFromSale();
  }

  private initializeForm() {
    this.appointmentForm = this.fb.group({
      preferredDate: ['', Validators.required],
      preferredTime: ['', Validators.required],
      notes: ['']
    });

    // Add form controls for each item if they exist
    if (this.data.sale?.items?.length > 0) {
      const itemsGroup: any = {};
      this.data.sale.items.forEach((item: any) => {
        itemsGroup[`item_${item.id}`] = [false];
      });
      this.appointmentForm.addControl('interestedItems', this.fb.group(itemsGroup));
    }
  }

  getItemControl(itemId: number) {
    return this.appointmentForm.get(`interestedItems.item_${itemId}`);
  }

  private checkSlotAvailability() {
    const date = this.appointmentForm.get('preferredDate')?.value;
    const time = this.appointmentForm.get('preferredTime')?.value;

    if (!date || !time || !this.data.saleId) {
      this.slotFull = false;
      this.slotsLeft = null;
      return;
    }

    const dateIso = new Date(date).toISOString().split('T')[0];

    this.appointmentService.getSlotCount(this.data.saleId, time, dateIso).subscribe({
      next: (count: any) => {
        const num = typeof count === 'number' ? count : (count && count.count) ? count.count : 0;
        const max = this.data.sale?.maxAppointmentsPerSlot || 3;
        this.slotsLeft = Math.max(0, max - num);
        this.slotFull = num >= max;
      },
      error: (err) => {
        console.warn('Failed to check slot availability', err);
        this.slotFull = false;
        this.slotsLeft = null;
      }
    });
  }

  private generateSlotsFromSale() {
    const start = this.data.sale?.startTime || '09:00';
    const end = this.data.sale?.endTime || '17:00';
    const parse = (t: string) => {
      const [h, m] = t.split(':').map((x: string) => parseInt(x, 10));
      return h * 60 + (m || 0);
    };
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    const toLabel = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hr12 = h % 12 === 0 ? 12 : h % 12;
      return `${hr12}:${pad(m)} ${ampm}`;
    };
    const s = parse(start);
    const e = parse(end);
    const slots: { value: string, label: string }[] = [];
    for (let t = s; t < e; t += 60) {
      const h = Math.floor(t / 60);
      const m = t % 60;
      const value = `${pad(h)}:${pad(m)}`;
      slots.push({ value, label: toLabel(t) });
    }
    this.availableTimeSlots = slots;
  }

  submitAppointment() {
    if (this.appointmentForm.valid && !this.slotFull) {
      this.isSubmitting = true;

      const formValue = this.appointmentForm.value;
      const appointmentTime = new Date(formValue.preferredDate);
      const [hours, minutes] = formValue.preferredTime.split(':');
      appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Collect interested item IDs
      const interestedItemIds: number[] = [];
      if (formValue.interestedItems) {
        Object.keys(formValue.interestedItems).forEach(key => {
          if (formValue.interestedItems[key] && key.startsWith('item_')) {
            const itemId = parseInt(key.replace('item_', ''));
            interestedItemIds.push(itemId);
          }
        });
      }

      const appointmentData = {
        saleId: this.data.saleId,
        appointmentTime: appointmentTime.toISOString(),
        timeSlot: formValue.preferredTime,
        notes: formValue.notes || '',
        sellerId: this.data.sale.sellerId || this.data.sale.seller?.id,
        homeId: this.data.sale.homeId || this.data.sale.home?.id,
        interestedItemIds: interestedItemIds
      };

      this.appointmentService.createAppointment(appointmentData).subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          this.snackBar.open('Appointment booked successfully! Check your appointments page for updates.', 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(true);
          this.router.navigate(['/appointments']);
        },
        error: (error: any) => {
          this.isSubmitting = false;
          this.snackBar.open(
            error.message || 'Failed to book appointment. Please try again.',
            'Close',
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
        }
      });
    } else if (this.slotFull) {
      this.snackBar.open('Selected time slot is full. Please choose another time.', 'Close', {
        duration: 4000,
        panelClass: ['warning-snackbar']
      });
    } else {
      this.snackBar.open('Please fill in all required fields correctly.', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  closeDialog() {
    this.dialogRef.close(false);
  }
}
