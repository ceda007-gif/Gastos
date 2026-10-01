import React from 'react';
import { formatMoney, formatMonthYear } from '../utils/formatters';
import { Expense, Person, PERSONS, PaymentMethod, PAYMENT_METHODS, UserProfile } from '../types';
import { Coins, Receipt, User, CreditCard, Wallet, ArrowRightLeft, Calendar } from 'lucide-react';

interface CurrencySummaryProps {
  expenses: Expense[];
  selectedMonthLabel: string;
  selectedPerson: Person | 'ALL';
  onSelectPerson: (person: Person | 'ALL') => void;
  userProfile: UserProfile;
  allMonths: string[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

export const CurrencySummary: React.FC<CurrencySummaryProps> = ({
  expenses,
  selectedMonthLabel,
  selectedPerson,
  onSelectPerson,
  userProfile,
  allMonths,
  selectedMonth,
  onSelectMonth
}) => {
  const allMxnExpenses = expenses.filter(e => e.moneda === 'MXN');
  const allUsdExpenses = expenses.filter(e => e.moneda === 'USD');

  // Si se seleccionó una cuenta en particular (ej. Carlos o Pareja), filtrar las tarjetas de abajo
  const mxnExpenses = selectedPerson === 'ALL'
    ? allMxnExpenses
    : allMxnExpenses.filter(e => (e.persona || 'Pareja') === selectedPerson);

  const usdExpenses = selectedPerson === 'ALL'
    ? allUsdExpenses
    : allUsdExpenses.filter(e => (e.persona || 'Pareja') === selectedPerson);

  const totalMXN = mxnExpenses.reduce((acc, curr) => acc + curr.total, 0);
  const totalUSD = usdExpenses.reduce((acc, curr) => acc + curr.total, 0);

  const totalAllMXN = allMxnExpenses.reduce((acc, curr) => acc + curr.total, 0);

  // Determinar qué personas están disponibles según el perfil activo
  const availablePersons: Person[] = userProfile === 'Carlos'
    ? ['Carlos', 'Pareja']
    : userProfile === 'Yuli'
    ? ['Yuli', 'Pareja']
    : ['Carlos', 'Yuli', 'Pareja'];

  // Totales por Persona (en MXN) para los botones superiores
  const personTotals = availablePersons.map(p => {
    const list = allMxnExpenses.filter(e => (e.persona || 'Pareja') === p);
    const sum = list.reduce((acc, e) => acc + e.total, 0);
    return {
      person: p,
      total: sum,
      count: list.length,
      percentage: totalAllMXN > 0 ? (sum / totalAllMXN) * 100 : 0
    };
  });

  // Totales por Método de Pago (en MXN)
  const cashExpenses = mxnExpenses.filter(e => (e.metodoPago || 'Efectivo') === 'Efectivo');
  const creditExpenses = mxnExpenses.filter(e => e.metodoPago === 'Tarjeta de Crédito');
  const debitExpenses = mxnExpenses.filter(e => e.metodoPago === 'Tarjeta de Débito');
  const transferExpenses = mxnExpenses.filter(e => e.metodoPago === 'Transferencia');

  const totalCash = cashExpenses.reduce((acc, e) => acc + e.total, 0);
  const totalCredit = creditExpenses.reduce((acc, e) => acc + e.total, 0);
  const totalDebit = debitExpenses.reduce((acc, e) => acc + e.total, 0);
  const totalTransfer = transferExpenses.reduce((acc, e) => acc + e.total, 0);

  return (
    <div className="space-y-4">
      
      {/* Selector de Cuentas y Selector Superior de Mes */}
      <div className="bg-ledger-paper border border-ledger-border rounded-sm p-3 shadow-ledger-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-ledger-rule">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-800 uppercase tracking-wider">
            <User className="w-3.5 h-3.5 text-leather-700" />
            <span>
              {userProfile === 'Carlos' 
                ? 'Libreta de Carlos & Pareja' 
                : userProfile === 'Yuli' 
                ? 'Libreta de Yuli & Pareja' 
                : 'Cuentas Familiares'}
            </span>
          </div>

          {/* Selector de Mes en la parte superior */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-500 font-medium hidden sm:inline">Período:</span>
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 absolute left-2 text-forest-800 pointer-events-none" />
              <select
                value={selectedMonth}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="pl-7 pr-6 py-1 text-xs bg-ledger-card border border-ledger-border rounded-sm text-ink-900 font-semibold focus:outline-none focus:border-forest-700 cursor-pointer shadow-2xs hover:bg-ledger-rule transition-colors"
                title="Selecciona el mes a consultar"
              >
                <option value="ALL">Todos los meses</option>
                {allMonths.map(m => (
                  <option key={m} value={m}>
                    {formatMonthYear(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={`grid gap-2 ${
          availablePersons.length === 2 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
        }`}>
          {/* Botón Todos */}
          <button
            onClick={() => onSelectPerson('ALL')}
            className={`p-2.5 rounded-sm border text-left transition-all ${
              selectedPerson === 'ALL'
                ? 'bg-forest-800 text-[#FAF6ED] border-forest-900 shadow-sm'
                : 'bg-ledger-card border-ledger-border text-ink-800 hover:bg-ledger-rule'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">
                {userProfile === 'Todos' ? '👥 Todas las Cuentas' : '📊 Todos mis gastos'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-xs font-mono font-bold ${
                selectedPerson === 'ALL' ? 'bg-forest-900 text-forest-100' : 'bg-ledger-rule text-ink-700'
              }`}>
                {allMxnExpenses.length}
              </span>
            </div>
            <p className={`text-base font-serif font-bold mt-1 ${
              selectedPerson === 'ALL' ? 'text-white' : 'text-forest-900'
            }`}>
              {formatMoney(totalAllMXN, 'MXN')}
            </p>
          </button>

          {/* Botones individuales limpios (sin Privado ni Nube) */}
          {personTotals.map(({ person, total, count, percentage }) => {
            const isSelected = selectedPerson === person;
            const isPareja = person === 'Pareja';
            const label = isPareja 
              ? '👫 Pareja' 
              : person === 'Carlos' 
              ? '💼 Carlos' 
              : '🌸 Yuli';
            
            return (
              <button
                key={person}
                onClick={() => onSelectPerson(person)}
                className={`p-2.5 rounded-sm border text-left transition-all ${
                  isSelected
                    ? isPareja 
                      ? 'bg-forest-800 text-[#FAF6ED] border-forest-900 shadow-sm'
                      : 'bg-leather-700 text-[#FAF6ED] border-leather-800 shadow-sm'
                    : 'bg-ledger-card border-ledger-border text-ink-800 hover:bg-ledger-rule'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-xs font-mono font-bold shrink-0 ${
                    isSelected ? 'bg-black/20 text-white' : 'bg-ledger-rule text-ink-700'
                  }`}>
                    {count}
                  </span>
                </div>
                <p className={`text-base font-serif font-bold mt-1 ${
                  isSelected ? 'text-white' : 'text-ink-900'
                }`}>
                  {formatMoney(total, 'MXN')}
                </p>
                <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-white/80' : 'text-ink-500'}`}>
                  {isPareja 
                    ? 'Gastos compartidos'
                    : `${percentage.toFixed(0)}% del total`}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tarjetas Principales de Moneda y Métodos de Pago */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Tarjeta Contable MXN (Principal) */}
        <div className="lg:col-span-8 bg-ledger-paper border border-ledger-border rounded-sm p-4 sm:p-5 relative overflow-hidden shadow-ledger-sm">
          <div className="flex items-center justify-between border-b border-ledger-rule pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-forest-100 text-forest-800 text-xs font-bold border border-forest-200">
                MXN
              </span>
              <span className="font-serif text-sm font-semibold text-ink-800">
                Gastos en Pesos Mexicanos
              </span>
              {selectedPerson !== 'ALL' && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-xs bg-leather-100 text-leather-800 border border-leather-200">
                  {selectedPerson}
                </span>
              )}
            </div>
            <span className="text-xs text-ink-500 font-mono">
              {selectedMonthLabel}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-500 font-sans">
                Total Acumulado
              </p>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-0.5 tracking-tight">
                {formatMoney(totalMXN, 'MXN')}
              </p>
            </div>
            <div className="sm:text-right">
              <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                <Receipt className="w-3.5 h-3.5" />
                <span>{mxnExpenses.length} {mxnExpenses.length === 1 ? 'asiento' : 'asientos'}</span>
              </span>
              {mxnExpenses.length > 0 && (
                <p className="text-[11px] text-ink-400 mt-0.5">
                  Promedio: {formatMoney(totalMXN / mxnExpenses.length, 'MXN')}
                </p>
              )}
            </div>
          </div>

          {/* Desglose por Método de Pago en Renglones */}
          <div className="pt-3 border-t border-ledger-rule">
            <p className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-forest-700" />
              <span>Desglose por Método de Pago</span>
            </p>

            <div className="divide-y divide-ledger-rule/60 text-xs">
              <div className="py-1.5 flex items-center justify-between hover:bg-ledger-card/50 px-2 rounded-xs transition-colors">
                <span className="text-ink-800 font-medium flex items-center gap-2">
                  <span>💵</span>
                  <span>Efectivo</span>
                  {cashExpenses.length > 0 && (
                    <span className="text-[10px] text-ink-400 font-mono">({cashExpenses.length})</span>
                  )}
                </span>
                <span className="font-serif font-bold text-sm text-ink-900">
                  {formatMoney(totalCash, 'MXN')}
                </span>
              </div>

              <div className="py-1.5 flex items-center justify-between hover:bg-ledger-card/50 px-2 rounded-xs transition-colors">
                <span className="text-ink-800 font-medium flex items-center gap-2">
                  <span>💳</span>
                  <span>T. Crédito</span>
                  {creditExpenses.length > 0 && (
                    <span className="text-[10px] text-ink-400 font-mono">({creditExpenses.length})</span>
                  )}
                </span>
                <span className="font-serif font-bold text-sm text-forest-800">
                  {formatMoney(totalCredit, 'MXN')}
                </span>
              </div>

              <div className="py-1.5 flex items-center justify-between hover:bg-ledger-card/50 px-2 rounded-xs transition-colors">
                <span className="text-ink-800 font-medium flex items-center gap-2">
                  <span>💳</span>
                  <span>T. Débito</span>
                  {debitExpenses.length > 0 && (
                    <span className="text-[10px] text-ink-400 font-mono">({debitExpenses.length})</span>
                  )}
                </span>
                <span className="font-serif font-bold text-sm text-ink-900">
                  {formatMoney(totalDebit, 'MXN')}
                </span>
              </div>

              <div className="py-1.5 flex items-center justify-between hover:bg-ledger-card/50 px-2 rounded-xs transition-colors">
                <span className="text-ink-800 font-medium flex items-center gap-2">
                  <span>📱</span>
                  <span>Transferencia</span>
                  {transferExpenses.length > 0 && (
                    <span className="text-[10px] text-ink-400 font-mono">({transferExpenses.length})</span>
                  )}
                </span>
                <span className="font-serif font-bold text-sm text-ink-900">
                  {formatMoney(totalTransfer, 'MXN')}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Tarjeta Contable USD */}
        <div className="lg:col-span-4 bg-ledger-paper border border-ledger-border rounded-sm p-4 sm:p-5 relative overflow-hidden shadow-ledger-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-ledger-rule pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-leather-100 text-leather-800 text-xs font-bold border border-leather-200">
                  USD
                </span>
                <span className="font-serif text-sm font-semibold text-ink-800">
                  Gastos en Dólares
                </span>
              </div>
              <span className="text-xs text-ink-500 font-mono">
                {selectedMonthLabel}
              </span>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-ink-500 font-sans">
                Total Acumulado
              </p>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-leather-800 mt-0.5 tracking-tight">
                {formatMoney(totalUSD, 'USD')}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-ledger-rule mt-4 flex items-center justify-between text-xs text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-leather-600" />
              <span>{usdExpenses.length} {usdExpenses.length === 1 ? 'asiento' : 'asientos'}</span>
            </span>
            {usdExpenses.length > 0 && (
              <span>Prom. {formatMoney(totalUSD / usdExpenses.length, 'USD')}</span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

