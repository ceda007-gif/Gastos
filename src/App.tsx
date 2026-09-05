import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppSettings, Expense, GeminiParsedReceipt, Person } from './types';
import { 
  getStoredExpenses, 
  saveStoredExpenses, 
  getStoredSettings, 
  saveStoredSettings 
} from './services/storageService';
import { Header } from './components/Header';
import { CurrencySummary } from './components/CurrencySummary';
import { ExpenseList } from './components/ExpenseList';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { MonthlyBreakdown } from './components/MonthlyBreakdown';
import { ScannerModal } from './components/ScannerModal';
import { BatchScannerModal } from './components/BatchScannerModal';
import { ExpenseModal } from './components/ExpenseModal';
import { SettingsModal } from './components/SettingsModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { formatMonthYear } from './utils/formatters';
import { Camera, PlusCircle, BookMarked, ShieldCheck, Layers } from 'lucide-react';

export const App: React.FC = () => {
  // Estados persistentes
  const [expenses, setExpenses] = useState<Expense[]>(() => getStoredExpenses());
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());

  // Filtro de mes activo y persona activa
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedPerson, setSelectedPerson] = useState<Person | 'ALL'>('ALL');

  // Estados de Modales
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedFileForScan, setSelectedFileForScan] = useState<File | null>(null);

  // Estados de Escáner por Lote
  const [isBatchScannerOpen, setIsBatchScannerOpen] = useState(false);
  const [batchFilesForScan, setBatchFilesForScan] = useState<File[]>([]);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [scannedReceiptData, setScannedReceiptData] = useState<{
    parsed: GeminiParsedReceipt;
    photoUrl: string;
  } | null>(null);
  const [photoOnlyForExpense, setPhotoOnlyForExpense] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [receiptToView, setReceiptToView] = useState<{ url: string; merchant: string } | null>(null);

  const mobileCameraInputRef = useRef<HTMLInputElement>(null);
  const mobileBatchInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar gastos con localStorage
  useEffect(() => {
    saveStoredExpenses(expenses);
  }, [expenses]);

  // Lista única de meses disponibles (YYYY-MM) ordenados descendente
  const allMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => {
      if (e.fecha && e.fecha.length >= 7) {
        set.add(e.fecha.slice(0, 7));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [expenses]);

  // Gastos filtrados por el mes activo para resúmenes
  const expensesForCurrentFilter = useMemo(() => {
    if (selectedMonth === 'ALL') return expenses;
    return expenses.filter(e => e.fecha.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const selectedMonthLabel = selectedMonth === 'ALL' 
    ? 'Todos los meses' 
    : formatMonthYear(selectedMonth);

  // Acciones de Escáner Individual
  const handleStartScan = (file: File) => {
    setSelectedFileForScan(file);
    setIsScannerOpen(true);
  };

  const handleScanSuccess = (parsed: GeminiParsedReceipt, photoUrl: string) => {
    setIsScannerOpen(false);
    setSelectedFileForScan(null);
    setScannedReceiptData({ parsed, photoUrl });
    setEditingExpense(null);
    setPhotoOnlyForExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleManualWithPhoto = (photoUrl: string) => {
    setIsScannerOpen(false);
    setSelectedFileForScan(null);
    setScannedReceiptData(null);
    setEditingExpense(null);
    setPhotoOnlyForExpense(photoUrl);
    setIsExpenseModalOpen(true);
  };

  // Acciones de Escáner por Lote
  const handleStartBatchScan = (files: File[]) => {
    setBatchFilesForScan(files);
    setIsBatchScannerOpen(true);
  };

  const handleSaveBatch = (batchExpenses: Omit<Expense, 'id' | 'creadoEn'>[]) => {
    const newExpenses: Expense[] = batchExpenses.map((data, index) => ({
      ...data,
      id: `gasto-batch-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6)}`,
      creadoEn: new Date().toISOString()
    }));
    setExpenses(prev => [...newExpenses, ...prev]);
  };

  // Acciones de Gasto Manual
  const handleOpenManualEntry = () => {
    setEditingExpense(null);
    setScannedReceiptData(null);
    setPhotoOnlyForExpense(null);
    setIsExpenseModalOpen(true);
  };

  // Acciones de Edición
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setScannedReceiptData(null);
    setPhotoOnlyForExpense(null);
    setIsExpenseModalOpen(true);
  };

  // Guardar Gasto (nuevo o editado)
  const handleSaveExpense = (data: Omit<Expense, 'id' | 'creadoEn'> & { id?: string }) => {
    if (data.id) {
      // Editar
      setExpenses(prev =>
        prev.map(item =>
          item.id === data.id
            ? {
                ...item,
                ...data,
                id: item.id,
                creadoEn: item.creadoEn
              }
            : item
        )
      );
    } else {
      // Crear nuevo asiento contable
      const newExpense: Expense = {
        ...data,
        id: `gasto-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        creadoEn: new Date().toISOString()
      };
      setExpenses(prev => [newExpense, ...prev]);
    }
  };

  // Eliminar Gasto
  const handleDeleteExpense = (id: string) => {
    if (confirm('¿Deseas eliminar este asiento de gasto?')) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  // Guardar Ajustes
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  // Importar / Limpiar
  const handleImportExpenses = (imported: Expense[]) => {
    setExpenses(imported);
  };

  const handleClearExpenses = () => {
    setExpenses([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ledger-bg text-ink-900 pb-20 sm:pb-10 selection:bg-forest-100">
      
      {/* Encabezado del Libro Contable */}
      <Header
        settings={settings}
        onOpenScanner={handleStartScan}
        onOpenBatchScanner={handleStartBatchScan}
        onOpenManualEntry={handleOpenManualEntry}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Cuerpo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-7 space-y-6">
        
        {/* Balances por Moneda (MXN y USD) y Cuentas por Persona */}
        <section>
          <CurrencySummary
            expenses={expensesForCurrentFilter}
            selectedMonthLabel={selectedMonthLabel}
            selectedPerson={selectedPerson}
            onSelectPerson={setSelectedPerson}
          />
        </section>

        {/* Distribución Principal: Libro Contable y Gráficas de Análisis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Columna Principal: Libro Diario de Gastos (7 columnas en escritorio) */}
          <section className="lg:col-span-7 xl:col-span-8 space-y-4">
            <ExpenseList
              expenses={expenses}
              allMonths={allMonths}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              selectedPerson={selectedPerson}
              onSelectPerson={setSelectedPerson}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
              onViewReceipt={(url, merchant) => setReceiptToView({ url, merchant })}
            />
          </section>

          {/* Columna Lateral: Desgloses por Categoría y Mes (5 columnas en escritorio) */}
          <aside className="lg:col-span-5 xl:col-span-4 space-y-5">
            {/* Desglose por Categoría */}
            <CategoryBreakdown expenses={expensesForCurrentFilter} />

            {/* Desglose por Mes */}
            <MonthlyBreakdown
              expenses={expenses}
              onSelectMonth={(monthKey) => setSelectedMonth(monthKey)}
            />

            {/* Ficha de Garantía de Privacidad Contable */}
            <div className="p-3.5 bg-ledger-paper border border-ledger-border rounded-sm text-xs text-ink-600 space-y-1.5 shadow-ledger-sm">
              <div className="flex items-center gap-1.5 text-forest-800 font-semibold font-serif text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Libreta Local & Segura</span>
              </div>
              <p className="leading-relaxed">
                Todos tus gastos, tickets y fotografías permanecen almacenados exclusivamente en tu navegador. Tus finanzas son 100% privadas.
              </p>
            </div>
          </aside>

        </div>

      </main>

      {/* Barra de Acceso Rápido Flotante para Teléfonos Móviles */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-ledger-paper/95 backdrop-blur-md border-t border-ledger-border px-3 py-2 flex items-center justify-around shadow-lg">
        <input
          ref={mobileCameraInputRef}
          type="file"
          accept="image/*,image/heic,image/heif"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleStartScan(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />

        <input
          ref={mobileBatchInputRef}
          type="file"
          accept="image/*,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const files = Array.from(e.target.files);
              if (files.length === 1) {
                handleStartScan(files[0]);
              } else {
                handleStartBatchScan(files);
              }
              e.target.value = '';
            }
          }}
        />

        {/* Cámara Móvil */}
        <button
          onClick={() => {
            if (!settings.geminiApiKey) {
              setIsSettingsOpen(true);
              return;
            }
            mobileCameraInputRef.current?.click();
          }}
          className="flex flex-col items-center gap-0.5 text-forest-800 font-medium active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-forest-800 text-[#FAF6ED] flex items-center justify-center shadow-md">
            <Camera className="w-4 h-4 text-[#D8E6DE]" />
          </div>
          <span className="text-[10px] font-semibold">Tomar Foto</span>
        </button>

        {/* Subir Lote Móvil */}
        <button
          onClick={() => {
            if (!settings.geminiApiKey) {
              setIsSettingsOpen(true);
              return;
            }
            mobileBatchInputRef.current?.click();
          }}
          className="flex flex-col items-center gap-0.5 text-forest-800 font-medium active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-forest-100 border border-forest-300 text-forest-800 flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4 text-forest-800" />
          </div>
          <span className="text-[10px] font-semibold">Varios Tickets</span>
        </button>

        {/* Gasto a Mano Móvil */}
        <button
          onClick={handleOpenManualEntry}
          className="flex flex-col items-center gap-0.5 text-leather-800 font-medium active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-leather-700 text-[#FAF6ED] flex items-center justify-center shadow-md">
            <PlusCircle className="w-4 h-4 text-[#F4E1D2]" />
          </div>
          <span className="text-[10px] font-semibold">A Mano</span>
        </button>
      </div>

      {/* Pie de Página Contable */}
      <footer className="border-t border-ledger-border py-4 text-center text-xs text-ink-500 font-sans mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-serif text-ink-700 font-medium">
            <BookMarked className="w-3.5 h-3.5 text-forest-800" />
            <span>Mis Cuentas — Edición Cuaderno de Cuentas</span>
          </div>
          <p className="text-[11px] text-ink-400">
            Escaneo asistido por Google Gemini (Vision) • Almacenamiento local persistente
          </p>
        </div>
      </footer>

      {/* Modales */}
      <ScannerModal
        isOpen={isScannerOpen}
        file={selectedFileForScan}
        settings={settings}
        onClose={() => {
          setIsScannerOpen(false);
          setSelectedFileForScan(null);
        }}
        onScanSuccess={handleScanSuccess}
        onManualWithPhoto={handleManualWithPhoto}
        onSelectNewPhoto={() => {
          setIsScannerOpen(false);
          mobileCameraInputRef.current?.click();
        }}
      />

      <BatchScannerModal
        isOpen={isBatchScannerOpen}
        files={batchFilesForScan}
        settings={settings}
        defaultPerson={selectedPerson !== 'ALL' ? selectedPerson : 'Pareja'}
        onClose={() => {
          setIsBatchScannerOpen(false);
          setBatchFilesForScan([]);
        }}
        onSaveBatch={handleSaveBatch}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
          setScannedReceiptData(null);
          setPhotoOnlyForExpense(null);
        }}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        scannedData={scannedReceiptData}
        photoOnly={photoOnlyForExpense}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        expenses={expenses}
        onImportExpenses={handleImportExpenses}
        onClearExpenses={handleClearExpenses}
      />

      <ReceiptViewerModal
        isOpen={Boolean(receiptToView)}
        photoUrl={receiptToView?.url || null}
        merchantName={receiptToView?.merchant || ''}
        onClose={() => setReceiptToView(null)}
      />

    </div>
  );
};

export default App;
