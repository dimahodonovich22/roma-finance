import type { Income } from '../types'

const numFmt = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Чистая сумма дохода к получению: для кэша вычитаем указанный процент */
export function incomeNet(income: Pick<Income, 'amount' | 'paymentMethod' | 'cashPercent'>): number {
  if (income.paymentMethod === 'cash' && income.cashPercent) {
    const pct = Math.min(Math.max(income.cashPercent, 0), 100)
    return income.amount * (1 - pct / 100)
  }
  return income.amount
}

export function formatMoney(amount: number, currency: string): string {
  return `${numFmt.format(amount)} ${currency}`
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

/** 'YYYY-MM' → 'Июнь 2025' */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-')
  const idx = Number(m) - 1
  return MONTHS[idx] ? `${MONTHS[idx]} ${y}` : ym
}

export function todayISO(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function currentMonth(): string {
  return todayISO().slice(0, 7)
}

/** Парсинг суммы из инпута: допускает запятую и пробелы */
export function parseAmount(raw: string): number {
  const n = Number(raw.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : NaN
}
