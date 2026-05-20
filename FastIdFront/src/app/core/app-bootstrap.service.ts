import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AppBootstrapService {
  private auth = inject(AuthService);
  private bootstrapped = false;
  bootError: string | null = null;

  async initialize(): Promise<void> {
    if (this.bootstrapped) {
      return;
    }
    try {
      const session = await firstValueFrom(this.auth.bootstrap());
      if (!session) {
        this.bootError =
          this.auth.lastError ||
          'BFF-сессия недоступна. Проверьте SERVICE_USER_LOGIN / SERVICE_PASSWORD в FastIdAPI.';
      }
      this.bootstrapped = true;
    } catch (e: unknown) {
      this.bootError =
        e instanceof Error
          ? e.message
          : this.auth.lastError || 'Ошибка инициализации';
    }
  }
}
