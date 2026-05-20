import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { EnvService } from './env.service';

/** Ответ GET /api/public/session */
export interface SessionResponse {
  ready: boolean;
  tenantCode?: string;
  accountId?: number;
  username?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private env = inject(EnvService);

  private readonly TENANT_KEY = 'fastid_tenant_code';

  tenant = this.env.TENANT_CODE;
  private accountId: number | null = null;
  private ready$ = new BehaviorSubject<boolean>(false);
  lastError: string | null = null;

  readonly isReady$ = this.ready$.asObservable();

  bootstrap(): Observable<SessionResponse | null> {
    this.lastError = null;
    const savedTenant = localStorage.getItem(this.TENANT_KEY);
    if (savedTenant) {
      this.tenant = savedTenant;
    }

    return this.http.get<SessionResponse>('/api/public/session').pipe(
      tap((session) => {
        if (session.ready) {
          if (session.tenantCode) {
            this.setTenant(session.tenantCode);
          }
          this.accountId = session.accountId ?? null;
          this.ready$.next(true);
          this.lastError = null;
        } else {
          this.ready$.next(false);
          this.lastError = session.message || 'BFF session is not ready';
        }
      }),
      catchError((err: HttpErrorResponse) => {
        this.lastError = this.extractErrorMessage(err);
        this.ready$.next(false);
        return of(null);
      }),
      map((session) => (session?.ready ? session : null)),
    );
  }

  isReady(): boolean {
    return this.ready$.value;
  }

  getAccountId(): number | null {
    return this.accountId;
  }

  private setTenant(code: string): void {
    this.tenant = code;
    localStorage.setItem(this.TENANT_KEY, code);
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error;
    if (body?.message) {
      return String(body.message);
    }
    if (body?.error) {
      return String(body.error);
    }
    if (typeof body === 'string') {
      return body;
    }
    if (err.status === 0) {
      return 'Нет связи с FastID API. Проверьте, что BFF запущен.';
    }
    return `HTTP ${err.status}: ${err.statusText || 'ошибка'}`;
  }
}
