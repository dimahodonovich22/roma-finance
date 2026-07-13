import { useEffect, useRef, useState } from 'react'
import { db, getSetting, setSetting } from '../db'
import { exportBackup, importBackup } from '../lib/backup'
import { parseAmount } from '../lib/format'
import { Field, TextInput, PrimaryButton, DangerButton, ScreenTitle } from '../components/ui'

export default function Settings() {
  const [currency, setCurrency] = useState('')
  const [startingBalance, setStartingBalance] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([getSetting('currency', 'zł'), getSetting('startingBalance', '0')]).then(
      ([cur, start]) => {
        setCurrency(cur)
        setStartingBalance(start)
        setLoaded(true)
      },
    )
  }, [])

  async function save() {
    const balance = startingBalance.trim() === '' ? 0 : parseAmount(startingBalance)
    if (Number.isNaN(balance)) {
      setMessage('❌ Неверный формат начального остатка')
      return
    }
    await setSetting('currency', currency.trim() || 'zł')
    await setSetting('startingBalance', String(balance))
    setMessage('✅ Сохранено')
    setTimeout(() => setMessage(''), 2000)
  }

  async function doExport() {
    try {
      await exportBackup()
      setMessage('✅ Бэкап скачан — сохрани файл в надёжное место')
    } catch {
      setMessage('❌ Не удалось создать бэкап')
    }
  }

  async function doImport(file: File) {
    if (!confirm('Импорт ЗАМЕНИТ все текущие данные содержимым бэкапа. Продолжить?')) return
    try {
      const count = await importBackup(file)
      setMessage(`✅ Восстановлено записей: ${count}`)
      const [cur, start] = await Promise.all([getSetting('currency', 'zł'), getSetting('startingBalance', '0')])
      setCurrency(cur)
      setStartingBalance(start)
    } catch (e) {
      setMessage(`❌ ${e instanceof Error ? e.message : 'Не удалось импортировать'}`)
    }
  }

  async function wipeAll() {
    if (!confirm('Удалить ВСЕ данные приложения? Это действие необратимо.')) return
    if (!confirm('Точно? Все доходы, расходы, зарплаты и чеки будут стёрты.')) return
    await db.transaction('rw', [db.incomes, db.expenses, db.images, db.salaries, db.reserves, db.settings], async () => {
      await Promise.all([
        db.incomes.clear(), db.expenses.clear(), db.images.clear(),
        db.salaries.clear(), db.reserves.clear(), db.settings.clear(),
      ])
    })
    setCurrency('zł')
    setStartingBalance('0')
    setMessage('Все данные удалены')
  }

  if (!loaded) return null

  return (
    <div>
      <ScreenTitle>Настройки</ScreenTitle>

      <div className="mb-3 rounded-3xl bg-white p-5 dark:bg-neutral-800">
        <Field label="Валюта (символ)">
          <TextInput value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="zł / € / $ / ₽" />
        </Field>
        <Field label="Начальный остаток (сколько было на руках до начала учёта)">
          <TextInput
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </Field>
        <PrimaryButton onClick={save}>Сохранить настройки</PrimaryButton>
      </div>

      <div className="mb-3 rounded-3xl bg-white p-5 dark:bg-neutral-800">
        <h2 className="mb-1 font-bold">Резервная копия</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Данные хранятся только в этом браузере. Регулярно скачивай бэкап, чтобы ничего не потерять
          (в нём всё, включая скрины чеков).
        </p>
        <div className="space-y-2">
          <PrimaryButton onClick={doExport}>⬇️ Скачать бэкап</PrimaryButton>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-full border border-neutral-200 py-3.5 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            ⬆️ Восстановить из бэкапа
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) doImport(file)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 dark:bg-neutral-800">
        <h2 className="mb-3 font-bold text-red-600 dark:text-red-400">Опасная зона</h2>
        <DangerButton onClick={wipeAll}>Удалить все данные</DangerButton>
      </div>

      {message && (
        <p className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md rounded-2xl bg-neutral-900 px-4 py-3 text-center text-sm text-white shadow-lg dark:bg-white dark:text-neutral-900">
          {message}
        </p>
      )}
    </div>
  )
}
