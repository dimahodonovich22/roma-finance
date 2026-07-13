import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSetting } from '../db'

export interface Totals {
  startingBalance: number
  receivedIncome: number // оплаченные доходы
  pendingIncome: number // ждёт оплаты (мне должны)
  totalExpenses: number
  paidSalaries: number
  owedSalaries: number // должен сотрудникам
  totalReserves: number // отложено
  onHand: number // на руках
  remaining: number // останется по факту
}

export function useTotals(): Totals | undefined {
  return useLiveQuery(async () => {
    const [incomes, expenses, salaries, reserves, startRaw] = await Promise.all([
      db.incomes.toArray(),
      db.expenses.toArray(),
      db.salaries.toArray(),
      db.reserves.toArray(),
      getSetting('startingBalance', '0'),
    ])

    const startingBalance = Number(startRaw) || 0
    const receivedIncome = incomes.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
    const pendingIncome = incomes.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const paidSalaries = salaries.filter((s) => s.status === 'paid').reduce((s2, x) => s2 + x.amount, 0)
    const owedSalaries = salaries.filter((s) => s.status === 'owed').reduce((s2, x) => s2 + x.amount, 0)
    const totalReserves = reserves.reduce((s, r) => s + r.amount, 0)

    const onHand = startingBalance + receivedIncome - totalExpenses - paidSalaries
    const remaining = onHand - owedSalaries - totalReserves

    return {
      startingBalance, receivedIncome, pendingIncome, totalExpenses,
      paidSalaries, owedSalaries, totalReserves, onHand, remaining,
    }
  })
}

export function useCurrency(): string {
  return useLiveQuery(() => getSetting('currency', 'zł'), [], 'zł') ?? 'zł'
}
