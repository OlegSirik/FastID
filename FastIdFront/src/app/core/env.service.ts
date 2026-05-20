import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EnvService {
  private env(): Record<string, string | undefined> {
    return (globalThis as { __env?: Record<string, string> }).__env ?? {};
  }

  get TENANT_CODE(): string {
    return this.env()['TENANT_CODE'] || 'demo';
  }
}
