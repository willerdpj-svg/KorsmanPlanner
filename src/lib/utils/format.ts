import { format, parseISO } from 'date-fns'

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  try {
    return format(parseISO(date), 'dd/MM/yyyy')
  } catch {
    return date
  }
}

export function formatDateLong(date: string | null | undefined): string {
  if (!date) return '-'
  try {
    return format(parseISO(date), 'd MMM yyyy')
  } catch {
    return date
  }
}
