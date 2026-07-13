import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Reserve } from '../types'
import { formatMonth, currentMonth, parseAmount } from '../lib/format'
import { Money, Modal, EmptyState, FAB, Field, TextInput, PrimaryButton, DangerButton } from '../components/ui'

export default function Reserves() {
  const reserves = useLiveQuery(() => db.reserves.orderBy('month').reverse().toArray())
  const [editing, setEditing] = useState<Reserve | 'new' | null>(null)

  const total = reserves?.reduce((s, r) => s + r.amount, 0) ?? 0

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Отложено</h1>

      <div className="mb-5 rounded-2xl bg-violet-50 p-4 dark:bg-violet-950/40">
        <p className="text-xs font-medium text-violet-700 dark:text-violet-400">🏦 Всего отложено</p>
        <Money amount={total} className="mt-1 block text-lg font-bold text-violet-800 dark:text-violet-300" />
        <p className="mt-1 text-xs text-violet-600/70 dark:text-violet-400/70">
          Эти суммы вычитаются из итога «Останется»
        </p>
      </div>

      {reserves?.length === 0 && <EmptyState icon="🏦" text="Отмечай суммы, которые нужно отложить — например, на декларацию" />}

      <ul className="space-y-2">
        {reserves?.map((reserve) => (
          <li key={reserve.id}>
            <button
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm dark:bg-slate-800"
              onClick={() => setEditing(reserve)}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm dark:bg-violet-900">
                🏦
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">За {formatMonth(reserve.month).toLowerCase()}</span>
                {reserve.note && (
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{reserve.note}</span>
                )}
              </span>
              <Money amount={reserve.amount} className="shrink-0 font-semibold text-violet-700 dark:text-violet-300" />
            </button>
          </li>
        ))}
      </ul>

      <FAB onClick={() => setEditing('new')} label="Отложить" />

      {editing && (
        <ReserveForm reserve={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function ReserveForm({ reserve, onClose }: { reserve: Reserve | null; onClose: () => void }) {
  const [month, setMonth] = useState(reserve?.month ?? currentMonth())
  const [amount, setAmount] = useState(reserve ? String(reserve.amount) : '')
  const [note, setNote] = useState(reserve?.note ?? '')

  const valid = month && !Number.isNaN(parseAmount(amount)) && parseAmount(amount) > 0

  async function save() {
    const record: Reserve = {
      month,
      amount: parseAmount(amount),
      note: note.trim() || undefined,
    }
    if (reserve?.id) await db.reserves.update(reserve.id, { ...record })
    else await db.reserves.add(record)
    onClose()
  }

  async function remove() {
    if (reserve?.id && confirm('Удалить эту запись?')) {
      await db.reserves.delete(reserve.id)
      onClose()
    }
  }

  return (
    <Modal title={reserve ? 'Отложено' : 'Отложить'} onClose={onClose}>
      <Field label="За какой месяц">
        <TextInput type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </Field>
      <Field label="Сумма">
        <TextInput value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" autoFocus={!reserve} />
      </Field>
      <Field label="Заметка (необязательно)">
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="На декларацию…" />
      </Field>

      <div className="space-y-2">
        <PrimaryButton onClick={save} disabled={!valid}>
          Сохранить
        </PrimaryButton>
        {reserve && <DangerButton onClick={remove}>Удалить</DangerButton>}
      </div>
    </Modal>
  )
}
