import { AppSettings, Expense, UserProfile } from '../types';

const STORAGE_KEY_EXPENSES = 'mis_cuentas_gastos_v1';
const STORAGE_KEY_SETTINGS = 'mis_cuentas_ajustes_v1';

const INITIAL_SETTINGS: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-3.8-flash',
  userProfile: 'Carlos',
  cloudSync: {
    enabled: true,
    syncCode: 'FAMILIA-CY',
    firebaseProjectId: 'gastos-9bdbb',
    syncStatus: 'idle'
  }
};

const SAMPLE_EXPENSES: Expense[] = [];

export function getStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filtrar gastos de prueba previos (sample-1, sample-2, etc.)
      const cleaned = parsed
        .filter((e: any) => !String(e.id || '').startsWith('sample-'))
        .map((e: any) => ({
          ...e,
          persona: e.persona || 'Pareja',
          metodoPago: e.metodoPago || 'Efectivo',
          ultimos4Digitos: e.ultimos4Digitos || undefined
        }));
      return cleaned;
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
      ...parsed,
      cloudSync: {
        ...INITIAL_SETTINGS.cloudSync,
        ...(parsed.cloudSync || {}),
        firebaseProjectId: parsed.cloudSync?.firebaseProjectId?.trim() || 'gastos-9bdbb',
        enabled: parsed.cloudSync?.enabled !== undefined ? parsed.cloudSync.enabled : true,
        syncCode: parsed.cloudSync?.syncCode?.trim() || 'FAMILIA-CY'
      }
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

export function filterExpensesByProfile(expenses: Expense[], profile: UserProfile): Expense[] {
  if (profile === 'Todos') return expenses;
  if (profile === 'Carlos') {
    // Carlos solo ve sus propios gastos personales y los de Pareja
    return expenses.filter(e => {
      const p = e.persona || 'Pareja';
      return p === 'Carlos' || p === 'Pareja';
    });
  }
  if (profile === 'Yuli') {
    // Yuli solo ve sus propios gastos personales y los de Pareja
    return expenses.filter(e => {
      const p = e.persona || 'Pareja';
      return p === 'Yuli' || p === 'Pareja';
    });
  }
  return expenses;
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

export function exportParejaExpensesToJSON(expenses: Expense[]): void {
  const parejaExpenses = expenses.filter(e => (e.persona || 'Pareja') === 'Pareja');
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(parejaExpenses, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `mis_cuentas_pareja_compartido_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
