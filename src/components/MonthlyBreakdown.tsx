import React, { useState } from 'react';
import { Currency, Expense } from '../types';
import { formatMoney, formatMonthYear } from '../utils/formatters';
import { BarChart3 } from 'lucide-react';

interface MonthlyBreakdownProps {
  expenses: Expense[];
  onSelectMonth?: (monthKey: string) => void;
}

export const MonthlyBreakdown: React.FC<MonthlyBreakdownProps> = ({
  expenses,
  onSelectMonth
}) => {
  const hasUSD = expenses.some(e => e.moneda === 'USD');
  const hasMXN = expenses.some(e => e.moneda === 'MXN');

  const [activeCurrency, setActiveCurrency] = useState<Currency>(hasMXN ? 'MXN' : 'USD');

  const currencyExpenses = expenses.filter(e => e.moneda === activeCurrency);

  // Agrupar por mes (YYYY-MM)
  const monthlyTotals = currencyExpenses.reduce<Record<string, { total: number; count: number }>>((acc, curr) => {
    const monthKey = curr.fecha.slice(0, 7); // '2026-03'
    if (!acc[monthKey]) {
      acc[monthKey] = { total: 0, count: 0 };
    }
    acc[monthKey].total += curr.total;
    acc[monthKey].count += 1;
    return acc;
  }, {});

  // Ordenar cronológicamente descendente (mes más reciente primero)
  const sortedMonths = Object.entries(monthlyTotals)
    .map(([monthKey, data]) => ({
      monthKey,
      label: formatMonthYear(monthKey),
      total: data.total,
      count: data.count
    }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  // El mes con mayor gasto sirve de referencia al 100% para la escala de barras
  const maxMonthTotal = sortedMonths.reduce((max, m) => Math.max(max, m.total), 0);

  return (
    <div className="bg-ledger-paper border border-ledger-border rounded-sm shadow-ledger p-4 sm:p-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-ledger-rule pb-3 mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-forest-800" />
          <h3 className="font-serif text-base font-bold text-ink-900">
            Desglose por Mes
          </h3>
        </div>

        {/* Selector de divisa */}
        <div className="flex items-center gap-1 bg-ledger-card p-0.5 rounded-sm border border-ledger-border">
          <button
            onClick={() => setActiveCurrency('MXN')}
            className={`px-2.5 py-0.5 text-xs font-medium rounded-xs transition-colors ${
              activeCurrency === 'MXN'
                ? 'bg-forest-800 text-[#FAF6ED] shadow-xs'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            MXN
          </button>
          <button
            onClick={() => setActiveCurrency('USD')}
            className={`px-2.5 py-0.5 text-xs font-medium rounded-xs transition-colors ${
              activeCurrency === 'USD'
                ? 'bg-leather-700 text-[#FAF6ED] shadow-xs'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            USD
          </button>
        </div>
      </div>

      {sortedMonths.length === 0 ? (
        <div className="py-8 text-center text-ink-500 text-xs">
          No hay registros mensuales en {activeCurrency}.
        </div>
      ) : (
        <div className="space-y-3.5">
          {sortedMonths.map(month => {
            const barWidthPercentage = maxMonthTotal > 0 ? (month.total / maxMonthTotal) * 100 : 0;

            return (
              <div
                key={month.monthKey}
                onClick={() => onSelectMonth && onSelectMonth(month.monthKey)}
                className="group cursor-pointer p-1.5 -mx-1.5 rounded-xs hover:bg-[#FAF7EE] transition-colors"
                title={`Ver detalles de ${month.label}`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-semibold text-ink-800 text-xs sm:text-sm">
                      {month.label}
                    </span>
                    <span className="text-[11px] text-ink-500">
                      ({month.count} {month.count === 1 ? 'gasto' : 'gastos'})
                    </span>
                  </div>
                  <span className="font-serif font-bold text-ink-900">
                    {formatMoney(month.total, activeCurrency)}
                  </span>
                </div>

                {/* Barra proporcional */}
                <div className="w-full bg-[#EAE4D7] h-2.5 rounded-xs overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      activeCurrency === 'MXN' ? 'bg-forest-800' : 'bg-leather-700'
                    }`}
                    style={{ width: `${Math.max(barWidthPercentage, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
