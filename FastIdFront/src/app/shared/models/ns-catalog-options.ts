export interface NsPackageOption {
  id: string;
  title: string;
  defaultSumInsured: number;
  productCode?: string;
  packageCode?: string;
  /** Самостоятельный — сумма из выпадающего списка */
  customSumInsured?: boolean;
  sumFrom?: number;
  sumTo?: number;
  sumStep?: number;
}

export const NS_PACKAGES: NsPackageOption[] = [
  {
    id: 'basic',
    title: 'НС Базовый',
    defaultSumInsured: 100_000,
    productCode: 'NS_CLASSIC',
    packageCode: '0',
  },
  {
    id: 'optimal',
    title: 'НС оптимальный',
    defaultSumInsured: 500_000,
    productCode: 'NS_CLASSIC',
    packageCode: '0',
  },
  {
    id: 'extended',
    title: 'НС Расширенный',
    defaultSumInsured: 1_000_000,
    productCode: 'NS_CLASSIC',
    packageCode: '0',
  },
  {
    id: 'custom',
    title: 'НС Самостоятельный',
    defaultSumInsured: 100_000,
    productCode: 'NS_CLASSIC',
    packageCode: '0',
    customSumInsured: true,
    sumFrom: 100_000,
    sumTo: 10_000_000,
    sumStep: 500_000,
  },
];

export const JOB_LOSS_AMOUNTS = [0, 150_000, 300_000];

export function buildSumInsuredRange(from: number, to: number, step: number): number[] {
  const values: number[] = [];
  for (let v = from; v <= to; v += step) {
    values.push(v);
  }
  return values;
}

export const ILLNESS_SUM_OPTIONS = buildSumInsuredRange(100_000, 1_000_000, 100_000);
export const CUSTOM_NS_SUM_OPTIONS = buildSumInsuredRange(100_000, 10_000_000, 500_000);

export const NS_PERIOD_MONTH_OPTIONS = Array.from({ length: 36 }, (_, i) => i + 1);

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addMonthsToIsoDate(isoDate: string, months: number): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return isoDate;
  }
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  date.setMonth(date.getMonth() + months);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatIsoDateRu(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) {
    return isoDate;
  }
  const [year, month, day] = parts;
  return `${day}.${month}.${year}`;
}

export function formatRub(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} руб.`;
}
