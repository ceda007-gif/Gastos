import React, { useState } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { formatMoney, formatDateHuman, CATEGORY_BADGES, formatMonthYear } from '../utils/formatters';
import { 
  Calendar, 
  Search, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  Sparkles, 
  Filter, 
  ArrowUpDown,
  FileText
} from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  allMonths: string[];
  selectedMonth: string; // 'ALL' or 'YYYY-MM'
  onSelectMonth: (month: string) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onViewReceipt: (photoUrl: string, merchant: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  allMonths,
  selectedMonth,
  onSelectMonth,
  onEditExpense,
  onDeleteExpense,
  onViewReceipt
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filtrado
  const filteredExpenses = expenses
    .filter(expense => {
      // Filtro por mes
      if (selectedMonth !== 'ALL') {
        if (!expense.fecha.startsWith(selectedMonth)) {
          return false;
        }
      }

      // Filtro por categoría
      if (selectedCategory !== 'ALL' && expense.categoria !== selectedCategory) {
        return false;
      }

      // Filtro por búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchComercio = expense.comercio.toLowerCase().includes(query);
        const matchNotas = expense.notas ? expense.notas.toLowerCase().includes(query) : false;
        const matchCategoria = expense.categoria.toLowerCase().includes(query);
        const matchMonto = expense.total.toString().includes(query);
        return matchComercio || matchNotas || matchCategoria || matchMonto;
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="bg-ledger-paper border border-ledger-border rounded-sm shadow-ledger">
      
      {/* Barra de Filtros y Búsqueda */}
      <div className="p-3 sm:p-4 border-b border-ledger-border bg-ledger-header/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Título de sección */}
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-forest-800" />
          <h2 className="font-serif text-lg font-bold text-ink-900 tracking-tight">
            Libro Diario de Gastos
          </h2>
          <span className="text-xs font-mono bg-ledger-card text-ink-700 px-2 py-0.5 rounded-sm border border-ledger-border">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {/* Controles de filtro */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Selector de Mes */}
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 text-ink-500 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-xs sm:text-sm bg-ledger-paper border border-ledger-border rounded-sm text-ink-800 focus:outline-none focus:border-forest-700 font-medium cursor-pointer"
            >
              <option value="ALL">Todos los meses</option>
              {allMonths.map(monthKey => (
                <option key={monthKey} value={monthKey}>
                  {formatMonthYear(monthKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Buscador */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar comercio o nota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-ledger-paper border border-ledger-border rounded-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-forest-700"
            />
          </div>

          {/* Orden fecha */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-ledger-paper border border-ledger-border rounded-sm text-ink-700 hover:bg-ledger-rule"
            title={sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguos primero'}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-ink-500" />
            <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Recientes' : 'Antiguos'}</span>
          </button>
        </div>

      </div>

      {/* Lista / Renglones Contables */}
      {filteredExpenses.length === 0 ? (
        <div className="p-10 text-center text-ink-500">
          <p className="font-serif text-lg text-ink-700 mb-1">Sin asientos contables en este criterio</p>
          <p className="text-xs text-ink-500 max-w-sm mx-auto">
            Puedes cambiar el filtro de mes, ajustar la búsqueda o registrar un nuevo gasto tomando una foto de tu ticket.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-ledger-rule overflow-x-auto">
          {/* Encabezado tipo renglón de libro contable */}
          <div className="grid grid-cols-12 px-4 py-2 text-[11px] uppercase tracking-wider text-ink-500 font-medium bg-ledger-card/40">
            <div className="col-span-3 sm:col-span-2">Fecha</div>
            <div className="col-span-5 sm:col-span-4">Comercio / Detalle</div>
            <div className="hidden sm:block sm:col-span-3">Categoría</div>
            <div className="col-span-4 sm:col-span-3 text-right">Monto & Acciones</div>
          </div>

          {/* Renglones */}
          {filteredExpenses.map((expense) => {
            const badge = CATEGORY_BADGES[expense.categoria] || CATEGORY_BADGES['Otros'];
            return (
              <div
                key={expense.id}
                className="grid grid-cols-12 px-4 py-3 items-center hover:bg-[#FAF7EE] transition-colors group text-sm"
              >
                {/* Columna Fecha */}
                <div className="col-span-3 sm:col-span-2 flex flex-col">
                  <span className="font-mono text-xs font-semibold text-ink-800">
                    {expense.fecha}
                  </span>
                  <span className="text-[11px] text-ink-400 capitalize truncate hidden sm:block">
                    {formatDateHuman(expense.fecha)}
                  </span>
                </div>

                {/* Columna Comercio / Detalle */}
                <div className="col-span-5 sm:col-span-4 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-semibold text-ink-900 truncate">
                      {expense.comercio}
                    </span>
                    {expense.origen === 'escaneo_ia' && (
                      <span title="Leído automáticamente con IA" className="shrink-0 text-forest-700">
                        <Sparkles className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {expense.fotoRecibo && (
                      <button
                        onClick={() => onViewReceipt(expense.fotoRecibo!, expense.comercio)}
                        title="Ver foto del ticket"
                        className="shrink-0 text-leather-600 hover:text-leather-800"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {expense.notas && (
                    <p className="text-xs text-ink-500 truncate mt-0.5">
                      {expense.notas}
                    </p>
                  )}
                  {/* Badge de categoría visible en móviles */}
                  <div className="sm:hidden mt-1">
                    <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded-xs border font-medium ${badge.bg} ${badge.text} ${badge.border}`}>
                      {expense.categoria}
                    </span>
                  </div>
                </div>

                {/* Columna Categoría (escritorio) */}
                <div className="hidden sm:block sm:col-span-3">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-sm border font-medium ${badge.bg} ${badge.text} ${badge.border}`}>
                    {expense.categoria}
                  </span>
                </div>

                {/* Columna Monto & Acciones */}
                <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-2 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`font-serif font-bold text-sm sm:text-base ${expense.moneda === 'USD' ? 'text-leather-800' : 'text-forest-900'}`}>
                      {formatMoney(expense.total, expense.moneda)}
                    </span>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center gap-1 pl-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditExpense(expense)}
                      className="p-1 rounded text-ink-400 hover:text-forest-800 hover:bg-forest-50 transition-colors"
                      title="Editar este gasto"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteExpense(expense.id)}
                      className="p-1 rounded text-ink-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                      title="Eliminar este gasto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
