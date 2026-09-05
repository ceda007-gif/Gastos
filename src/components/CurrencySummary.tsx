import React from 'react';
import { formatMoney } from '../utils/formatters';
import { Expense } from '../types';
import { Coins, Receipt, ArrowUpRight } from 'lucide-react';

interface CurrencySummaryProps {
  expenses: Expense[];
  selectedMonthLabel: string;
}

export const CurrencySummary: React.FC<CurrencySummaryProps> = ({
  expenses,
  selectedMonthLabel
}) => {
  const mxnExpenses = expenses.filter(e => e.moneda === 'MXN');
  const usdExpenses = expenses.filter(e => e.moneda === 'USD');

  const totalMXN = mxnExpenses.reduce((acc, curr) => acc + curr.total, 0);
  const totalUSD = usdExpenses.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Tarjeta Contable MXN */}
      <div className="bg-ledger-paper border border-ledger-border rounded-sm p-4 sm:p-5 relative overflow-hidden shadow-ledger-sm">
        <div className="flex items-center justify-between border-b border-ledger-rule pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-forest-100 text-forest-800 text-xs font-bold border border-forest-200">
              MXN
            </span>
            <span className="font-serif text-sm font-semibold text-ink-800">
              Gastos en Pesos Mexicanos
            </span>
          </div>
          <span className="text-xs text-ink-500 font-mono">
            {selectedMonthLabel}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-500 font-sans">
              Total Acumulado
            </p>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-0.5 tracking-tight">
              {formatMoney(totalMXN, 'MXN')}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs text-ink-500">
              <Receipt className="w-3.5 h-3.5" />
              <span>{mxnExpenses.length} {mxnExpenses.length === 1 ? 'asiento' : 'asientos'}</span>
            </span>
            {mxnExpenses.length > 0 && (
              <p className="text-[11px] text-ink-400 mt-0.5">
                Prom. {formatMoney(totalMXN / mxnExpenses.length, 'MXN')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tarjeta Contable USD */}
      <div className="bg-ledger-paper border border-ledger-border rounded-sm p-4 sm:p-5 relative overflow-hidden shadow-ledger-sm">
        <div className="flex items-center justify-between border-b border-ledger-rule pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-leather-100 text-leather-800 text-xs font-bold border border-leather-200">
              USD
            </span>
            <span className="font-serif text-sm font-semibold text-ink-800">
              Gastos en Dólares Estadounidenses
            </span>
          </div>
          <span className="text-xs text-ink-500 font-mono">
            {selectedMonthLabel}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-500 font-sans">
              Total Acumulado
            </p>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-leather-800 mt-0.5 tracking-tight">
              {formatMoney(totalUSD, 'USD')}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs text-ink-500">
              <Coins className="w-3.5 h-3.5" />
              <span>{usdExpenses.length} {usdExpenses.length === 1 ? 'asiento' : 'asientos'}</span>
            </span>
            {usdExpenses.length > 0 && (
              <p className="text-[11px] text-ink-400 mt-0.5">
                Prom. {formatMoney(totalUSD / usdExpenses.length, 'USD')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
