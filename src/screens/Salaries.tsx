import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Salary } from '../types'
import { formatMonth, formatDate, todayISO, currentMonth, parseAmount } from '../lib/format'
import { Money, Modal, EmptyState, FAB, Field, TextInput, PrimaryButton, DangerButton } from '../components/ui'

export default function Salaries() {
  const salaries = useLiveQuery(() => db.salaries.orderBy('period').reverse().toArray())
  const [editing, setEditing] = useState<Salary | 'new' | null>(null)

  const owedSum = salaries?.filter((s) => s.status === 'owed').reduce((s2, x) => s2 + x.amount, 0) ?? 0
  const paidSum = salaries?.filter((s) => s.status === 'paid').reduce((s2, x) => s2 + x.amount, 0) ?? 0

  async function togglePaid(salary: Salary) {
    await db.salaries.update(salary.id!, {
      status: salary.status === 'paid' ? 'owed' : 'paid',
      paidDate: salary.status === 'paid' ? undefined : todayISO(),
    })
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Зарплаты</h1>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-orange-50 p-4 dark:bg-orange-950/40">
          <p className="text-xs font-medium text-orange-700 dark:text-orange-400">👥 Я должен</p>
          <Money amount={owedSum} className="mt-1 block text-lg font-bold text-orange-800 dark:text-orange-300" />
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">✅ Выплачено</p>
          <Money amount={paidSum} className="mt-1 block text-lg font-bold text-emerald-800 dark:text-emerald-300" />
        </div>
      </div>

      {salaries?.length === 0 && <EmptyState icon="👥" text="Добавь, кому и сколько должен" />}

      <ul className="space-y-2">
        {salaries?.map((salary) => (
          <li key={salary.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
            <button
              onClick={() => togglePaid(salary)}
              aria-label={salary.status === 'paid' ? 'Пометить как невыплаченную' : 'Выплатил'}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                salary.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300'
                  : 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300'
              }`}
            >
              {salary.status === 'paid' ? '✓' : '⏳'}
            </button>
            <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(salary)}>
              <p className="truncate font-medium">{salary.employee}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                За {formatMonth(salary.period).toLowerCase()}
                {salary.status === 'paid' && salary.paidDate && ` · выплачено ${formatDate(salary.paidDate)}`}
              </p>
            </button>
            <Money amount={salary.amount} className="shrink-0 font-semibold" />
          </li>
        ))}
      </ul>

      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
        Нажми на кружок, когда выплатишь зарплату
      </p>

      <FAB onClick={() => setEditing('new')} label="Добавить зарплату" />

      {editing && (
        <SalaryForm salary={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function SalaryForm({ salary, onClose }: { salary: Salary | null; onClose: () => void }) {
  const [employee, setEmployee] = useState(salary?.employee ?? '')
  const [amount, setAmount] = useState(salary ? String(salary.amount) : '')
  const [period, setPeriod] = useState(salary?.period ?? currentMonth())

  const valid = employee.trim() && !Number.isNaN(parseAmount(amount)) && parseAmount(amount) > 0 && period

  async function save() {
    const record: Salary = {
      employee: employee.trim(),
      amount: parseAmount(amount),
      period,
      status: salary?.status ?? 'owed',
      paidDate: salary?.paidDate,
    }
    if (salary?.id) await db.salaries.update(salary.id, { ...record })
    else await db.salaries.add(record)
    onClose()
  }

  async function remove() {
    if (salary?.id && confirm('Удалить эту запись?')) {
      await db.salaries.delete(salary.id)
      onClose()
    }
  }

  return (
    <Modal title={salary ? 'Зарплата' : 'Новая зарплата'} onClose={onClose}>
      <Field label="Сотрудник">
        <TextInput value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder="Имя" autoFocus={!salary} />
      </Field>
      <Field label="Сумма">
        <TextInput value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" />
      </Field>
      <Field label="За какой месяц">
        <TextInput type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
      </Field>

      <div className="space-y-2">
        <PrimaryButton onClick={save} disabled={!valid}>
          Сохранить
        </PrimaryButton>
        {salary && <DangerButton onClick={remove}>Удалить</DangerButton>}
      </div>
    </Modal>
  )
}
