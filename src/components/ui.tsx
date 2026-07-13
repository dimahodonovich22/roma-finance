import { useEffect, type ReactNode } from 'react'
import { formatMoney } from '../lib/format'
import { useCurrency } from '../hooks/useTotals'

/* ── Money ─────────────────────────────────────────── */

export function Money({ amount, className = '' }: { amount: number; className?: string }) {
  const currency = useCurrency()
  return <span className={`tabular-nums ${className}`}>{formatMoney(amount, currency)}</span>
}

/* ── Заголовок экрана ──────────────────────────────── */

export function ScreenTitle({ children }: { children: ReactNode }) {
  return <h1 className="mb-5 text-[26px] font-bold tracking-tight text-neutral-900 dark:text-white">{children}</h1>
}

/* ── Карточка-контейнер ────────────────────────────── */

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-white dark:bg-neutral-800 ${className}`}>{children}</div>
  )
}

/* ── Круглый аватар с эмодзи/иконкой ───────────────── */

export function Avatar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ${
        className || 'bg-neutral-100 dark:bg-neutral-700'
      }`}
    >
      {children}
    </span>
  )
}

/* ── Modal (нижний лист на мобиле) ─────────────────── */

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl dark:bg-neutral-800 sm:max-w-md sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ── EmptyState ────────────────────────────────────── */

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-neutral-400 dark:text-neutral-500">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl dark:bg-neutral-800">
        {icon}
      </span>
      <p className="max-w-[15rem] text-center text-sm">{text}</p>
    </div>
  )
}

/* ── FAB — плавающая кнопка «добавить» ─────────────── */

export function FAB({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-neutral-900 shadow-lg shadow-brand/40 transition-transform hover:scale-105 active:scale-95 sm:bottom-8 sm:right-8"
    >
      <svg width="24" height="24" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M11 3v16M3 11h16" />
      </svg>
    </button>
  )
}

/* ── Поля форм ─────────────────────────────────────── */

const fieldCls =
  'w-full rounded-2xl border border-transparent bg-neutral-100 dark:bg-neutral-700 px-4 py-3 text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-brand focus:bg-white dark:focus:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand/40'

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      {children}
    </label>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fieldCls} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={fieldCls} />
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full rounded-full bg-brand py-3.5 font-semibold text-neutral-900 transition-colors hover:bg-brand-600 active:bg-brand-600 disabled:opacity-40"
    />
  )
}

export function DangerButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full rounded-full border border-red-200 py-3.5 font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
    />
  )
}
