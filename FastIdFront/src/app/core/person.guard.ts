import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PersonStateService } from './person-state.service';
import { AuthService } from './auth.service';

export const personGuard: CanActivateFn = () => {
  const personState = inject(PersonStateService);
  const router = inject(Router);
  const auth = inject(AuthService);
  if (personState.hasPerson()) {
    return true;
  }
  return router.createUrlTree(['/', auth.tenant, 'start']);
};
