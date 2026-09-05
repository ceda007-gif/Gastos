import { Currency, ExpenseCategory } from '../types';

export function formatMoney(amount: number, currency: Currency): string {
  const formatted = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `$${formatted} ${currency}`;
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  // dateStr is expected YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export function formatDateHuman(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(monthKey: string): string {
  // monthKey format: '2026-03'
  try {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const text = new Intl.DateTimeFormat('es-MX', {
      month: 'long',
      year: 'numeric'
    }).format(date);
    return text.charAt(0).toUpperCase() + text.slice(1);
  } catch {
    return monthKey;
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const CATEGORY_BADGES: Record<ExpenseCategory, { bg: string; text: string; border: string }> = {
  Comida: { bg: 'bg-[#F4EFE6]', text: 'text-[#6B4E2B]', border: 'border-[#DECDB7]' },
  Transporte: { bg: 'bg-[#EEF3F0]', text: 'text-[#2D5A43]', border: 'border-[#BDD4C7]' },
  Gasolina: { bg: 'bg-[#F8EFE9]', text: 'text-[#8A4822]', border: 'border-[#E9C9B4]' },
  Compras: { bg: 'bg-[#F2EFF7]', text: 'text-[#564273]', border: 'border-[#D4C8E4]' },
  Servicios: { bg: 'bg-[#EBF1F5]', text: 'text-[#2E5874]', border: 'border-[#B8D1E2]' },
  Luz: { bg: 'bg-[#FDF6E4]', text: 'text-[#826117]', border: 'border-[#ECCFA1]' },
  Agua: { bg: 'bg-[#EBF5F6]', text: 'text-[#216773]', border: 'border-[#B2DBE0]' },
  Renta: { bg: 'bg-[#F0EEEB]', text: 'text-[#4A443E]', border: 'border-[#CBC4BC]' },
  Hospedaje: { bg: 'bg-[#F5EFF1]', text: 'text-[#7B3953]', border: 'border-[#DFC1CC]' },
  Entretenimiento: { bg: 'bg-[#F6EFEB]', text: 'text-[#7A4B3A]', border: 'border-[#DEBFB2]' },
  Otros: { bg: 'bg-[#F2F1EE]', text: 'text-[#5A5C59]', border: 'border-[#D0CFCB]' },
};
