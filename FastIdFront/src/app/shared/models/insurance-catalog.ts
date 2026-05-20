/** Какую панель детализации показать после выбора продукта */
export type InsuranceDetailPanel = 'ns' | 'none';

export interface InsuranceProductCard {
  id: string;
  title: string;
  description: string;
  /** Код продукта на бэкенде, если доступен расчёт премии */
  productCode?: string;
  packageCode?: string;
  /** Панель опций при выборе (например ns_cart) */
  detailPanel?: InsuranceDetailPanel;
}

export const INSURANCE_PRODUCTS: InsuranceProductCard[] = [
  {
    id: 'ns',
    title: 'НС',
    description: 'Страхование от несчастного случая',
    productCode: 'NS_CLASSIC',
    packageCode: '0',
    detailPanel: 'ns',
  },
  {
    id: 'nsport',
    title: 'НС спорт',
    description: 'Страхование от несчастного случая для спортсменов',
    productCode: 'NS_SPORT',
    packageCode: '1',
  },
  {
    id: 'tick',
    title: 'Антиклещ',
    description: 'Страхование от укуса клеща',
  },
  {
    id: 'fin',
    title: 'Финриски',
    description: 'Финансовые риски',
  },
  {
    id: 'auto',
    title: 'Расходы на авто',
    description: 'Замена колеса, эвакуация, быстрый ремонт',
  },
];
