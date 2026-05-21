import {
  Component,
  DestroyRef,
  inject,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { catchError, debounceTime, of, Subject } from 'rxjs';
import { InsuranceSelectionService } from '../../../core/insurance-selection.service';
import { PersonStateService } from '../../../core/person-state.service';
import { FastIdPerson, FastIdService } from '../../../services/fastid.service';
import {
  InsuranceDetailPanel,
  InsuranceProductCard,
} from '../../models/insurance-catalog';
import {
  formatRub,
  ILLNESS_SUM_OPTIONS,
  JOB_LOSS_AMOUNTS,
  CUSTOM_NS_SUM_OPTIONS,
  NS_PERIOD_MONTH_OPTIONS,
  NsPackageOption,
} from '../../models/ns-catalog-options';

interface PackagePremiumState {
  loading: boolean;
  premium: number | null;
  error?: string;
}

@Component({
  selector: 'app-insurance-catalog',
  standalone: true,
  imports: [
    MatCardModule,
    MatRadioModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './insurance-catalog.component.html',
  styleUrl: './insurance-catalog.component.scss',
})
export class InsuranceCatalogComponent implements OnInit, OnChanges {
  private selection = inject(InsuranceSelectionService);
  private personState = inject(PersonStateService);
  private fastId = inject(FastIdService);
  private destroyRef = inject(DestroyRef);

  @Input() selectable = true;
  @Input() detailPanel: InsuranceDetailPanel | null = null;
  @Input() person: FastIdPerson | null = null;

  readonly products: InsuranceProductCard[] = this.selection.productsList;
  readonly nsPackages: NsPackageOption[] = this.selection.nsPackages;
  readonly illnessSumOptions = ILLNESS_SUM_OPTIONS;
  readonly jobLossOptions = JOB_LOSS_AMOUNTS;
  readonly customNsSumOptions = CUSTOM_NS_SUM_OPTIONS;
  readonly periodMonthOptions = NS_PERIOD_MONTH_OPTIONS;
  readonly formatRub = formatRub;

  readonly packagePremiums = signal<Record<string, PackagePremiumState>>({});

  private refreshPremiums$ = new Subject<void>();
  private premiumGeneration = 0;
  private lastPersonKey: string | null = null;

  ngOnInit(): void {
    this.refreshPremiums$
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshAllPremiums());

    this.selection
      .nsStateChanges()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.schedulePremiumRefresh();
        this.syncSelectedPremiumToService();
      });

    this.selection
      .selectedIdChanges()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.schedulePremiumRefresh();
        this.syncSelectedPremiumToService();
      });

    this.schedulePremiumRefresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['person']) {
      const key = this.personKey(this.person);
      if (key !== this.lastPersonKey) {
        this.lastPersonKey = key;
        this.schedulePremiumRefresh();
      }
    }
  }

  get selectedId(): string {
    return this.selection.selectedId;
  }

  get nsState() {
    return this.selection.nsState;
  }

  get showNsCart(): boolean {
    return this.selection.resolveDetailPanel(this.detailPanel) === 'ns';
  }

  onSelect(id: string): void {
    if (this.selectable) {
      this.selection.select(id);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedId === id;
  }

  onPackageSelect(packageId: string): void {
    this.selection.selectNsPackage(packageId);
    this.syncSelectedPremiumToService();
  }

  isPackageSelected(packageId: string): boolean {
    return this.selection.isNsPackageSelected(packageId);
  }

  onCustomSumChange(value: number): void {
    this.selection.setCustomSumInsured(value);
    this.schedulePremiumRefresh();
  }

  onPeriodStartChange(value: string): void {
    this.selection.setPeriodStartDate(value);
  }

  onPeriodMonthsChange(value: number): void {
    this.selection.setPeriodMonths(value);
  }

  periodMonthsLabel(months: number): string {
    return `${months} мес.`;
  }

  onIllnessEnabledChange(checked: boolean): void {
    this.selection.setIllnessEnabled(checked);
  }

  onIllnessSumChange(value: number): void {
    this.selection.setIllnessSumInsured(value);
  }

  onJobLossEnabledChange(checked: boolean): void {
    this.selection.setJobLossEnabled(checked);
  }

  onJobLossChange(value: number): void {
    this.selection.setJobLossCompensation(value);
  }

  formatPremium(packageId: string): string {
    const state = this.packagePremiums()[packageId];
    if (!state) {
      return this.resolvePerson() ? '…' : '—';
    }
    if (state.loading) {
      return '…';
    }
    if (state.premium != null) {
      return formatRub(state.premium);
    }
    return state.error || '—';
  }

  private schedulePremiumRefresh(): void {
    this.refreshPremiums$.next();
  }

  private personKey(person: FastIdPerson | null): string {
    if (!person) {
      return '';
    }
    return JSON.stringify(person);
  }

  private refreshAllPremiums(): void {
    if (!this.showNsCart) {
      this.packagePremiums.set({});
      this.syncSelectedPremiumToService();
      return;
    }
    const person = this.resolvePerson();
    if (!person) {
      this.packagePremiums.set({});
      this.syncSelectedPremiumToService();
      return;
    }
    const generation = ++this.premiumGeneration;
    for (const pkg of this.nsPackages) {
      this.loadPackagePremium(pkg, person, generation);
    }
    this.syncSelectedPremiumToService();
  }

  private resolvePerson(): FastIdPerson | null {
    return this.person ?? this.personState.getPerson();
  }

  private loadPackagePremium(
    pkg: NsPackageOption,
    person: FastIdPerson,
    generation: number,
  ): void {
    const productCode = pkg.productCode ?? 'NS_CLASSIC';
    this.packagePremiums.update((map) => ({
      ...map,
      [pkg.id]: { loading: true, premium: null },
    }));
    if (this.selection.nsState.selectedPackageId === pkg.id) {
      this.syncSelectedPremiumToService();
    }
    this.fastId
      .calculatePremium({
        ...person,
        productCode,
        packageCode: pkg.packageCode ?? '0',
      })
      .pipe(
        catchError((err) =>
          of({
            productCode,
            errorMessage: err?.error?.message || 'Ошибка расчёта',
          }),
        ),
      )
      .subscribe((res) => {
        if (generation !== this.premiumGeneration) {
          return;
        }
        this.packagePremiums.update((map) => ({
          ...map,
          [pkg.id]:
            'premium' in res && res.premium != null
              ? { loading: false, premium: Number(res.premium) }
              : {
                  loading: false,
                  premium: null,
                  error: ('errorMessage' in res && res.errorMessage) || '—',
                },
        }));
        this.syncSelectedPremiumToService();
      });
  }

  private syncSelectedPremiumToService(): void {
    if (!this.showNsCart) {
      this.selection.setSelectedPremium(false, null);
      return;
    }
    const packageId = this.selection.nsState.selectedPackageId;
    const state = this.packagePremiums()[packageId];
    if (!state) {
      this.selection.setSelectedPremium(!!this.resolvePerson(), null);
      return;
    }
    this.selection.setSelectedPremium(state.loading, state.premium, state.error);
  }
}
