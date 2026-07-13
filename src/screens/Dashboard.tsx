import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useTotals } from '../hooks/useTotals'
import { formatDate } from '../lib/format'
import { Money, EmptyState } from '../components/ui'

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
      <h1 className="mb-4 text-2xl font-bold">Итог</h1>

      {/* Главная карточка */}
      <div className="mb-4 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-lg shadow-blue-600/20">
        <p className="text-sm text-blue-100">💵 На руках сейчас</p>
        <Money amount={totals.onHand} className="mt-1 block text-3xl font-bold" />
        <div className="mt-4 border-t border-white/20 pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-blue-100">✅ Останется по факту</span>
            <Money
              amount={totals.remaining}
              className={`text-xl font-bold ${totals.remaining < 0 ? 'text-red-300' : ''}`}
            />
          </div>
          <p className="mt-1 text-xs text-blue-200/80">
            = на руках − долги по зарплатам − отложено
          </p>
        </div>
      </div>

      {/* Сетка показателей */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatCard
          label="⏳ Мне должны"
          amount={totals.pendingIncome}
          hint="фактуры ждут оплаты"
          tone="amber"
          onClick={() => onNavigate('incomes')}
        />
        <StatCard
          label="👥 Я должен"
          amount={totals.owedSalaries}
          hint="зарплаты сотрудникам"
          tone="orange"
          onClick={() => onNavigate('salaries')}
        />
        <StatCard
          label="🧾 Потрачено"
          amount={totals.totalExpenses}
          hint="все расходы"
          tone="rose"
          onClick={() => onNavigate('expenses')}
        />
        <StatCard
          label="🏦 Отложено"
          amount={totals.totalReserves}
          hint="резервы по месяцам"
          tone="violet"
          onClick={() => onNavigate('reserves')}
        />
      </div>

      {!hasAnything && (
        <EmptyState icon="👋" text="Начни с добавления доходов и расходов на соседних вкладках" />
      )}

      {/* Последние операции */}
      {recent && recent.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Последние операции
          </h2>
          <ul className="space-y-2">
            {recent.map((op) => (
              <li
                key={op.key}
                className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm dark:bg-slate-800"
              >
                <span className="text-lg">
                  {op.kind === 'income' ? '💰' : op.kind === 'pending' ? '⏳' : '🧾'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{op.title}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{formatDate(op.date)}</span>
                </span>
                <Money
                  amount={op.amount}
                  className={`text-sm font-semibold ${
                    op.kind === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : op.kind === 'pending'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                  }`}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

const TONES = {
  amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
  orange: 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300',
  rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300',
  violet: 'bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300',
} as const

function StatCard({
  label,
  amount,
  hint,
  tone,
  onClick,
}: {
  label: string
  amount: number
  hint: string
  tone: keyof typeof TONES
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className={`rounded-2xl p-4 text-left transition-transform active:scale-[0.98] ${TONES[tone]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <Money amount={amount} className="mt-1 block text-lg font-bold" />
      <p className="mt-0.5 text-[11px] opacity-60">{hint}</p>
    </button>
  )
}
