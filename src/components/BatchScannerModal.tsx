import React, { useState, useEffect } from 'react';
import { 
  AppSettings, 
  ExpenseCategory, 
  EXPENSE_CATEGORIES, 
  Currency, 
  CURRENCIES, 
  Person, 
  PERSONS, 
  PaymentMethod, 
  PAYMENT_METHODS, 
  Expense,
  UserProfile
} from '../types';
import { optimizeImage, parseReceiptWithGemini } from '../services/geminiService';
import { formatMoney } from '../utils/formatters';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  CreditCard, 
  User, 
  Trash2, 
  Save, 
  Layers, 
  RotateCw,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BatchItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  // Campos extraídos / editables
  comercio: string;
  fecha: string;
  total: number;
  categoria: ExpenseCategory;
  moneda: Currency;
  persona: Person;
  metodoPago: PaymentMethod;
  ultimos4Digitos?: string;
}

interface BatchScannerModalProps {
  files: File[];
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (expenses: Omit<Expense, 'id' | 'creadoEn'>[]) => void;
  defaultPerson?: Person;
  userProfile?: UserProfile;
}

export const BatchScannerModal: React.FC<BatchScannerModalProps> = ({
  files,
  settings,
  isOpen,
  onClose,
  onSaveBatch,
  defaultPerson = 'Pareja',
  userProfile = 'Carlos'
}) => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && files.length > 0) {
      const initialItems: BatchItem[] = files.map((file, idx) => ({
        id: `batch-${idx}-${Date.now()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
        comercio: file.name.replace(/\.[^/.]+$/, '').slice(0, 30),
        fecha: new Date().toISOString().slice(0, 10),
        total: 0,
        categoria: 'Comida',
        moneda: 'MXN',
        persona: defaultPerson,
        metodoPago: 'Efectivo',
        ultimos4Digitos: undefined
      }));
      setItems(initialItems);
      setCurrentIndex(0);
      processBatch(initialItems);
    } else if (!isOpen) {
      setItems([]);
      setIsProcessingAll(false);
      setSelectedPreview(null);
    }
  }, [isOpen, files]);

  const processBatch = async (batchItems: BatchItem[]) => {
    setIsProcessingAll(true);

    for (let i = 0; i < batchItems.length; i++) {
      setCurrentIndex(i);
      
      // Actualizar estado a processing
      setItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'processing' } : item));

      try {
        const item = batchItems[i];
        const { base64Data, mimeType, dataUrl } = await optimizeImage(item.file, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.72
        });

        const parsed = await parseReceiptWithGemini(
          base64Data,
          mimeType,
          settings.geminiApiKey,
          settings.geminiModel
        );

        setItems(prev => prev.map((curr, idx) => {
          if (idx === i) {
            return {
              ...curr,
              status: 'success',
              previewUrl: dataUrl,
              comercio: parsed.comercio || curr.comercio,
              fecha: parsed.fecha || curr.fecha,
              total: parsed.total || 0,
              categoria: parsed.categoria || 'Comida',
              moneda: parsed.moneda || 'MXN',
              metodoPago: parsed.metodoPago || 'Efectivo',
              ultimos4Digitos: parsed.ultimos4Digitos
            };
          }
          return curr;
        }));

      } catch (err: any) {
        console.error(`Error procesando ticket #${i + 1}:`, err);
        setItems(prev => prev.map((curr, idx) => {
          if (idx === i) {
            return {
              ...curr,
              status: 'error',
              errorMessage: err.message || 'Error al procesar con IA'
            };
          }
          return curr;
        }));
      }
    }

    setIsProcessingAll(false);
  };

  if (!isOpen) return null;

  const handleUpdateItem = (id: string, updates: Partial<BatchItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSetAllPerson = (person: Person) => {
    setItems(prev => prev.map(item => ({ ...item, persona: person })));
  };

  const handleSaveAll = () => {
    const validItems = items.filter(item => item.total > 0 && item.comercio.trim().length > 0);

    if (validItems.length === 0) {
      alert('Por favor verifica que al menos un ticket tenga comercio y total mayor a 0.');
      return;
    }

    const expensesToSave: Omit<Expense, 'id' | 'creadoEn'>[] = validItems.map(item => ({
      comercio: item.comercio.trim(),
      fecha: item.fecha,
      total: item.total,
      categoria: item.categoria,
      moneda: item.moneda,
      persona: item.persona,
      metodoPago: item.metodoPago,
      ultimos4Digitos: item.metodoPago === 'Tarjeta de Crédito' || item.metodoPago === 'Tarjeta de Débito'
        ? item.ultimos4Digitos?.slice(-4)
        : undefined,
      fotoRecibo: item.previewUrl,
      origen: 'escaneo_ia',
      notas: `Lote escaneado (${item.metodoPago}${item.ultimos4Digitos ? ' ...' + item.ultimos4Digitos : ''})`
    }));

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#1B3B2B', '#8C5A35', '#2E664C']
      });
    } catch {}

    onSaveBatch(expensesToSave);
    onClose();
  };

  const successCount = items.filter(i => i.status === 'success').length;
  const progressPercent = items.length > 0 
    ? Math.round(((currentIndex + (isProcessingAll ? 0.5 : 1)) / items.length) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-ink-900/60 backdrop-blur-xs">
      <div className="bg-ledger-paper border border-ledger-border rounded-sm shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ledger-border bg-ledger-header/80">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-forest-800" />
            <div>
              <h3 className="font-serif font-bold text-ink-900 text-base">
                Escáner por Lote ({items.length} {items.length === 1 ? 'ticket' : 'tickets'})
              </h3>
              <p className="text-[11px] text-ink-500">
                Lectura inteligente múltiple y asignación rápida
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-ink-500 hover:text-ink-900 hover:bg-ledger-rule"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de progreso si está procesando */}
        {isProcessingAll && (
          <div className="bg-forest-50 px-4 py-2.5 border-b border-forest-200">
            <div className="flex items-center justify-between text-xs font-semibold text-forest-900 mb-1.5">
              <span className="flex items-center gap-2">
                <RotateCw className="w-3.5 h-3.5 animate-spin text-forest-700" />
                Leyendo ticket {currentIndex + 1} de {items.length}...
              </span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full bg-forest-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-forest-800 h-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Barra de Asignación Masiva Rápida */}
        {!isProcessingAll && items.length > 1 && (
          <div className="bg-ledger-card/80 px-4 py-2 border-b border-ledger-border flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-ink-600 font-medium flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-leather-700" />
              Asignar todos a:
            </span>
            <div className="flex items-center gap-1.5">
              {(userProfile === 'Carlos' 
                ? (['Carlos', 'Pareja'] as Person[]) 
                : userProfile === 'Yuli' 
                ? (['Yuli', 'Pareja'] as Person[]) 
                : PERSONS
              ).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSetAllPerson(p)}
                  className="px-2.5 py-1 rounded-xs border border-ledger-border bg-ledger-paper hover:bg-ledger-rule font-medium text-ink-800 transition-colors"
                >
                  {p === 'Pareja' ? '👫 Pareja' : p === 'Carlos' ? '💼 Carlos' : '🌸 Yuli'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Tickets en Revisión */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`border rounded-sm p-3 transition-colors ${
                item.status === 'processing' 
                  ? 'border-forest-600 bg-forest-50/40' 
                  : item.status === 'error'
                  ? 'border-red-300 bg-red-50/30'
                  : 'border-ledger-border bg-ledger-paper hover:bg-[#FAF7EE]'
              }`}
            >
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                
                {/* Miniatura de la foto */}
                <div className="relative shrink-0 w-16 h-20 bg-ledger-card rounded-xs border border-ledger-border overflow-hidden group">
                  <img
                    src={item.previewUrl}
                    alt={`Ticket ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedPreview(item.previewUrl)}
                  />
                  <button
                    onClick={() => setSelectedPreview(item.previewUrl)}
                    className="absolute inset-0 bg-ink-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    title="Ver en grande"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 bg-ink-900/70 text-white text-[9px] text-center font-mono py-0.5">
                    #{index + 1}
                  </span>
                </div>

                {/* Campos editables del ticket */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 w-full">
                  
                  {/* Comercio */}
                  <div className="lg:col-span-3">
                    <label className="block text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-0.5">
                      Comercio / Detalle
                    </label>
                    <input
                      type="text"
                      value={item.comercio}
                      onChange={(e) => handleUpdateItem(item.id, { comercio: e.target.value })}
                      placeholder="Nombre del comercio"
                      className="w-full px-2 py-1 text-xs bg-ledger-paper border border-ledger-border rounded-xs font-serif font-semibold text-ink-900"
                    />
                  </div>

                  {/* Monto y Moneda */}
                  <div className="lg:col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-0.5">
                      Total
                    </label>
                    <div className="flex items-center gap-1">
                      <div className="relative flex-1">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-ink-400 font-serif text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.total || ''}
                          onChange={(e) => handleUpdateItem(item.id, { total: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="w-full pl-4 pr-1 py-1 text-xs bg-ledger-paper border border-ledger-border rounded-xs font-bold text-forest-900"
                        />
                      </div>
                      <select
                        value={item.moneda}
                        onChange={(e) => handleUpdateItem(item.id, { moneda: e.target.value as Currency })}
                        className="px-1 py-1 text-[11px] bg-ledger-card border border-ledger-border rounded-xs font-bold"
                      >
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Fecha y Categoría */}
                  <div className="lg:col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-0.5">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={item.fecha}
                      onChange={(e) => handleUpdateItem(item.id, { fecha: e.target.value })}
                      className="w-full px-1.5 py-1 text-xs bg-ledger-paper border border-ledger-border rounded-xs font-mono"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-0.5">
                      Categoría
                    </label>
                    <select
                      value={item.categoria}
                      onChange={(e) => handleUpdateItem(item.id, { categoria: e.target.value as ExpenseCategory })}
                      className="w-full px-1.5 py-1 text-xs bg-ledger-paper border border-ledger-border rounded-xs text-ink-800 cursor-pointer"
                    >
                      {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  {/* Persona */}
                  <div className="lg:col-span-1">
                    <label className="block text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-0.5">
                      Persona
                    </label>
                    <select
                      value={item.persona}
                      onChange={(e) => handleUpdateItem(item.id, { persona: e.target.value as Person })}
                      className="w-full px-1 py-1 text-xs bg-ledger-paper border border-ledger-border rounded-xs font-medium text-ink-900 cursor-pointer"
                    >
                      {(userProfile === 'Carlos' 
                        ? (['Carlos', 'Pareja'] as Person[]) 
                        : userProfile === 'Yuli' 
                        ? (['Yuli', 'Pareja'] as Person[]) 
                        : PERSONS
                      ).map(p => (
                        <option key={p} value={p}>
                          {p === 'Pareja' ? '👫 Pareja' : p === 'Carlos' ? '💼 Carlos' : '🌸 Yuli'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Método de Pago & Últimos 4 dígitos */}
                  <div className="lg:col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-0.5 flex items-center justify-between">
                      <span>Pago</span>
                      {(item.metodoPago === 'Tarjeta de Crédito' || item.metodoPago === 'Tarjeta de Débito') && (
                        <span className="text-leather-700 font-mono text-[9px]">4 dígitos</span>
                      )}
                    </label>
                    <div className="flex items-center gap-1">
                      <select
                        value={item.metodoPago}
                        onChange={(e) => handleUpdateItem(item.id, { metodoPago: e.target.value as PaymentMethod })}
                        className="flex-1 px-1 py-1 text-[11px] bg-ledger-paper border border-ledger-border rounded-xs cursor-pointer"
                      >
                        {PAYMENT_METHODS.map(m => (
                          <option key={m} value={m}>
                            {m === 'Tarjeta de Crédito' ? 'T. Crédito' : m === 'Tarjeta de Débito' ? 'T. Débito' : m}
                          </option>
                        ))}
                      </select>

                      {(item.metodoPago === 'Tarjeta de Crédito' || item.metodoPago === 'Tarjeta de Débito') && (
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="1234"
                          value={item.ultimos4Digitos || ''}
                          onChange={(e) => handleUpdateItem(item.id, { ultimos4Digitos: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          className="w-12 px-1 py-1 text-xs font-mono text-center bg-ledger-paper border border-ledger-border rounded-xs"
                          title="Últimos 4 dígitos de la tarjeta"
                        />
                      )}
                    </div>
                  </div>

                </div>

                {/* Botón eliminar ticket individual */}
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="shrink-0 p-1.5 text-ink-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors self-end md:self-center"
                  title="Descartar este comprobante"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

              </div>

              {/* Mensaje de error si la IA no leyó bien */}
              {item.status === 'error' && (
                <div className="mt-2 text-[11px] text-leather-800 flex items-center gap-1.5 bg-leather-50/80 px-2 py-1 rounded-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-leather-600 shrink-0" />
                  <span>{item.errorMessage || 'No se pudo leer con IA. Ingresa el monto manualmente.'}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pie de modal */}
        <div className="px-4 py-3 border-t border-ledger-border bg-ledger-header/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-ink-600 flex items-center gap-2">
            <span className="font-semibold text-ink-900">
              {items.length} {items.length === 1 ? 'ticket' : 'tickets'}
            </span>
            <span>•</span>
            <span>
              Total: <strong>{formatMoney(items.reduce((acc, i) => acc + (i.total || 0), 0), 'MXN')}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isProcessingAll}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-ink-700 hover:text-ink-900 border border-ledger-border bg-ledger-card rounded-sm hover:bg-ledger-rule disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isProcessingAll || items.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-[#FAF6ED] bg-forest-800 hover:bg-forest-900 rounded-sm border border-forest-900 shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Asentar {items.length} en el Libro</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modal visor flotante para ver imagen en grande */}
      {selectedPreview && (
        <div 
          onClick={() => setSelectedPreview(null)}
          className="fixed inset-0 z-60 bg-ink-900/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-md max-h-[85vh] bg-ledger-paper p-2 rounded shadow-2xl relative">
            <img src={selectedPreview} alt="Ticket" className="max-h-[80vh] object-contain rounded-xs" />
            <button
              onClick={() => setSelectedPreview(null)}
              className="absolute top-4 right-4 bg-ink-900 text-white rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
