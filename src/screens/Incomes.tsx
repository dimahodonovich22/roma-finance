import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Income } from '../types'
import { formatDate, todayISO, parseAmount } from '../lib/format'
import { Money, Modal, EmptyState, FAB, Field, TextInput, PrimaryButton, DangerButton, ScreenTitle } from '../components/ui'

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
      <ScreenTitle>Доходы</ScreenTitle>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-white p-4 dark:bg-neutral-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-base dark:bg-amber-950/50">⏳</span>
          <p className="mt-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">Ждёт оплаты</p>
          <Money amount={pendingSum} className="mt-0.5 block text-lg font-bold" />
        </div>
        <div className="rounded-3xl bg-white p-4 dark:bg-neutral-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-base dark:bg-emerald-950/50">✅</span>
          <p className="mt-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">Получено</p>
          <Money amount={paidSum} className="mt-0.5 block text-lg font-bold text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {incomes?.length === 0 && <EmptyState icon="💰" text="Пока нет доходов — добавь первую фактуру" />}

      <ul className="space-y-2">
        {incomes?.map((income) => (
          <li
            key={income.id}
            className="flex items-center gap-3 rounded-2xl bg-white p-3.5 dark:bg-neutral-800"
          >
            <button
              onClick={() => togglePaid(income)}
              aria-label={income.status === 'paid' ? 'Пометить как неоплаченный' : 'Деньги пришли'}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold transition-colors ${
                income.status === 'paid'
                  ? 'bg-brand text-neutral-900'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300'
              }`}
            >
              {income.status === 'paid' ? '✓' : '⏳'}
            </button>
            <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(income)}>
              <p className="truncate font-semibold">{income.title}</p>
              <p className="text-xs text-neutral-400">
                {formatDate(income.date)}
                {income.status === 'paid' && income.paidDate && ` · оплачено ${formatDate(income.paidDate)}`}
                {income.note && ` · ${income.note}`}
              </p>
            </button>
            <span className="text-right">
              <Money
                amount={income.amount}
                className={`block font-bold ${income.status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
              />
              <span className="text-[11px] text-neutral-400">{income.status === 'paid' ? 'Получено' : 'Ждёт'}</span>
            </span>
          </li>
        ))}
      </ul>

      {incomes && incomes.length > 0 && (
        <p className="mt-4 text-center text-xs text-neutral-400">
          Нажми на кружок, чтобы отметить «деньги пришли»
        </p>
      )}

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

      <label className="mb-4 flex items-center gap-3 rounded-2xl bg-neutral-100 p-3.5 dark:bg-neutral-700">
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
