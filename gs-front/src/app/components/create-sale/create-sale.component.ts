import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-create-sale',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatSnackBarModule, MatIconModule, MatDividerModule],
  template: `
    <div class="create-sale-wrapper">
      <mat-card class="create-sale-card">
        <mat-card-header>
          <div class="header-content">
            <div class="header-icon"><mat-icon>storefront</mat-icon></div>
            <div class="header-text">
              <mat-card-title>Create a Garage Sale</mat-card-title>
              <mat-card-subtitle>Set open hours and location visibility. Exact address stays private.</mat-card-subtitle>
            </div>
          </div>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
            <div class="section">
              <h3 class="section-title"><mat-icon>info</mat-icon> Basics</h3>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Sale Name</mat-label>
                <input matInput formControlName="saleName" placeholder="e.g. Weekend Furniture Sale" />
                <mat-error *ngIf="form.get('saleName')?.hasError('required')">Sale name is required</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3" placeholder="Describe items, conditions, highlights..."></textarea>
                <mat-hint>Buyers will see this in the sale preview</mat-hint>
              </mat-form-field>
            </div>

            <mat-divider></mat-divider>

            <div class="section">
              <h3 class="section-title"><mat-icon>place</mat-icon> Location</h3>
              <div class="row">
                <mat-form-field appearance="outline" class="col">
                  <mat-label>City</mat-label>
                  <input matInput formControlName="city" placeholder="Your city" />
                  <mat-error *ngIf="form.get('city')?.hasError('required')">City is required</mat-error>
                </mat-form-field>
                <mat-form-field appearance="outline" class="col">
                  <mat-label>Area</mat-label>
                  <input matInput formControlName="area" placeholder="Neighborhood / Area" />
                  <mat-error *ngIf="form.get('area')?.hasError('required')">Area is required</mat-error>
                </mat-form-field>
              </div>
              <div class="subtle">Only area and city are shown to buyers. You can share exact address after confirming.</div>
            </div>

            <mat-divider></mat-divider>

            <div class="section">
              <h3 class="section-title"><mat-icon>schedule</mat-icon> Open Hours</h3>
              <div class="row">
                <mat-form-field appearance="outline" class="col">
                  <mat-label>Start Time</mat-label>
                  <input matInput placeholder="09:00" formControlName="startTime" />
                  <mat-hint>24h format HH:mm</mat-hint>
                </mat-form-field>
                <mat-form-field appearance="outline" class="col">
                  <mat-label>End Time</mat-label>
                  <input matInput placeholder="17:00" formControlName="endTime" />
                  <mat-hint>24h format HH:mm</mat-hint>
                </mat-form-field>
              </div>
              <div class="row">
                <mat-form-field appearance="outline" class="col">
                  <mat-label>Max visitors per slot</mat-label>
                  <input matInput type="number" min="1" max="10" formControlName="maxAppointmentsPerSlot" />
                  <mat-hint>Limit visitors per 1-hour slot</mat-hint>
                </mat-form-field>
              </div>
            </div>

            <div class="actions">
              <button mat-button type="button" (click)="cancel()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || isLoading">
                <mat-icon *ngIf="!isLoading">save</mat-icon>
                {{ isLoading ? 'Creating...' : 'Create Sale' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `
  ,
  styles: [`
    .create-sale-wrapper { max-width: 960px; margin: 0 auto; padding: var(--spacing-lg); }
    .create-sale-card { border: 1px solid var(--border-color); border-radius: var(--border-radius-xl); }
    .header-content { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .header-icon mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--primary-color); }
    .form-grid { display: grid; gap: var(--spacing-lg); }
    .section { display: grid; gap: var(--spacing-md); }
    .section-title { display: inline-flex; align-items: center; gap: 8px; margin: 0; color: var(--text-primary); font-weight: 600; }
    .section-title mat-icon { color: var(--primary-color); }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
    .col { width: 100%; }
    .full { width: 100%; }
    .subtle { color: var(--text-secondary); font-size: 0.9rem; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    @media (max-width: 768px) { .row { grid-template-columns: 1fr; } }
  `]
})
export class CreateSaleComponent {
  form: any;
  isLoading = false;

  constructor(private fb: FormBuilder, private sales: SalesService, private snack: MatSnackBar, private router: Router) {
    this.form = this.fb.group({
      saleName: ['', Validators.required],
      description: [''],
      city: ['', Validators.required],
      area: ['', Validators.required],
      startTime: ['09:00', Validators.required],
      endTime: ['17:00', Validators.required],
      maxAppointmentsPerSlot: [3]
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.isLoading = true;
    const payload = this.form.value;
    this.sales.createGarageSale(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.snack.open('Garage sale created', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
        this.router.navigate(['/my-sales']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Create sale failed', err);
        this.snack.open(err?.message || 'Failed to create sale', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
      }
    });
  }

  cancel() {
    this.router.navigate(['/my-sales']);
  }
}


