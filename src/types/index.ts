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

export type Person = 'Yuli' | 'Carlos' | 'Pareja';

export const PERSONS: Person[] = ['Yuli', 'Carlos', 'Pareja'];

export type PaymentMethod =
  | 'Efectivo'
  | 'Tarjeta de Crédito'
  | 'Tarjeta de Débito'
  | 'Transferencia';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Efectivo',
  'Tarjeta de Crédito',
  'Tarjeta de Débito',
  'Transferencia'
];

export interface Expense {
  id: string;
  comercio: string;
  fecha: string; // YYYY-MM-DD
  total: number;
  categoria: ExpenseCategory;
  moneda: Currency;
  persona: Person;
  metodoPago: PaymentMethod;
  ultimos4Digitos?: string;
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
  metodoPago?: PaymentMethod;
  ultimos4Digitos?: string;
}

export type UserProfile = 'Carlos' | 'Yuli' | 'Todos';

export interface CloudSyncConfig {
  enabled: boolean;
  syncCode: string; // Código compartido ej: "FAMILIA-CY"
  firebaseProjectId?: string; // ID de proyecto Firebase opcional
  lastSyncTime?: string; // ISO string
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
}

export interface AppSettings {
  geminiApiKey: string;
  geminiModel: string;
  userProfile: UserProfile;
  cloudSync?: CloudSyncConfig;
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
