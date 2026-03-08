import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ProfileDto {
  id?: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  preferredCity?: string;
  preferredArea?: string;
  preferredLatitude?: number;
  preferredLongitude?: number;
  searchRadiusKm?: number;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  bio?: string;
  rating?: number;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly API = `${environment.apiBaseUrl}/api/profile`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getMyProfile(): Observable<ProfileDto> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<ProfileDto>(this.API, { headers });
  }

  updateMyProfile(dto: ProfileDto): Observable<ProfileDto> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.put<ProfileDto>(this.API, dto, { headers });
  }
}
