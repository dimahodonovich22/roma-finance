import Dexie, { type EntityTable } from 'dexie'
import type { Income, Expense, ReceiptImage, Salary, Reserve, Setting } from './types'

export const db = new Dexie('roma-finance') as Dexie & {
  incomes: EntityTable<Income, 'id'>
  expenses: EntityTable<Expense, 'id'>
  images: EntityTable<ReceiptImage, 'id'>
  salaries: EntityTable<Salary, 'id'>
  reserves: EntityTable<Reserve, 'id'>
  settings: EntityTable<Setting, 'key'>
}

db.version(1).stores({
  incomes: '++id, date, status',
  expenses: '++id, date, category',
  images: '++id, expenseId',
  salaries: '++id, period, status',
  reserves: '++id, month',
  settings: 'key',
})

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const row = await db.settings.get(key)
  return row?.value ?? fallback
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value })
}
