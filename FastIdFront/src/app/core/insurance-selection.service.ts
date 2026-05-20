import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  INSURANCE_PRODUCTS,
  InsuranceDetailPanel,
  InsuranceProductCard,
} from '../shared/models/insurance-catalog';
import {
  addMonthsToIsoDate,
  CUSTOM_NS_SUM_OPTIONS,
  formatIsoDateRu,
  formatRub,
  NS_PACKAGES,
  todayIsoDate,
} from '../shared/models/ns-catalog-options';

export interface SelectedPremiumState {
  loading: boolean;
  premium: number | null;
  error?: string;
}

export interface PolicySummary {
  whatInsuring: string;
  periodLabel: string;
  sumInsuredLabel: string;
}

export interface NsCatalogState {
  selectedPackageId: string;
  customSumInsured: number;
  periodStartDate: string;
  periodEndDate: string;
  periodMonths: number;
  illnessEnabled: boolean;
  illnessSumInsured: number;
  jobLossEnabled: boolean;
  jobLossCompensation: number;
}

const defaultNsState = (): NsCatalogState => {
  const periodStartDate = todayIsoDate();
  const periodMonths = 12;
  return {
    selectedPackageId: NS_PACKAGES[0]?.id ?? 'basic',
    customSumInsured: CUSTOM_NS_SUM_OPTIONS[0],
    periodStartDate,
    periodEndDate: addMonthsToIsoDate(periodStartDate, periodMonths),
    periodMonths,
    illnessEnabled: false,
  illnessSumInsured: 100_000,
  jobLossEnabled: false,
  jobLossCompensation: 0,
  };
};

@Injectable({ providedIn: 'root' })
export class InsuranceSelectionService {
  private readonly products = INSURANCE_PRODUCTS;
  private selectedId$ = new BehaviorSubject<string>(this.products[0]?.id ?? 'ns');
  private nsState$ = new BehaviorSubject<NsCatalogState>(defaultNsState());
  private premiumState$ = new BehaviorSubject<SelectedPremiumState>({
    loading: false,
    premium: null,
  });

  readonly productsList = this.products;
  readonly nsPackages = NS_PACKAGES;

  get selectedId(): string {
    return this.selectedId$.value;
  }

  get nsState(): NsCatalogState {
    return this.nsState$.value;
  }

  selectedIdChanges() {
    return this.selectedId$.asObservable();
  }

  nsStateChanges() {
    return this.nsState$.asObservable();
  }

  premiumChanges() {
    return this.premiumState$.asObservable();
  }

  get premiumState(): SelectedPremiumState {
    return this.premiumState$.value;
  }

  setSelectedPremium(loading: boolean, premium: number | null, error?: string): void {
    this.premiumState$.next({ loading, premium, error });
  }

  getPolicySummary(): PolicySummary {
    const product = this.getSelected();
    const ns = this.nsState;
    if (!product) {
      return { whatInsuring: '—', periodLabel: '—', sumInsuredLabel: '—' };
    }

    if (product.detailPanel === 'ns') {
      const pkg = NS_PACKAGES.find((p) => p.id === ns.selectedPackageId);
      const sum = this.getNsPackageSumInsured(ns.selectedPackageId);
      return {
        whatInsuring: pkg ? `${product.title} — ${pkg.title}` : product.title,
        periodLabel: `${formatIsoDateRu(ns.periodStartDate)} — ${formatIsoDateRu(ns.periodEndDate)} (${ns.periodMonths} мес.)`,
        sumInsuredLabel: formatRub(sum),
      };
    }

    return {
      whatInsuring: product.title,
      periodLabel: '—',
      sumInsuredLabel: '—',
    };
  }

  getSelected(): InsuranceProductCard | undefined {
    return this.products.find((p) => p.id === this.selectedId);
  }

  resolveDetailPanel(override?: InsuranceDetailPanel | null): InsuranceDetailPanel | null {
    if (override && override !== 'none') {
      return override;
    }
    const panel = this.getSelected()?.detailPanel;
    return panel && panel !== 'none' ? panel : null;
  }

  select(id: string): void {
    if (this.products.some((p) => p.id === id)) {
      this.selectedId$.next(id);
    }
  }

  selectNsPackage(packageId: string): void {
    if (NS_PACKAGES.some((p) => p.id === packageId)) {
      this.patchNsState({ selectedPackageId: packageId });
    }
  }

  isNsPackageSelected(packageId: string): boolean {
    return this.nsState.selectedPackageId === packageId;
  }

  getNsPackageSumInsured(packageId: string): number {
    const pkg = NS_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return 0;
    }
    if (pkg.customSumInsured) {
      return this.nsState.customSumInsured;
    }
    return pkg.defaultSumInsured;
  }

  setCustomSumInsured(value: number): void {
    this.patchNsState({ customSumInsured: value });
  }

  setPeriodStartDate(startDate: string): void {
    const months = this.nsState.periodMonths;
    this.patchNsState({
      periodStartDate: startDate,
      periodEndDate: addMonthsToIsoDate(startDate, months),
    });
  }

  setPeriodMonths(months: number): void {
    const startDate = this.nsState.periodStartDate;
    this.patchNsState({
      periodMonths: months,
      periodEndDate: addMonthsToIsoDate(startDate, months),
    });
  }

  setIllnessEnabled(enabled: boolean): void {
    this.patchNsState({ illnessEnabled: enabled });
  }

  setIllnessSumInsured(value: number): void {
    this.patchNsState({ illnessSumInsured: value });
  }

  setJobLossEnabled(enabled: boolean): void {
    this.patchNsState({ jobLossEnabled: enabled });
  }

  setJobLossCompensation(value: number): void {
    this.patchNsState({ jobLossCompensation: value });
  }

  private patchNsState(patch: Partial<NsCatalogState>): void {
    this.nsState$.next({ ...this.nsState$.value, ...patch });
  }
}
