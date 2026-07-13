import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Income } from '../types'
import { formatDate, todayISO, parseAmount } from '../lib/format'
import { Money, Modal, EmptyState, FAB, Field, TextInput, PrimaryButton, DangerButton } from '../components/ui'

export default function Incomes() {
  const incomes = useLiveQuery(() => db.incomes.orderBy('date').reverse().toArray())
  const [editing, setEditing] = useState<Income | 'new' | null>(null)

  const pending = incomes?.filter((i) => i.status === 'pending') ?? []
  const paid = incomes?.filter((i) => i.status === 'paid') ?? []
  const pendingSum = pending.reduce((s, i) => s + i.amount, 0)
  const paidSum = paid.reduce((s, i) => s + i.amount, 0)

  async function togglePaid(income: Income) {
    await db.incomes.update(income.id!, {
      status: income.status === 'paid' ? 'pending' : 'paid',
      paidDate: income.status === 'paid' ? undefined : todayISO(),
    })
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Доходы</h1>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/40">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">⏳ Ждёт оплаты</p>
          <Money amount={pendingSum} className="mt-1 block text-lg font-bold text-amber-800 dark:text-amber-300" />
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">✅ Получено</p>
          <Money amount={paidSum} className="mt-1 block text-lg font-bold text-emerald-800 dark:text-emerald-300" />
        </div>
      </div>

      {incomes?.length === 0 && <EmptyState icon="💰" text="Пока нет доходов — добавь первую фактуру" />}

      <ul className="space-y-2">
        {incomes?.map((income) => (
          <li
            key={income.id}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800"
          >
            <button
              onClick={() => togglePaid(income)}
              aria-label={income.status === 'paid' ? 'Пометить как неоплаченный' : 'Деньги пришли'}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                income.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300'
              }`}
            >
              {income.status === 'paid' ? '✓' : '⏳'}
            </button>
            <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(income)}>
              <p className="truncate font-medium">{income.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDate(income.date)}
                {income.status === 'paid' && income.paidDate && ` · оплачено ${formatDate(income.paidDate)}`}
                {income.note && ` · ${income.note}`}
              </p>
            </button>
            <Money amount={income.amount} className="shrink-0 font-semibold" />
          </li>
        ))}
      </ul>

      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
        Нажми на кружок, чтобы отметить «деньги пришли»
      </p>

      <FAB onClick={() => setEditing('new')} label="Добавить доход" />

      {editing && (
        <IncomeForm income={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function IncomeForm({ income, onClose }: { income: Income | null; onClose: () => void }) {
  const [title, setTitle] = useState(income?.title ?? '')
  const [amount, setAmount] = useState(income ? String(income.amount) : '')
  const [date, setDate] = useState(income?.date ?? todayISO())
  const [paid, setPaid] = useState(income?.status === 'paid')
  const [note, setNote] = useState(income?.note ?? '')

  const valid = title.trim() && !Number.isNaN(parseAmount(amount)) && parseAmount(amount) > 0 && date

  async function save() {
    const record: Income = {
      title: title.trim(),
      amount: parseAmount(amount),
      date,
      status: paid ? 'paid' : 'pending',
      paidDate: paid ? (income?.paidDate ?? todayISO()) : undefined,
      note: note.trim() || undefined,
    }
    if (income?.id) await db.incomes.update(income.id, { ...record })
    else await db.incomes.add(record)
    onClose()
  }

  async function remove() {
    if (income?.id && confirm('Удалить этот доход?')) {
      await db.incomes.delete(income.id)
      onClose()
    }
  }

  return (
    <Modal title={income ? 'Доход' : 'Новый доход'} onClose={onClose}>
      <Field label="От кого / за что">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Клиент, проект…" autoFocus={!income} />
      </Field>
      <Field label="Сумма">
        <TextInput value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" />
      </Field>
      <Field label="Дата фактуры">
        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Заметка (необязательно)">
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Номер фактуры…" />
      </Field>

      <label className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-700">
        <input
          type="checkbox"
          checked={paid}
          onChange={(e) => setPaid(e.target.checked)}
          className="h-5 w-5 accent-emerald-600"
        />
        <span className="text-sm font-medium">Деньги уже получены</span>
      </label>

      <div className="space-y-2">
        <PrimaryButton onClick={save} disabled={!valid}>
          Сохранить
        </PrimaryButton>
        {income && <DangerButton onClick={remove}>Удалить</DangerButton>}
      </div>
    </Modal>
  )
}
