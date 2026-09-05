export type ExpenseCategory =
  | 'Renta'
  | 'Agua'
  | 'Luz'
  | 'Comida'
  | 'Transporte'
  | 'Gasolina'
  | 'Hospedaje'
  | 'Compras'
  | 'Servicios'
  | 'Entretenimiento'
  | 'Otros';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Renta',
  'Agua',
  'Luz',
  'Comida',
  'Transporte',
  'Gasolina',
  'Hospedaje',
  'Compras',
  'Servicios',
  'Entretenimiento',
  'Otros'
];

export type Currency = 'MXN' | 'USD';

export const CURRENCIES: Currency[] = ['MXN', 'USD'];

export interface Expense {
  id: string;
  comercio: string;
  fecha: string; // YYYY-MM-DD
  total: number;
  categoria: ExpenseCategory;
  moneda: Currency;
  notas?: string;
  fotoRecibo?: string; // Data URL opcional
  creadoEn: string; // ISO string
  origen: 'manual' | 'escaneo_ia';
}

export interface GeminiParsedReceipt {
  comercio: string;
  fecha: string;
  total: number;
  categoria: ExpenseCategory;
  moneda: Currency;
}

export interface AppSettings {
  geminiApiKey: string;
  geminiModel: string;
}

export interface MonthlySummary {
  monthKey: string; // '2026-03'
  monthLabel: string; // 'Marzo 2026'
  totalMXN: number;
  totalUSD: number;
  count: number;
}

export interface CategorySummary {
  categoria: ExpenseCategory;
  total: number;
  percentage: number;
  count: number;
}
