import { AppSettings, Expense } from '../types';

const STORAGE_KEY_EXPENSES = 'mis_cuentas_gastos_v1';
const STORAGE_KEY_SETTINGS = 'mis_cuentas_ajustes_v1';

const INITIAL_SETTINGS: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-3.8-flash',
};

const SAMPLE_EXPENSES: Expense[] = [
  {
    id: 'sample-1',
    comercio: 'Supermercado La Comer',
    fecha: '2026-03-02',
    total: 845.50,
    categoria: 'Comida',
    moneda: 'MXN',
    persona: 'Pareja',
    metodoPago: 'Tarjeta de Crédito',
    ultimos4Digitos: '4582',
    notas: 'Despensa semanal y frutas',
    creadoEn: new Date('2026-03-02T11:20:00Z').toISOString(),
    origen: 'escaneo_ia'
  },
  {
    id: 'sample-2',
    comercio: 'Gasolinera Mobil Centro',
    fecha: '2026-03-01',
    total: 650.00,
    categoria: 'Gasolina',
    moneda: 'MXN',
    persona: 'Carlos',
    metodoPago: 'Tarjeta de Crédito',
    ultimos4Digitos: '1209',
    notas: 'Tanque lleno auto',
    creadoEn: new Date('2026-03-01T08:15:00Z').toISOString(),
    origen: 'escaneo_ia'
  },
  {
    id: 'sample-3',
    comercio: 'Renta Depto / Oficina',
    fecha: '2026-03-01',
    total: 8500.00,
    categoria: 'Renta',
    moneda: 'MXN',
    persona: 'Pareja',
    metodoPago: 'Transferencia',
    notas: 'Transferencia mensual arrendamiento',
    creadoEn: new Date('2026-03-01T07:00:00Z').toISOString(),
    origen: 'manual'
  },
  {
    id: 'sample-4',
    comercio: 'CFE - Suministro Eléctrico',
    fecha: '2026-02-28',
    total: 480.00,
    categoria: 'Luz',
    moneda: 'MXN',
    persona: 'Pareja',
    metodoPago: 'Efectivo',
    notas: 'Bimestre enero-febrero',
    creadoEn: new Date('2026-02-28T14:30:00Z').toISOString(),
    origen: 'manual'
  },
  {
    id: 'sample-5',
    comercio: 'GitHub Pro & Copilot',
    fecha: '2026-02-20',
    total: 14.00,
    categoria: 'Servicios',
    moneda: 'USD',
    persona: 'Carlos',
    metodoPago: 'Tarjeta de Crédito',
    ultimos4Digitos: '1209',
    notas: 'Suscripción de software mensual',
    creadoEn: new Date('2026-02-20T10:00:00Z').toISOString(),
    origen: 'manual'
  },
  {
    id: 'sample-6',
    comercio: 'Restaurante Los Almendros',
    fecha: '2026-02-15',
    total: 520.00,
    categoria: 'Comida',
    moneda: 'MXN',
    persona: 'Yuli',
    metodoPago: 'Efectivo',
    notas: 'Comida de trabajo con cliente',
    creadoEn: new Date('2026-02-15T16:00:00Z').toISOString(),
    origen: 'escaneo_ia'
  }
];

export function getStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (!raw) {
      // Sembrar datos de muestra iniciales para deleite visual
      localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(SAMPLE_EXPENSES));
      return SAMPLE_EXPENSES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Migración defensiva: asegurar que todo gasto tenga persona y metodoPago
      return parsed.map((e: any) => ({
        ...e,
        persona: e.persona || 'Pareja',
        metodoPago: e.metodoPago || 'Efectivo',
        ultimos4Digitos: e.ultimos4Digitos || undefined
      }));
    }
    return [];
  } catch (error) {
    console.error('Error al leer gastos desde localStorage:', error);
    return [];
  }
}

export function saveStoredExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
  } catch (error) {
    console.error('Error al guardar gastos en localStorage:', error);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      return INITIAL_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_SETTINGS,
      ...parsed
    };
  } catch (error) {
    console.error('Error al leer configuración de localStorage:', error);
    return INITIAL_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error al guardar configuración en localStorage:', error);
  }
}

export function exportExpensesToCSV(expenses: Expense[]): void {
  const headers = ['ID', 'Fecha', 'Persona', 'Comercio', 'Categoría', 'Total', 'Moneda', 'Método de Pago', 'Últimos 4 Dígitos', 'Origen', 'Notas'];
  const rows = expenses.map(e => [
    `"${e.id}"`,
    `"${e.fecha}"`,
    `"${e.persona || 'Pareja'}"`,
    `"${(e.comercio || '').replace(/"/g, '""')}"`,
    `"${e.categoria}"`,
    e.total.toFixed(2),
    `"${e.moneda}"`,
    `"${e.metodoPago || 'Efectivo'}"`,
    `"${e.ultimos4Digitos ? '...' + e.ultimos4Digitos : ''}"`,
    `"${e.origen === 'escaneo_ia' ? 'Escaneo IA' : 'Manual'}"`,
    `"${(e.notas || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `mis_cuentas_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportExpensesToJSON(expenses: Expense[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(expenses, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `mis_cuentas_respaldo_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
