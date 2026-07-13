import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Users, CircleCheck, Check, Clock } from 'lucide-react'
import { db } from '../db'
import type { Salary } from '../types'
import { formatMonth, formatDate, todayISO, currentMonth, parseAmount } from '../lib/format'
import { Money, Modal, EmptyState, FAB, Field, TextInput, PrimaryButton, DangerButton, ScreenTitle } from '../components/ui'

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
      <ScreenTitle>Зарплаты</ScreenTitle>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-white p-4 dark:bg-neutral-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"><Users size={18} /></span>
          <p className="mt-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">Я должен</p>
          <Money amount={owedSum} className="mt-0.5 block text-lg font-bold" />
        </div>
        <div className="rounded-3xl bg-white p-4 dark:bg-neutral-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"><CircleCheck size={18} /></span>
          <p className="mt-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">Выплачено</p>
          <Money amount={paidSum} className="mt-0.5 block text-lg font-bold text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {salaries?.length === 0 && <EmptyState icon={<Users size={28} />} text="Добавь, кому и сколько должен" />}

      <ul className="space-y-2">
        {salaries?.map((salary) => (
          <li key={salary.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 dark:bg-neutral-800">
            <button
              onClick={() => togglePaid(salary)}
              aria-label={salary.status === 'paid' ? 'Пометить как невыплаченную' : 'Выплатил'}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                salary.status === 'paid'
                  ? 'bg-brand text-neutral-900'
                  : 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300'
              }`}
            >
              {salary.status === 'paid' ? <Check size={20} strokeWidth={2.5} /> : <Clock size={18} />}
            </button>
            <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(salary)}>
              <p className="truncate font-semibold">{salary.employee}</p>
              <p className="text-xs text-neutral-400">
                За {formatMonth(salary.period).toLowerCase()}
                {salary.status === 'paid' && salary.paidDate && ` · выплачено ${formatDate(salary.paidDate)}`}
              </p>
            </button>
            <span className="text-right">
              <Money amount={salary.amount} className="block font-bold" />
              <span className="text-[11px] text-neutral-400">{salary.status === 'paid' ? 'Выплачено' : 'Должен'}</span>
            </span>
          </li>
        ))}
      </ul>

      {salaries && salaries.length > 0 && (
        <p className="mt-4 text-center text-xs text-neutral-400">
          Нажми на кружок, когда выплатишь зарплату
        </p>
      )}

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
