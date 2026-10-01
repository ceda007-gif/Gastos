import React, { useState } from 'react';
import { Expense, ExpenseCategory, Person, PERSONS, PaymentMethod, PAYMENT_METHODS, UserProfile } from '../types';
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
  FileText,
  User,
  CreditCard
} from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  allMonths: string[];
  selectedMonth: string; // 'ALL' or 'YYYY-MM'
  onSelectMonth: (month: string) => void;
  selectedPerson: Person | 'ALL';
  onSelectPerson: (person: Person | 'ALL') => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onViewReceipt: (photoUrl: string, merchant: string) => void;
  userProfile: UserProfile;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  allMonths,
  selectedMonth,
  onSelectMonth,
  selectedPerson,
  onSelectPerson,
  onEditExpense,
  onDeleteExpense,
  onViewReceipt,
  userProfile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');
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

      // Filtro por persona
      if (selectedPerson !== 'ALL') {
        const persona = expense.persona || 'Pareja';
        if (persona !== selectedPerson) {
          return false;
        }
      }

      // Filtro por método de pago
      if (selectedPaymentMethod !== 'ALL') {
        const metodo = expense.metodoPago || 'Efectivo';
        if (metodo !== selectedPaymentMethod) {
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
        const matchPersona = (expense.persona || '').toLowerCase().includes(query);
        const matchMetodo = (expense.metodoPago || '').toLowerCase().includes(query);
        const matchDigitos = (expense.ultimos4Digitos || '').includes(query);
        const matchMonto = expense.total.toString().includes(query);
        return matchComercio || matchNotas || matchCategoria || matchPersona || matchMetodo || matchDigitos || matchMonto;
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
      <div className="p-3 sm:p-4 border-b border-ledger-border bg-ledger-header/60 flex flex-col gap-3">
        
        {/* Título de sección y selector rápido de cuenta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-forest-800" />
            <h2 className="font-serif text-lg font-bold text-ink-900 tracking-tight">
              Libro Diario de Gastos
            </h2>
            <span className="text-xs font-mono bg-ledger-card text-ink-700 px-2 py-0.5 rounded-sm border border-ledger-border">
              {filteredExpenses.length} {filteredExpenses.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {/* Selector de persona en la lista según el perfil */}
          <div className="flex items-center gap-1 bg-ledger-card p-1 rounded-sm border border-ledger-border text-xs">
            <button
              onClick={() => onSelectPerson('ALL')}
              className={`px-2 py-1 rounded-xs font-medium transition-colors ${
                selectedPerson === 'ALL'
                  ? 'bg-forest-800 text-white shadow-xs'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              {userProfile === 'Todos' ? 'Todos' : 'Todos mis gastos'}
            </button>
            {(userProfile === 'Carlos' 
              ? (['Carlos', 'Pareja'] as Person[]) 
              : userProfile === 'Yuli' 
              ? (['Yuli', 'Pareja'] as Person[]) 
              : PERSONS
            ).map(p => (
              <button
                key={p}
                onClick={() => onSelectPerson(p)}
                className={`px-2 py-1 rounded-xs font-medium transition-colors ${
                  selectedPerson === p
                    ? p === 'Pareja' ? 'bg-forest-800 text-white shadow-xs' : 'bg-leather-700 text-white shadow-xs'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                {p === 'Yuli' ? '🌸 Yuli' : p === 'Carlos' ? '💼 Carlos' : '👫 Pareja'}
              </button>
            ))}
          </div>
        </div>

        {/* Fila de Controles de filtro secundarios */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Selector de Mes */}
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 text-ink-500 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-xs bg-ledger-paper border border-ledger-border rounded-sm text-ink-800 focus:outline-none focus:border-forest-700 font-medium cursor-pointer"
            >
              <option value="ALL">Todos los meses</option>
              {allMonths.map(monthKey => (
                <option key={monthKey} value={monthKey}>
                  {formatMonthYear(monthKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Método de Pago */}
          <div className="relative flex items-center">
            <CreditCard className="w-3.5 h-3.5 absolute left-2.5 text-ink-500 pointer-events-none" />
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-xs bg-ledger-paper border border-ledger-border rounded-sm text-ink-800 focus:outline-none focus:border-forest-700 font-medium cursor-pointer"
            >
              <option value="ALL">Todos los métodos</option>
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Buscador */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar comercio, notas, tarjeta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-ledger-paper border border-ledger-border rounded-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-forest-700"
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

          {/* Renglones estilo libro contable */}
          {filteredExpenses.map((expense) => {
            const badge = CATEGORY_BADGES[expense.categoria] || CATEGORY_BADGES['Otros'];
            return (
              <div
                key={expense.id}
                className="grid grid-cols-12 px-3 sm:px-4 py-2.5 items-center hover:bg-forest-50/40 transition-colors group border-b border-ledger-rule/60 text-xs sm:text-sm"
              >
                {/* Columna Fecha */}
                <div className="col-span-3 sm:col-span-2 flex flex-col">
                  <span className="font-mono text-xs font-semibold text-ink-900">
                    {expense.fecha}
                  </span>
                  <span className="text-[10px] text-ink-400 capitalize truncate hidden sm:block">
                    {formatDateHuman(expense.fecha)}
                  </span>
                </div>

                {/* Columna Comercio / Detalle */}
                <div className="col-span-5 sm:col-span-5 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-serif font-bold text-ink-900 text-xs sm:text-sm">
                      {expense.comercio}
                    </span>
                    {expense.origen === 'escaneo_ia' && (
                      <span title="Leído automáticamente con IA" className="text-forest-700 inline-flex">
                        <Sparkles className="w-3 h-3" />
                      </span>
                    )}
                    {expense.fotoRecibo && (
                      <button
                        onClick={() => onViewReceipt(expense.fotoRecibo!, expense.comercio)}
                        title="Ver foto del ticket"
                        className="text-leather-600 hover:text-leather-800 inline-flex"
                      >
                        <ImageIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Notas y subtítulo contable continuo */}
                  <div className="text-[11px] text-ink-600 flex items-center gap-2 mt-0.5 truncate">
                    <span className="font-medium text-forest-900">
                      {(expense.persona || 'Pareja') === 'Yuli' ? '🌸 Yuli' :
                       (expense.persona || 'Pareja') === 'Carlos' ? '💼 Carlos' : '👫 Pareja'}
                    </span>
                    <span>•</span>
                    <span className="text-ink-600 font-sans">
                      {(expense.metodoPago || 'Efectivo') === 'Efectivo' ? 'Efectivo' :
                       expense.metodoPago === 'Tarjeta de Crédito' ? `T. Crédito ${expense.ultimos4Digitos ? `(${expense.ultimos4Digitos})` : ''}` :
                       expense.metodoPago === 'Tarjeta de Débito' ? `T. Débito ${expense.ultimos4Digitos ? `(${expense.ultimos4Digitos})` : ''}` :
                       'Transferencia'}
                    </span>
                    {expense.notas && (
                      <>
                        <span>•</span>
                        <span className="text-ink-400 italic truncate">{expense.notas}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Columna Categoría */}
                <div className="hidden sm:block sm:col-span-2">
                  <span className={`inline-block text-[11px] px-2 py-0.5 rounded-xs border font-medium ${badge.bg} ${badge.text} ${badge.border}`}>
                    {expense.categoria}
                  </span>
                </div>

                {/* Columna Monto & Acciones */}
                <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-2 text-right">
                  <span className={`font-serif font-bold text-xs sm:text-sm tracking-tight ${expense.moneda === 'USD' ? 'text-leather-800' : 'text-forest-900'}`}>
                    {formatMoney(expense.total, expense.moneda)}
                  </span>

                  {/* Botones de acción */}
                  <div className="flex items-center gap-0.5 pl-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditExpense(expense)}
                      className="p-1 rounded text-ink-400 hover:text-forest-800 hover:bg-forest-100 transition-colors"
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
