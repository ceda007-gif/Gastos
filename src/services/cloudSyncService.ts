import { AppSettings, Expense } from '../types';

/**
 * Servicio de sincronización en la nube para los gastos de Pareja.
 * Utiliza la API REST de Google Firestore o almacenamiento compartido.
 */

export interface SyncResult {
  success: boolean;
  message: string;
  syncedCount?: number;
  remoteExpenses?: Expense[];
}

/**
 * Convierte un Expense a formato de documento de Google Firestore REST API
 */
function expenseToFirestoreDocument(expense: Expense) {
  return {
    fields: {
      id: { stringValue: expense.id },
      comercio: { stringValue: expense.comercio },
      fecha: { stringValue: expense.fecha },
      total: { doubleValue: expense.total },
      categoria: { stringValue: expense.categoria },
      moneda: { stringValue: expense.moneda },
      persona: { stringValue: expense.persona },
      metodoPago: { stringValue: expense.metodoPago },
      ultimos4Digitos: expense.ultimos4Digitos ? { stringValue: expense.ultimos4Digitos } : { nullValue: null },
      notas: expense.notas ? { stringValue: expense.notas } : { nullValue: null },
      origen: { stringValue: expense.origen },
      creadoEn: { stringValue: expense.creadoEn }
    }
  };
}

/**
 * Convierte un documento de Google Firestore REST API a Expense
 */
function firestoreDocumentToExpense(doc: any): Expense | null {
  try {
    const f = doc.fields;
    if (!f) return null;
    return {
      id: f.id?.stringValue || doc.name.split('/').pop(),
      comercio: f.comercio?.stringValue || 'Comercio',
      fecha: f.fecha?.stringValue || new Date().toISOString().slice(0, 10),
      total: f.total?.doubleValue !== undefined ? f.total.doubleValue : (f.total?.integerValue ? Number(f.total.integerValue) : 0),
      categoria: f.categoria?.stringValue || 'Comida',
      moneda: (f.moneda?.stringValue as any) || 'MXN',
      persona: 'Pareja',
      metodoPago: (f.metodoPago?.stringValue as any) || 'Efectivo',
      ultimos4Digitos: f.ultimos4Digitos?.stringValue || undefined,
      notas: f.notas?.stringValue || undefined,
      origen: (f.origen?.stringValue as any) || 'manual',
      creadoEn: f.creadoEn?.stringValue || new Date().toISOString()
    };
  } catch (e) {
    console.error('Error parseando documento Firestore:', e);
    return null;
  }
}

/**
 * Sincroniza los gastos de 'Pareja' con Google Cloud Firestore
 */
export async function syncParejaWithFirestore(
  localParejaExpenses: Expense[],
  settings: AppSettings
): Promise<SyncResult> {
  const projectId = settings.cloudSync?.firebaseProjectId?.trim();
  const syncCode = settings.cloudSync?.syncCode?.trim() || 'FAMILIA-CY';

  if (!projectId) {
    return {
      success: false,
      message: 'Falta configurar el Project ID de Firebase en Ajustes.'
    };
  }

  const collectionName = `pareja_gastos_${syncCode.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}`;

  try {
    // 1. Obtener los gastos remotos de Firestore
    const response = await fetch(baseUrl);
    let remoteExpenses: Expense[] = [];

    if (response.ok) {
      const data = await response.json();
      if (data.documents && Array.isArray(data.documents)) {
        remoteExpenses = data.documents
          .map(firestoreDocumentToExpense)
          .filter((e): e is Expense => e !== null && !String(e.id || '').startsWith('sample-'));
      }
    } else if (response.status !== 404) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // 2. Subir a Firestore los gastos locales que no estén en remoto o sean más recientes
    const remoteIdMap = new Map(remoteExpenses.map(e => [e.id, e]));

    for (const localExp of localParejaExpenses) {
      if (String(localExp.id || '').startsWith('sample-')) continue;
      const remote = remoteIdMap.get(localExp.id);
      if (!remote || new Date(localExp.creadoEn) > new Date(remote.creadoEn)) {
        // Enviar documento a Firestore con PATCH
        const docUrl = `${baseUrl}/${localExp.id}`;
        await fetch(docUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseToFirestoreDocument(localExp))
        });
      }
    }

    // 3. Fusionar: los locales + los que estaban en la nube que nosotros no teníamos
    const localIdSet = new Set(localParejaExpenses.map(e => e.id));
    const newFromCloud = remoteExpenses.filter(e => !localIdSet.has(e.id));

    return {
      success: true,
      message: `Sincronización exitosa. ${newFromCloud.length} gastos nuevos recibidos de Pareja.`,
      syncedCount: localParejaExpenses.length + newFromCloud.length,
      remoteExpenses: [...localParejaExpenses, ...newFromCloud]
    };
  } catch (error: any) {
    console.error('Error durante sincronización con Firestore:', error);
    return {
      success: false,
      message: error.message || 'Error de conexión con Firestore.'
    };
  }
}

/**
 * Elimina un documento de Firestore cuando el usuario lo borra localmente
 */
export async function deleteExpenseFromFirestore(expenseId: string, settings: AppSettings): Promise<void> {
  const projectId = settings.cloudSync?.firebaseProjectId?.trim();
  const syncCode = settings.cloudSync?.syncCode?.trim() || 'FAMILIA-CY';
  if (!projectId || !expenseId) return;

  const collectionName = `pareja_gastos_${syncCode.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${expenseId}`;
  try {
    await fetch(docUrl, { method: 'DELETE' });
  } catch (e) {
    console.warn('Error eliminando gasto en Firestore:', e);
  }
}

/**
 * Fusiona gastos recibidos de Pareja en el conjunto total local sin tocar los gastos privados de Carlos ni Yuli
 */
export function mergeParejaExpenses(allExpenses: Expense[], updatedParejaExpenses: Expense[]): Expense[] {
  // Conservar todos los gastos privados (Carlos, Yuli u otros)
  const personalExpenses = allExpenses.filter(e => (e.persona || 'Pareja') !== 'Pareja' && !String(e.id || '').startsWith('sample-'));

  // Asegurar que no haya duplicados entre los gastos de Pareja ni datos de muestra
  const map = new Map<string, Expense>();
  for (const exp of updatedParejaExpenses) {
    if (!String(exp.id || '').startsWith('sample-')) {
      map.set(exp.id, { ...exp, persona: 'Pareja' });
    }
  }

  return [...personalExpenses, ...Array.from(map.values())];
}
