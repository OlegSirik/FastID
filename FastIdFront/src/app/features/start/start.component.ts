import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { PersonStateService } from '../../core/person-state.service';
import { FastIdPerson, FastIdService } from '../../services/fastid.service';
import { InsuranceCatalogComponent } from '../../shared/components/insurance-catalog/insurance-catalog.component';
import {
  InsuranceSelectionService,
  PolicySummary,
} from '../../core/insurance-selection.service';
import { formatRub } from '../../shared/models/ns-catalog-options';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    InsuranceCatalogComponent,
  ],
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss',
})
export class StartComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private fastId = inject(FastIdService);
  private personState = inject(PersonStateService);
  private auth = inject(AuthService);
  private selection = inject(InsuranceSelectionService);
  private destroy$ = new Subject<void>();

  policySummary: PolicySummary = this.selection.getPolicySummary();
  premiumLoading = false;
  premiumTotal: number | null = null;

  mode: 'scan' | 'operator' = 'operator';
  loading = false;
  error: string | null = null;
  resolvedPerson: FastIdPerson | null = null;

  qrImageDataUri: string | null = null;
  secureUrl: string | null = null;
  linkLoading = false;
  linkError: string | null = null;

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    middleName: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
    passportSeria: ['', Validators.required],
    passportNumber: ['', Validators.required],
  });

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) {
      this.mode = 'scan';
      this.loadFromQr(q);
    } else {
      this.form.valueChanges
        .pipe(
          debounceTime(400),
          distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
          takeUntil(this.destroy$),
        )
        .subscribe(() => {
          if (this.form.valid) {
            this.refreshSecureLink();
          } else {
            this.qrImageDataUri = null;
            this.secureUrl = null;
          }
        });
    }

    this.selection
      .selectedIdChanges()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshPolicySummary());

    this.selection
      .nsStateChanges()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshPolicySummary());

    this.selection
      .premiumChanges()
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.premiumLoading = state.loading;
        this.premiumTotal = state.premium;
      });

    const premium = this.selection.premiumState;
    this.premiumLoading = premium.loading;
    this.premiumTotal = premium.premium;
  }

  private refreshPolicySummary(): void {
    this.policySummary = this.selection.getPolicySummary();
  }

  buyButtonLabel(): string {
    if (this.premiumLoading) {
      return '…';
    }
    if (this.premiumTotal != null) {
      return formatRub(this.premiumTotal);
    }
    return '';
  }

  canBuy(): boolean {
    return this.canProceedToPolicy() && !this.premiumLoading && this.premiumTotal != null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private tenant(): string {
    return this.route.parent?.snapshot.paramMap.get('tenantId') ?? this.auth.tenant;
  }

  private loadFromQr(token: string): void {
    if (!this.auth.isReady()) {
      this.error = 'BFF-сессия не готова — дождитесь инициализации приложения';
      return;
    }
    this.loading = true;
    this.error = null;
    this.fastId.decrypt(token, this.tenant()).subscribe({
      next: (person) => {
        this.resolvedPerson = person;
        this.patchFormFromPerson(person);
        this.loading = false;
      },
      error: () => {
        this.error = 'Не удалось прочитать данные из QR';
        this.loading = false;
      },
    });
  }

  private patchFormFromPerson(person: FastIdPerson): void {
    this.form.patchValue({
      firstName: person.firstName,
      lastName: person.lastName,
      middleName: person.middleName,
      dateOfBirth: person.dateOfBirth,
      passportSeria: person.passportSeria,
      passportNumber: person.passportNumber,
    });
  }

  personForCatalog(): FastIdPerson | null {
    if (this.form.valid) {
      return this.getPersonFromForm();
    }
    return this.resolvedPerson;
  }

  canProceedToPolicy(): boolean {
    return this.form.valid || this.resolvedPerson != null;
  }

  private getPersonFromForm(): FastIdPerson {
    const v = this.form.getRawValue();
    return {
      firstName: v.firstName!.trim(),
      lastName: v.lastName!.trim(),
      middleName: v.middleName!.trim(),
      dateOfBirth: v.dateOfBirth!.trim(),
      passportSeria: v.passportSeria!.trim(),
      passportNumber: v.passportNumber!.trim(),
    };
  }

  private refreshSecureLink(): void {
    if (!this.auth.isReady()) {
      this.qrImageDataUri = null;
      this.secureUrl = null;
      this.linkError = 'BFF-сессия не готова — дождитесь инициализации';
      return;
    }
    this.linkLoading = true;
    this.linkError = null;
    this.fastId.createSecureLink(this.getPersonFromForm(), this.tenant()).subscribe({
      next: (res) => {
        this.qrImageDataUri = res.qrImageDataUri;
        this.secureUrl = res.url;
        this.linkLoading = false;
      },
      error: (err) => {
        this.linkLoading = false;
        const body = err?.error;
        this.linkError =
          (typeof body === 'object' && body?.error) ||
          body?.message ||
          (err?.status === 403 ? 'Доступ запрещён (403)' : null) ||
          'Не удалось сформировать QR';
      },
    });
  }

  goToPolicy(person?: FastIdPerson): void {
    const p = person ?? this.resolvedPerson ?? (this.form.valid ? this.getPersonFromForm() : null);
    if (!p) {
      return;
    }
    this.personState.setPerson(p);
    this.router.navigate(['/', this.tenant(), 'policy']);
  }

  useFormForPolicy(): void {
    if (this.form.valid) {
      this.goToPolicy(this.getPersonFromForm());
    }
  }
}
