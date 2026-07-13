import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useTotals } from '../hooks/useTotals'
import { formatDate } from '../lib/format'
import { Money, EmptyState, Avatar } from '../components/ui'

export default function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const totals = useTotals()

  const recent = useLiveQuery(async () => {
    const [incomes, expenses] = await Promise.all([
      db.incomes.orderBy('date').reverse().limit(6).toArray(),
      db.expenses.orderBy('date').reverse().limit(6).toArray(),
    ])
    const items = [
      ...incomes.map((i) => ({
        key: `i${i.id}`,
        date: i.date,
        title: i.title,
        amount: i.amount,
        kind: i.status === 'paid' ? ('income' as const) : ('pending' as const),
      })),
      ...expenses.map((e) => ({
        key: `e${e.id}`,
        date: e.date,
        title: e.title,
        amount: e.amount,
        kind: 'expense' as const,
      })),
    ]
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  })

  if (!totals) return null

  const hasAnything =
    totals.receivedIncome || totals.pendingIncome || totals.totalExpenses ||
    totals.owedSalaries || totals.paidSalaries || totals.totalReserves || totals.startingBalance

  return (
    <div>
      <h1 className="mb-5 text-[26px] font-bold tracking-tight">Итог</h1>

      {/* Главная карточка */}
      <div className="mb-3 rounded-[28px] bg-white p-6 shadow-sm dark:bg-neutral-800">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">На руках сейчас</p>
        <Money amount={totals.onHand} className="mt-1 block text-[40px] font-extrabold leading-tight tracking-tight" />

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-brand/20 px-4 py-3.5 dark:bg-brand/15">
          <span className="text-sm font-medium">✅ Останется по факту</span>
          <Money
            amount={totals.remaining}
            className={`text-lg font-bold ${totals.remaining < 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}
          />
        </div>
        <p className="mt-2.5 px-1 text-xs text-neutral-400">= на руках − долги по зарплатам − отложено</p>
      </div>

      {/* Сетка показателей */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label="Мне должны" emoji="⏳" tint="bg-amber-100 dark:bg-amber-950/50" amount={totals.pendingIncome} hint="фактуры ждут оплаты" onClick={() => onNavigate('incomes')} />
        <StatCard label="Я должен" emoji="👥" tint="bg-orange-100 dark:bg-orange-950/50" amount={totals.owedSalaries} hint="зарплаты сотрудникам" onClick={() => onNavigate('salaries')} />
        <StatCard label="Потрачено" emoji="🧾" tint="bg-rose-100 dark:bg-rose-950/50" amount={totals.totalExpenses} hint="все расходы" onClick={() => onNavigate('expenses')} />
        <StatCard label="Отложено" emoji="🏦" tint="bg-violet-100 dark:bg-violet-950/50" amount={totals.totalReserves} hint="резервы по месяцам" onClick={() => onNavigate('reserves')} />
      </div>

      {!hasAnything && (
        <EmptyState icon="👋" text="Начни с добавления доходов и расходов на соседних вкладках" />
      )}

      {/* Последние операции */}
      {recent && recent.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Последние операции</h2>
          </div>
          <ul className="space-y-2">
            {recent.map((op) => (
              <li
                key={op.key}
                className="flex items-center gap-3 rounded-2xl bg-white p-3.5 dark:bg-neutral-800"
              >
                <Avatar
                  className={
                    op.kind === 'income'
                      ? 'bg-emerald-100 dark:bg-emerald-950/50'
                      : op.kind === 'pending'
                        ? 'bg-amber-100 dark:bg-amber-950/50'
                        : 'bg-neutral-100 dark:bg-neutral-700'
                  }
                >
                  {op.kind === 'income' ? '💰' : op.kind === 'pending' ? '⏳' : '🧾'}
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{op.title}</span>
                  <span className="block text-xs text-neutral-400">{formatDate(op.date)}</span>
                </span>
                <span className="text-right">
                  <Money
                    amount={op.amount}
                    className={`block text-sm font-bold ${
                      op.kind === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : op.kind === 'pending'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-neutral-900 dark:text-white'
                    }`}
                  />
                  <span className="text-[11px] text-neutral-400">
                    {op.kind === 'income' ? 'Получено' : op.kind === 'pending' ? 'Ждёт' : 'Расход'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  emoji,
  tint,
  amount,
  hint,
  onClick,
}: {
  label: string
  emoji: string
  tint: string
  amount: number
  hint: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-3xl bg-white p-4 text-left transition-transform active:scale-[0.98] dark:bg-neutral-800"
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-full text-base ${tint}`}>{emoji}</span>
      <p className="mt-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
      <Money amount={amount} className="mt-0.5 block text-lg font-bold" />
      <p className="mt-0.5 text-[11px] text-neutral-400">{hint}</p>
    </button>
  )
}
