export type IncomeStatus = 'pending' | 'paid'
export type SalaryStatus = 'owed' | 'paid'
export type PaymentMethod = 'card' | 'cash'

export interface Income {
  id?: number
  title: string // от кого / за что
  amount: number
  date: string // ISO YYYY-MM-DD — дата выставления фактуры
  status: IncomeStatus
  paidDate?: string
  note?: string
  paymentMethod?: PaymentMethod // как платят: на карту (по умолчанию) или кэшом
  cashPercent?: number // процент, вычитаемый из кэша (0–100)
}

export interface Expense {
  id?: number
  title: string
  amount: number
  date: string
  category?: string
  note?: string
}

export interface ReceiptImage {
  id?: number
  expenseId: number
  blob: Blob
}

export interface Salary {
  id?: number
  employee: string
  amount: number
  period: string // 'YYYY-MM' — за какой месяц
  status: SalaryStatus
  paidDate?: string
}

export interface Reserve {
  id?: number
  month: string // 'YYYY-MM'
  amount: number
  note?: string
}

export interface Setting {
  key: string
  value: string
}

export const EXPENSE_CATEGORIES = [
  'Покупка',
  'Оплата услуг',
  'Материалы',
  'Транспорт',
  'Офис',
  'Другое',
] as const
