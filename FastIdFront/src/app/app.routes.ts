import { Routes } from '@angular/router';
import { StartComponent } from './features/start/start.component';
import { PolicyComponent } from './features/policy/policy.component';
import { personGuard } from './core/person.guard';
import { EnvService } from './core/env.service';

const defaultTenant = () => {
  const w = globalThis as { __env?: { TENANT_CODE?: string } };
  return w?.__env?.TENANT_CODE || 'demo';
};

export const routes: Routes = [
  {
    path: ':tenantId',
    children: [
      { path: '', redirectTo: 'start', pathMatch: 'full' },
      { path: 'start', component: StartComponent },
      { path: 'policy', component: PolicyComponent, canActivate: [personGuard] },
    ],
  },
  { path: '', redirectTo: `${defaultTenant()}/start`, pathMatch: 'full' },
  { path: '**', redirectTo: `${defaultTenant()}/start` },
];
