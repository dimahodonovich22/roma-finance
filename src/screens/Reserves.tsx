import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Reserve } from '../types'
import { formatMonth, currentMonth, parseAmount } from '../lib/format'
import { Money, Modal, EmptyState, FAB, Field, TextInput, PrimaryButton, DangerButton, ScreenTitle } from '../components/ui'

export default function Reserves() {
  const reserves = useLiveQuery(() => db.reserves.orderBy('month').reverse().toArray())
  const [editing, setEditing] = useState<Reserve | 'new' | null>(null)

  const total = reserves?.reduce((s, r) => s + r.amount, 0) ?? 0

  return (
    <div>
      <ScreenTitle>Отложено</ScreenTitle>

      <div className="mb-5 rounded-3xl bg-white p-5 dark:bg-neutral-800">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-lg dark:bg-violet-950/50">🏦</span>
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Всего отложено</p>
        <Money amount={total} className="mt-0.5 block text-2xl font-extrabold tracking-tight" />
        <p className="mt-1.5 text-xs text-neutral-400">Эти суммы вычитаются из итога «Останется»</p>
      </div>

      {reserves?.length === 0 && <EmptyState icon="🏦" text="Отмечай суммы, которые нужно отложить — например, на декларацию" />}

      <ul className="space-y-2">
        {reserves?.map((reserve) => (
          <li key={reserve.id}>
            <button
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left dark:bg-neutral-800"
              onClick={() => setEditing(reserve)}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg dark:bg-violet-950/50">
                🏦
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">За {formatMonth(reserve.month).toLowerCase()}</span>
                {reserve.note && (
                  <span className="block text-xs text-neutral-400">{reserve.note}</span>
                )}
              </span>
              <Money amount={reserve.amount} className="shrink-0 font-bold text-violet-600 dark:text-violet-300" />
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
