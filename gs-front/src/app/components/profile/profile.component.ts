import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';
import { ProfileService, ProfileDto } from '../../services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule, MatIconModule, MatDividerModule, RouterLink],
  template: `
    <div class="profile-page">
      <mat-card class="profile-card">
        <div class="profile-header">
          <div class="avatar">{{ (username || 'U') | slice:0:1 | uppercase }}</div>
          <div class="header-text">
            <h2>{{ username || 'User' }}</h2>
            <p>{{ email }}</p>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div *ngIf="isLoading" class="loading-row">
          <mat-spinner diameter="28"></mat-spinner>
          <span>Loading your profile...</span>
        </div>

        <div *ngIf="errorMessage && !isLoading" class="error-row">
          <mat-icon color="warn">error</mat-icon>
          <span>{{errorMessage}}</span>
          <a *ngIf="showLoginCta" mat-raised-button color="primary" routerLink="/login">Login</a>
        </div>

        <form [formGroup]="form" (ngSubmit)="save()" class="profile-form" *ngIf="!isLoading">
          <h3 class="section-title"><mat-icon>account_circle</mat-icon> Account Info</h3>
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" [disabled]="true">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" [disabled]="true">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="firstName">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="lastName">
            </mat-form-field>
          </div>

          <h3 class="section-title"><mat-icon>call</mat-icon> Contact & Bio</h3>
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Phone</mat-label>
              <input matInput formControlName="phoneNumber" placeholder="e.g. +1 555 123 4567">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Bio</mat-label>
              <textarea matInput rows="3" formControlName="bio" placeholder="Tell others about yourself"></textarea>
            </mat-form-field>
          </div>

          <div class="actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
              <mat-icon *ngIf="!saving">save</mat-icon>
              <span>{{ saving ? 'Saving...' : 'Save Changes' }}</span>
            </button>
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-page { max-width: 920px; margin: 0 auto; padding: var(--spacing-lg); }
    .profile-card { border: 1px solid var(--border-color); border-radius: var(--border-radius-xl); box-shadow: var(--shadow-sm); }
    .profile-header { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-lg); }
    .avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--primary-color); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; box-shadow: var(--shadow-sm); }
    .header-text h2 { margin: 0; font-size: 1.35rem; color: var(--text-primary); }
    .header-text p { margin: 4px 0 0 0; color: var(--text-secondary); font-size: 0.95rem; }

    .loading-row, .error-row { display: flex; align-items: center; gap: 12px; padding: var(--spacing-md) var(--spacing-lg); }
    .error-row mat-icon { color: #f44336; }

    .profile-form { padding: var(--spacing-lg); }
    .section-title { display: flex; align-items: center; gap: 8px; margin: 0 0 var(--spacing-md) 0; color: var(--text-primary); font-weight: 600; }
    .section-title mat-icon { color: var(--primary-color); }
    .profile-form .grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: var(--spacing-md); }
    .profile-form .grid > mat-form-field { grid-column: span 6; }
    .profile-form .grid > mat-form-field.full { grid-column: 1 / -1; }
    @media (max-width: 768px) { .profile-form .grid > mat-form-field { grid-column: 1 / -1; } }
    .actions { margin-top: var(--spacing-md); display: flex; justify-content: flex-end; }
    .actions button { display: inline-flex; align-items: center; gap: 8px; }
  `]
})
export class ProfileComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  isLoading = true;
  errorMessage = '';
  showLoginCta = false;

  get username(): string {
    const v = this.form?.get('username')?.value;
    return v != null ? String(v) : '';
  }

  get email(): string {
    const v = this.form?.get('email')?.value;
    return v != null ? String(v) : '';
  }

  constructor(private fb: FormBuilder, private auth: AuthService, private profile: ProfileService, private snack: MatSnackBar, private router: Router) {}

  ngOnInit() {
    this.form = this.fb.group({
      username: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      firstName: [''],
      lastName: [''],
      phoneNumber: [''],
      bio: ['']
    });
    if (!this.auth.isAuthenticated()) {
      this.isLoading = false;
      this.errorMessage = 'Please login to view your profile.';
      this.showLoginCta = true;
      return;
    }

    this.profile.getMyProfile().subscribe({
      next: (p: ProfileDto) => {
        this.isLoading = false;
        this.form.patchValue({
          username: p.username || '',
          email: p.email || '',
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          phoneNumber: p.phoneNumber || '',
          bio: p.bio || ''
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.message || 'Failed to load profile.';
        this.showLoginCta = err?.message?.toLowerCase().includes('401') || !this.auth.isAuthenticated();
      }
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const dto: ProfileDto = {
      firstName: this.form.get('firstName')?.value || undefined,
      lastName: this.form.get('lastName')?.value || undefined,
      phoneNumber: this.form.get('phoneNumber')?.value || undefined,
      bio: this.form.get('bio')?.value || undefined
    };
    this.profile.updateMyProfile(dto).subscribe({
      next: (updated) => {
        this.saving = false;
        this.snack.open('Profile updated', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
      },
      error: (err) => {
        this.saving = false;
        this.snack.open(err?.message || 'Failed to update profile', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
      }
    });
  }
}
