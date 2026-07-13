import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Expense } from '../types'
import { EXPENSE_CATEGORIES } from '../types'
import { formatDate, todayISO, parseAmount } from '../lib/format'
import { Receipt, Camera } from 'lucide-react'
import { compressImage } from '../lib/images'
import { Money, Modal, EmptyState, FAB, Field, TextInput, Select, PrimaryButton, DangerButton, ScreenTitle } from '../components/ui'
import { ImageViewer, useReceiptUrls } from '../components/ImageViewer'

export default function Expenses() {
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray())
  const [editing, setEditing] = useState<Expense | 'new' | null>(null)

  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0

  return (
    <div>
      <ScreenTitle>Расходы</ScreenTitle>

      <div className="mb-5 rounded-3xl bg-white p-5 dark:bg-neutral-800">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"><Receipt size={20} /></span>
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Всего потрачено</p>
        <Money amount={total} className="mt-0.5 block text-2xl font-extrabold tracking-tight" />
      </div>

      {expenses?.length === 0 && <EmptyState icon={<Receipt size={28} />} text="Пока нет расходов" />}

      <ul className="space-y-2">
        {expenses?.map((expense) => (
          <li key={expense.id}>
            <button
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left dark:bg-neutral-800"
              onClick={() => setEditing(expense)}
            >
              <ExpenseThumb expenseId={expense.id!} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{expense.title}</span>
                <span className="block text-xs text-neutral-400">
                  {formatDate(expense.date)}
                  {expense.category && ` · ${expense.category}`}
                  {expense.note && ` · ${expense.note}`}
                </span>
              </span>
              <span className="text-right">
                <Money amount={expense.amount} className="block font-bold" />
                <span className="text-[11px] text-neutral-400">Расход</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <FAB onClick={() => setEditing('new')} label="Добавить расход" />

      {editing && (
        <ExpenseForm expense={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

/** Миниатюра первого чека в списке */
function ExpenseThumb({ expenseId }: { expenseId: number }) {
  const [url, setUrl] = useState<string | null>(null)
  const count = useLiveQuery(() => db.images.where('expenseId').equals(expenseId).count(), [expenseId])

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    if (count) {
      db.images.where('expenseId').equals(expenseId).first().then((img) => {
        if (img && !cancelled) {
          objectUrl = URL.createObjectURL(img.blob)
          setUrl(objectUrl)
        }
      })
    } else {
      setUrl(null)
    }
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [expenseId, count])

  if (!url)
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-300">
        <Receipt size={20} />
      </span>
    )
  return <img src={url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
}

function ExpenseForm({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const [title, setTitle] = useState(expense?.title ?? '')
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [date, setDate] = useState(expense?.date ?? todayISO())
  const [category, setCategory] = useState(expense?.category ?? '')
  const [note, setNote] = useState(expense?.note ?? '')
  const [newImages, setNewImages] = useState<{ blob: Blob; url: string }[]>([])
  const [viewer, setViewer] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const savedUrls = useReceiptUrls(expense?.id)

  const valid = title.trim() && !Number.isNaN(parseAmount(amount)) && parseAmount(amount) > 0 && date && !busy

  async function addFiles(files: FileList | File[]) {
    setBusy(true)
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const blob = await compressImage(file)
        setNewImages((prev) => [...prev, { blob, url: URL.createObjectURL(blob) }])
      }
    } catch {
      alert('Не удалось обработать картинку')
    } finally {
      setBusy(false)
    }
  }

  // Вставка скрина из буфера обмена (Cmd/Ctrl+V)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'))
      if (files.length) addFiles(files)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    const record: Expense = {
      title: title.trim(),
      amount: parseAmount(amount),
      date,
      category: category || undefined,
      note: note.trim() || undefined,
    }
    let id = expense?.id
    if (id) await db.expenses.update(id, { ...record })
    else id = (await db.expenses.add(record)) as number

    for (const img of newImages) {
      await db.images.add({ expenseId: id, blob: img.blob })
      URL.revokeObjectURL(img.url)
    }
    onClose()
  }

  async function removeSavedImage(imageId: number) {
    if (confirm('Удалить эту картинку?')) await db.images.delete(imageId)
  }

  async function remove() {
    if (expense?.id && confirm('Удалить этот расход вместе с чеками?')) {
      await db.transaction('rw', [db.expenses, db.images], async () => {
        await db.images.where('expenseId').equals(expense.id!).delete()
        await db.expenses.delete(expense.id!)
      })
      onClose()
    }
  }

  return (
    <Modal title={expense ? 'Расход' : 'Новый расход'} onClose={onClose}>
      <Field label="На что потратил">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Покупка, оплата…" autoFocus={!expense} />
      </Field>
      <Field label="Сумма">
        <TextInput value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" />
      </Field>
      <Field label="Дата">
        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Категория">
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Без категории</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <Field label="Заметка (необязательно)">
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>

      {/* Чеки / скрины */}
      <div className="mb-4">
        <span className="mb-1.5 block text-sm font-medium text-neutral-500 dark:text-neutral-400">Чеки / скрины</span>
        <div className="flex flex-wrap gap-2">
          {savedUrls.map((img) => (
            <div key={img.id} className="relative">
              <button onClick={() => setViewer(img.url)}>
                <img src={img.url} alt="Чек" className="h-20 w-20 rounded-2xl object-cover" />
              </button>
              <button
                onClick={() => removeSavedImage(img.id)}
                aria-label="Удалить картинку"
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow"
              >
                ✕
              </button>
            </div>
          ))}
          {newImages.map((img, i) => (
            <div key={img.url} className="relative">
              <button onClick={() => setViewer(img.url)}>
                <img src={img.url} alt="Новый чек" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-brand" />
              </button>
              <button
                onClick={() => setNewImages((prev) => prev.filter((_, j) => j !== i))}
                aria-label="Убрать картинку"
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-neutral-300 text-xs text-neutral-400 dark:border-neutral-600"
          >
            {busy ? <span className="text-xl">…</span> : <Camera size={22} />}
            {busy ? '' : 'Добавить'}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <p className="mt-1.5 text-xs text-neutral-400">Можно также вставить скрин из буфера (Cmd+V)</p>
      </div>

      <div className="space-y-2">
        <PrimaryButton onClick={save} disabled={!valid}>
          Сохранить
        </PrimaryButton>
        {expense && <DangerButton onClick={remove}>Удалить</DangerButton>}
      </div>

      {viewer && <ImageViewer url={viewer} onClose={() => setViewer(null)} />}
    </Modal>
  )
}
