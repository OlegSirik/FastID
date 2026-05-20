import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../core/auth.service';

export interface FastIdPerson {
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  passportSeria: string;
  passportNumber: string;
}

export interface FastIdSecureLinkRequest extends FastIdPerson {
  baseUrl: string;
}

export interface FastIdSecureLinkResponse {
  url: string;
  securedToken: string;
  qrImageDataUri: string;
}

export interface FastIdPremiumResponse {
  productCode: string;
  premium?: number;
  errorMessage?: string;
}

export interface FastIdPremiumRequest extends FastIdPerson {
  productCode: string;
  packageCode?: string;
}

export interface FastIdOfferConfig {
  title: string;
  productCode: string;
  packageCode: string;
}

export const FASTID_OFFERS: FastIdOfferConfig[] = [
  { title: 'NS classic', productCode: 'NS_CLASSIC', packageCode: '0' },
  { title: 'NS sport', productCode: 'NS_SPORT', packageCode: '0' },
];

@Injectable({ providedIn: 'root' })
export class FastIdService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private apiUrl(tenant?: string): string {
    const t = tenant || this.auth.tenant;
    return `/api/public/v1/${t}/fastid`;
  }

  buildFrontendBaseUrl(tenant?: string): string {
    const t = (tenant || this.auth.tenant).replace(/^\/+|\/+$/g, '');
    const origin = window.location.origin.replace(/\/+$/, '');
    return `${origin}/${t}`;
  }

  createSecureLink(person: FastIdPerson, tenant?: string): Observable<FastIdSecureLinkResponse> {
    const body: FastIdSecureLinkRequest = {
      ...person,
      baseUrl: this.buildFrontendBaseUrl(tenant),
    };
    return this.http.post<FastIdSecureLinkResponse>(`${this.apiUrl(tenant)}/secure-link`, body);
  }

  decrypt(securedData: string, tenant?: string): Observable<FastIdPerson> {
    return this.http.post<FastIdPerson>(`${this.apiUrl(tenant)}/decrypt`, { securedData });
  }

  calculatePremium(request: FastIdPremiumRequest, tenant?: string): Observable<FastIdPremiumResponse> {
    return this.http.post<FastIdPremiumResponse>(`${this.apiUrl(tenant)}/premium`, request);
  }
}
