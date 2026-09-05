import React, { useState, useEffect } from 'react';
import { 
  CURRENCIES, 
  Currency, 
  EXPENSE_CATEGORIES, 
  Expense, 
  ExpenseCategory, 
  GeminiParsedReceipt 
} from '../types';
import { getTodayDateString } from '../utils/formatters';
import { X, Sparkles, Image as ImageIcon, Save, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id' | 'creadoEn'> & { id?: string }) => void;
  editingExpense?: Expense | null;
  scannedData?: {
    parsed: GeminiParsedReceipt;
    photoUrl: string;
  } | null;
  photoOnly?: string | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  scannedData,
  photoOnly
}) => {
  const [comercio, setComercio] = useState('');
  const [fecha, setFecha] = useState(getTodayDateString());
  const [total, setTotal] = useState<string>('');
  const [categoria, setCategoria] = useState<ExpenseCategory>('Comida');
  const [moneda, setMoneda] = useState<Currency>('MXN');
  const [notas, setNotas] = useState('');
  const [fotoRecibo, setFotoRecibo] = useState<string | undefined>(undefined);
  const [origen, setOrigen] = useState<'manual' | 'escaneo_ia'>('manual');
  const [formError, setFormError] = useState<string | null>(null);

  // Inicialización de campos según el origen (edición, escaneo de IA, o nuevo gasto manual)
  useEffect(() => {
    if (!isOpen) return;

    if (editingExpense) {
      setComercio(editingExpense.comercio);
      setFecha(editingExpense.fecha);
      setTotal(editingExpense.total.toString());
      setCategoria(editingExpense.categoria);
      setMoneda(editingExpense.moneda);
      setNotas(editingExpense.notas || '');
      setFotoRecibo(editingExpense.fotoRecibo);
      setOrigen(editingExpense.origen);
      setFormError(null);
    } else if (scannedData) {
      setComercio(scannedData.parsed.comercio || '');
      setFecha(scannedData.parsed.fecha || getTodayDateString());
      setTotal(scannedData.parsed.total ? scannedData.parsed.total.toString() : '');
      setCategoria(scannedData.parsed.categoria || 'Comida');
      setMoneda(scannedData.parsed.moneda || 'MXN');
      setNotas('Leído de ticket escaneado con Gemini');
      setFotoRecibo(scannedData.photoUrl);
      setOrigen('escaneo_ia');
      setFormError(null);
    } else if (photoOnly) {
      setComercio('');
      setFecha(getTodayDateString());
      setTotal('');
      setCategoria('Comida');
      setMoneda('MXN');
      setNotas('');
      setFotoRecibo(photoOnly);
      setOrigen('manual');
      setFormError(null);
    } else {
      // Nuevo gasto manual limpio
      setComercio('');
      setFecha(getTodayDateString());
      setTotal('');
      setCategoria('Comida');
      setMoneda('MXN');
      setNotas('');
      setFotoRecibo(undefined);
      setOrigen('manual');
      setFormError(null);
    }
  }, [isOpen, editingExpense, scannedData, photoOnly]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!comercio.trim()) {
      setFormError('Por favor ingresa el nombre del comercio o concepto.');
      return;
    }

    const parsedTotal = parseFloat(total);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      setFormError('Por favor ingresa un monto total válido mayor a 0.');
      return;
    }

    if (!fecha) {
      setFormError('Por favor especifica una fecha válida.');
      return;
    }

    // Efecto de celebración con confeti discreto
    try {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 },
        colors: ['#1B3B2B', '#8C5A35', '#2E664C']
      });
    } catch {
      // Ignorar si el canvas no está disponible
    }

    onSave({
      id: editingExpense?.id,
      comercio: comercio.trim(),
      fecha,
      total: parsedTotal,
      categoria,
      moneda,
      notas: notas.trim() || undefined,
      fotoRecibo,
      origen
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-900/60 backdrop-blur-xs">
      <div className="bg-ledger-paper border border-ledger-border rounded-sm shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Barra superior */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ledger-border bg-ledger-header/80">
          <div className="flex items-center gap-2">
            {origen === 'escaneo_ia' ? (
              <Sparkles className="w-4 h-4 text-forest-800" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-leather-700" />
            )}
            <h3 className="font-serif font-bold text-ink-900 text-base">
              {editingExpense 
                ? 'Editar Asiento de Gasto' 
                : (origen === 'escaneo_ia' ? 'Confirmar Gasto Escaneado' : 'Registrar Nuevo Gasto')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-ink-500 hover:text-ink-900 hover:bg-ledger-rule transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {origen === 'escaneo_ia' && (
            <div className="p-2.5 bg-forest-50 border border-forest-200 rounded-sm text-xs text-forest-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-forest-700 shrink-0" />
              <span>
                Datos leídos con IA de Google Gemini. Revisa que todo coincida con tu ticket antes de asentar el gasto.
              </span>
            </div>
          )}

          {formError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Comercio / Concepto */}
          <div>
            <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1">
              Comercio o Concepto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Supermercado, Renta de Oficina, CFE, Gasolinera"
              value={comercio}
              onChange={(e) => setComercio(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-ledger-paper border border-ledger-border rounded-sm text-ink-900 focus:outline-none focus:border-forest-700 font-medium"
            />
          </div>

          {/* Fila: Monto y Moneda */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-7 sm:col-span-8">
              <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1">
                Monto Total *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 font-serif font-bold text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-base font-serif font-bold bg-ledger-paper border border-ledger-border rounded-sm text-forest-950 focus:outline-none focus:border-forest-700"
                />
              </div>
            </div>

            <div className="col-span-5 sm:col-span-4">
              <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1">
                Moneda *
              </label>
              <div className="grid grid-cols-2 gap-1 bg-ledger-card p-1 rounded-sm border border-ledger-border">
                {CURRENCIES.map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setMoneda(curr)}
                    className={`py-1.5 text-xs font-bold rounded-xs transition-colors ${
                      moneda === curr
                        ? 'bg-forest-800 text-[#FAF6ED] shadow-xs'
                        : 'text-ink-600 hover:text-ink-900'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fila: Fecha y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1">
                Fecha de Compra *
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-ledger-paper border border-ledger-border rounded-sm text-ink-800 focus:outline-none focus:border-forest-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1">
                Categoría *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 text-sm bg-ledger-paper border border-ledger-border rounded-sm text-ink-800 focus:outline-none focus:border-forest-700 cursor-pointer"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas / Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1">
              Notas Adicionales (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Proyecto Alpha, deducible, propina incluida..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-ledger-paper border border-ledger-border rounded-sm text-ink-800 focus:outline-none focus:border-forest-700"
            />
          </div>

          {/* Foto del comprobante si existe */}
          {fotoRecibo && (
            <div className="border border-ledger-border rounded-sm p-2.5 bg-ledger-card/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <img
                  src={fotoRecibo}
                  alt="Comprobante"
                  className="w-12 h-12 object-cover rounded-xs border border-ledger-border shrink-0"
                />
                <div>
                  <p className="text-xs font-semibold text-ink-800 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-leather-600" />
                    Comprobante adjunto
                  </p>
                  <p className="text-[11px] text-ink-500">Guardado en tu almacenamiento local</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFotoRecibo(undefined)}
                className="text-xs text-red-700 hover:underline px-2 py-1"
              >
                Quitar foto
              </button>
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-2 border-t border-ledger-rule flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-ink-700 hover:text-ink-900 border border-ledger-border bg-ledger-card rounded-sm hover:bg-ledger-rule"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-[#FAF6ED] bg-forest-800 hover:bg-forest-900 rounded-sm border border-forest-900 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingExpense ? 'Guardar Cambios' : 'Asentar en el Libro'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
