import React, { useState } from 'react';
import { Currency, Expense } from '../types';
import { formatMoney, CATEGORY_BADGES } from '../utils/formatters';
import { PieChart } from 'lucide-react';

interface CategoryBreakdownProps {
  expenses: Expense[];
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ expenses }) => {
  // Moneda activa para el desglose (evita mezclar MXN y USD)
  const hasUSD = expenses.some(e => e.moneda === 'USD');
  const hasMXN = expenses.some(e => e.moneda === 'MXN');

  const [activeCurrency, setActiveCurrency] = useState<Currency>(hasMXN ? 'MXN' : 'USD');

  // Filtrar gastos por la moneda seleccionada
  const currencyExpenses = expenses.filter(e => e.moneda === activeCurrency);
  const totalCurrency = currencyExpenses.reduce((acc, curr) => acc + curr.total, 0);

  // Agrupar por categoría
  const categoryTotals = currencyExpenses.reduce<Record<string, { total: number; count: number }>>((acc, curr) => {
    if (!acc[curr.categoria]) {
      acc[curr.categoria] = { total: 0, count: 0 };
    }
    acc[curr.categoria].total += curr.total;
    acc[curr.categoria].count += 1;
    return acc;
  }, {});

  // Convertir a lista y ordenar de mayor a menor
  const sortedCategories = Object.entries(categoryTotals)
    .map(([categoria, data]) => ({
      categoria,
      total: data.total,
      count: data.count,
      percentage: totalCurrency > 0 ? (data.total / totalCurrency) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="bg-ledger-paper border border-ledger-border rounded-sm shadow-ledger p-4 sm:p-5">
      {/* Encabezado con selector de moneda si aplica */}
      <div className="flex items-center justify-between border-b border-ledger-rule pb-3 mb-4">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-forest-800" />
          <h3 className="font-serif text-base font-bold text-ink-900">
            Desglose por Categoría
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

      {sortedCategories.length === 0 ? (
        <div className="py-8 text-center text-ink-500 text-xs">
          No hay gastos registrados en {activeCurrency} en este periodo.
        </div>
      ) : (
        <div className="space-y-3.5">
          {sortedCategories.map(cat => {
            const badge = CATEGORY_BADGES[cat.categoria as any] || CATEGORY_BADGES['Otros'];
            return (
              <div key={cat.categoria} className="group">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-xs border font-medium text-[11px] ${badge.bg} ${badge.text} ${badge.border}`}>
                      {cat.categoria}
                    </span>
                    <span className="text-ink-500 text-[11px]">
                      ({cat.count} {cat.count === 1 ? 'gasto' : 'gastos'})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-serif font-bold text-ink-900 mr-2">
                      {formatMoney(cat.total, activeCurrency)}
                    </span>
                    <span className="text-xs text-ink-500 font-mono inline-block w-12 text-right">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Barra proporcional contable */}
                <div className="w-full bg-[#EAE4D7] h-2.5 rounded-xs overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      activeCurrency === 'MXN' ? 'bg-forest-700' : 'bg-leather-600'
                    }`}
                    style={{ width: `${Math.max(cat.percentage, 2)}%` }}
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
