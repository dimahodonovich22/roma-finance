import { db } from '../db'
import { blobToBase64, base64ToBlob } from './images'
import type { Income, Expense, Salary, Reserve, Setting } from '../types'

interface BackupImage {
  id?: number
  expenseId: number
  data: string // base64 data-url
}

interface BackupFile {
  app: 'roma-finance'
  version: 1
  exportedAt: string
  incomes: Income[]
  expenses: Expense[]
  images: BackupImage[]
  salaries: Salary[]
  reserves: Reserve[]
  settings: Setting[]
}

export async function exportBackup(): Promise<void> {
  const [incomes, expenses, rawImages, salaries, reserves, settings] = await Promise.all([
    db.incomes.toArray(),
    db.expenses.toArray(),
    db.images.toArray(),
    db.salaries.toArray(),
    db.reserves.toArray(),
    db.settings.toArray(),
  ])

  const images: BackupImage[] = []
  for (const img of rawImages) {
    images.push({ id: img.id, expenseId: img.expenseId, data: await blobToBase64(img.blob) })
  }

  const backup: BackupFile = {
    app: 'roma-finance',
    version: 1,
    exportedAt: new Date().toISOString(),
    incomes, expenses, images, salaries, reserves, settings,
  }

  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Полностью заменяет данные содержимым бэкапа. Возвращает кол-во записей. */
export async function importBackup(file: File): Promise<number> {
  const text = await file.text()
  const data = JSON.parse(text) as BackupFile
  if (data.app !== 'roma-finance' || !Array.isArray(data.incomes)) {
    throw new Error('Это не файл бэкапа «Мои Финансы»')
  }

  const images = await Promise.all(
    (data.images ?? []).map(async (img) => ({
      id: img.id,
      expenseId: img.expenseId,
      blob: await base64ToBlob(img.data),
    })),
  )

  await db.transaction('rw', [db.incomes, db.expenses, db.images, db.salaries, db.reserves, db.settings], async () => {
    await Promise.all([
      db.incomes.clear(), db.expenses.clear(), db.images.clear(),
      db.salaries.clear(), db.reserves.clear(), db.settings.clear(),
    ])
    await db.incomes.bulkAdd(data.incomes ?? [])
    await db.expenses.bulkAdd(data.expenses ?? [])
    await db.images.bulkAdd(images)
    await db.salaries.bulkAdd(data.salaries ?? [])
    await db.reserves.bulkAdd(data.reserves ?? [])
    await db.settings.bulkAdd(data.settings ?? [])
  })

  return (
    (data.incomes?.length ?? 0) + (data.expenses?.length ?? 0) +
    (data.salaries?.length ?? 0) + (data.reserves?.length ?? 0)
  )
}
