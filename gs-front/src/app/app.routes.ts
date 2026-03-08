import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'home', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
  { path: 'browse', loadComponent: () => import('./components/browse/browse.component').then(m => m.BrowseComponent) },
  { path: 'map', loadComponent: () => import('./components/map/map.component').then(m => m.MapComponent), canActivate: [AuthGuard] },
  { path: 'profile', loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent), canActivate: [AuthGuard] },
  { path: 'my-sales', loadComponent: () => import('./components/my-sales/my-sales.component').then(m => m.MySalesComponent), canActivate: [AuthGuard] },
  { path: 'create-sale', loadComponent: () => import('./components/create-sale/create-sale.component').then(m => m.CreateSaleComponent), canActivate: [AuthGuard] },
  { path: 'appointments', loadComponent: () => import('./components/appointments/appointments.component').then(m => m.AppointmentsComponent), canActivate: [AuthGuard] },
  { path: 'sale/:id', loadComponent: () => import('./components/sale-detail/sale-detail.component').then(m => m.SaleDetailComponent), canActivate: [AuthGuard] },
  { path: 'sale/:id/book', loadComponent: () => import('./components/book-appointment/book-appointment.component').then(m => m.BookAppointmentComponent), canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/home' }
];
