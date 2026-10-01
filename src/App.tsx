import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppSettings, Expense, GeminiParsedReceipt, Person, UserProfile } from './types';
import { 
  getStoredExpenses, 
  saveStoredExpenses, 
  getStoredSettings, 
  saveStoredSettings,
  filterExpensesByProfile
} from './services/storageService';
import { syncParejaWithFirestore, mergeParejaExpenses, deleteExpenseFromFirestore } from './services/cloudSyncService';
import { Header } from './components/Header';
import { CurrencySummary } from './components/CurrencySummary';
import { ExpenseList } from './components/ExpenseList';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { MonthlyBreakdown } from './components/MonthlyBreakdown';
import { AddActionModal } from './components/AddActionModal';
import { ScannerModal } from './components/ScannerModal';
import { BatchScannerModal } from './components/BatchScannerModal';
import { ExpenseModal } from './components/ExpenseModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileSelectorModal } from './components/ProfileSelectorModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { formatMonthYear } from './utils/formatters';
import { Camera, PlusCircle, BookMarked, ShieldCheck, Layers } from 'lucide-react';

export const App: React.FC = () => {
  // Estados persistentes (filtrando cualquier residuo previo de sample-)
  const [expenses, setExpenses] = useState<Expense[]>(() => 
    getStoredExpenses().filter(e => !String(e.id || '').startsWith('sample-'))
  );
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());

  const currentProfile: UserProfile = settings.userProfile || 'Carlos';

  // Filtro de mes activo y persona activa
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedPerson, setSelectedPerson] = useState<Person | 'ALL'>('ALL');

  // Estados de Modales
  const [isAddActionModalOpen, setIsAddActionModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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

  // Sincronización automática de Pareja en la nube (Firestore) en segundo plano al iniciar
  useEffect(() => {
    if (settings.cloudSync?.enabled && settings.cloudSync?.firebaseProjectId) {
      const parejaList = expenses.filter(e => (e.persona || 'Pareja') === 'Pareja');
      syncParejaWithFirestore(parejaList, settings).then(res => {
        if (res.success && res.remoteExpenses) {
          setExpenses(prev => mergeParejaExpenses(prev, res.remoteExpenses!));
        }
      }).catch(err => console.warn('Sync background failed:', err));
    }
  }, [settings.cloudSync?.enabled, settings.cloudSync?.firebaseProjectId]);

  // Gastos visibles estrictamente permitidos para el perfil activo en este dispositivo
  // (Privacidad total: Carlos no ve los personales de Yuli, y viceversa)
  const visibleExpenses = useMemo(() => {
    return filterExpensesByProfile(expenses, currentProfile);
  }, [expenses, currentProfile]);

  // Lista única de meses disponibles (YYYY-MM) ordenados descendente
  const allMonths = useMemo(() => {
    const set = new Set<string>();
    // Incluir mes actual siempre
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    set.add(currentMonthKey);
    visibleExpenses.forEach(e => {
      if (e.fecha && e.fecha.length >= 7) {
        set.add(e.fecha.slice(0, 7));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [visibleExpenses]);

  // Gastos filtrados por el mes activo para resúmenes
  const expensesForCurrentFilter = useMemo(() => {
    if (selectedMonth === 'ALL') return visibleExpenses;
    return visibleExpenses.filter(e => e.fecha.startsWith(selectedMonth));
  }, [visibleExpenses, selectedMonth]);

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
    const nextExpenses = [...newExpenses, ...expenses];
    setExpenses(nextExpenses);
    if (newExpenses.some(e => (e.persona || 'Pareja') === 'Pareja')) {
      triggerParejaCloudSync(nextExpenses);
    }
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

  const triggerParejaCloudSync = (updatedExpenses: Expense[]) => {
    if (settings.cloudSync?.enabled && settings.cloudSync?.firebaseProjectId) {
      const parejaList = updatedExpenses.filter(e => (e.persona || 'Pareja') === 'Pareja');
      syncParejaWithFirestore(parejaList, settings).then(res => {
        if (res.success && res.remoteExpenses) {
          setExpenses(prev => mergeParejaExpenses(prev, res.remoteExpenses!));
        }
      }).catch(err => console.warn('Sync error:', err));
    }
  };

  const handleSelectProfile = (newProfile: UserProfile) => {
    const updated = { ...settings, userProfile: newProfile };
    setSettings(updated);
    saveStoredSettings(updated);
    setSelectedPerson('ALL');
  };

  // Guardar Gasto (nuevo o editado)
  const handleSaveExpense = (data: Omit<Expense, 'id' | 'creadoEn'> & { id?: string }) => {
    let nextExpenses: Expense[];
    if (data.id) {
      // Editar
      nextExpenses = expenses.map(item =>
        item.id === data.id
          ? {
              ...item,
              ...data,
              id: item.id,
              creadoEn: item.creadoEn
            }
          : item
      );
    } else {
      // Crear nuevo asiento contable
      const newExpense: Expense = {
        ...data,
        id: `gasto-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        creadoEn: new Date().toISOString()
      };
      nextExpenses = [newExpense, ...expenses];
    }
    setExpenses(nextExpenses);
    if ((data.persona || 'Pareja') === 'Pareja') {
      triggerParejaCloudSync(nextExpenses);
    }
  };

  // Eliminar Gasto
  const handleDeleteExpense = (id: string) => {
    if (confirm('¿Deseas eliminar este asiento de gasto?')) {
      const expToDelete = expenses.find(e => e.id === id);
      const nextExpenses = expenses.filter(e => e.id !== id);
      setExpenses(nextExpenses);
      if (expToDelete && (expToDelete.persona || 'Pareja') === 'Pareja') {
        deleteExpenseFromFirestore(id, settings);
      }
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
        onOpenAddModal={() => setIsAddActionModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
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
            userProfile={currentProfile}
            allMonths={allMonths}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
          />
        </section>

        {/* Distribución Principal: Libro Contable y Gráficas de Análisis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Columna Principal: Libro Diario de Gastos (7 columnas en escritorio) */}
          <section className="lg:col-span-7 xl:col-span-8 space-y-4">
            <ExpenseList
              expenses={visibleExpenses}
              allMonths={allMonths}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              selectedPerson={selectedPerson}
              onSelectPerson={setSelectedPerson}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
              onViewReceipt={(url, merchant) => setReceiptToView({ url, merchant })}
              userProfile={currentProfile}
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
          </aside>

        </div>

      </main>

      {/* Botón Flotante Móvil (+) para agregar gasto */}
      <div className="sm:hidden fixed bottom-6 right-5 z-40">
        <button
          onClick={() => setIsAddActionModalOpen(true)}
          className="w-14 h-14 rounded-full bg-forest-800 text-[#FAF6ED] flex items-center justify-center shadow-2xl border-2 border-forest-600 active:scale-95 hover:bg-forest-900 transition-all duration-150"
          title="Agregar nuevo gasto (+)"
        >
          <PlusCircle className="w-7 h-7 text-[#D8E6DE]" />
        </button>
      </div>

      {/* Pie de Página Contable */}
      <footer className="border-t border-ledger-border py-4 text-center text-xs text-ink-500 font-sans mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-serif text-ink-700 font-medium">
            <BookMarked className="w-3.5 h-3.5 text-forest-800" />
            <span>Mis Cuentas</span>
          </div>
        </div>
      </footer>

      {/* Modales */}
      <AddActionModal
        isOpen={isAddActionModalOpen}
        onClose={() => setIsAddActionModalOpen(false)}
        hasApiKey={Boolean(settings.geminiApiKey && settings.geminiApiKey.trim().length > 5)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectPhoto={(file) => handleStartScan(file)}
        onSelectBatch={(files) => handleStartBatchScan(files)}
        onSelectManual={handleOpenManualEntry}
      />

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
          setIsAddActionModalOpen(true);
        }}
      />

      <BatchScannerModal
        isOpen={isBatchScannerOpen}
        files={batchFilesForScan}
        settings={settings}
        userProfile={currentProfile}
        defaultPerson={selectedPerson !== 'ALL' && selectedPerson !== 'Carlos' && selectedPerson !== 'Yuli' ? selectedPerson : 'Pareja'}
        onClose={() => {
          setIsBatchScannerOpen(false);
          setBatchFilesForScan([]);
        }}
        onSaveBatch={handleSaveBatch}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        userProfile={currentProfile}
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
        onExpensesUpdated={setExpenses}
      />

      <ProfileSelectorModal
        isOpen={isProfileModalOpen}
        currentProfile={currentProfile}
        onClose={() => setIsProfileModalOpen(false)}
        onSelectProfile={handleSelectProfile}
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
