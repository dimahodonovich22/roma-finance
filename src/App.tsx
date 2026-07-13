import { useState } from 'react'
import { LayoutGrid, TrendingUp, Receipt, Users, PiggyBank, Settings as SettingsIcon, type LucideIcon } from 'lucide-react'
import Dashboard from './screens/Dashboard'
import Incomes from './screens/Incomes'
import Expenses from './screens/Expenses'
import Salaries from './screens/Salaries'
import Reserves from './screens/Reserves'
import Settings from './screens/Settings'

const TABS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Итог', Icon: LayoutGrid },
  { id: 'incomes', label: 'Доходы', Icon: TrendingUp },
  { id: 'expenses', label: 'Расходы', Icon: Receipt },
  { id: 'salaries', label: 'Зарплаты', Icon: Users },
  { id: 'reserves', label: 'Отложено', Icon: PiggyBank },
  { id: 'settings', label: 'Ещё', Icon: SettingsIcon },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="min-h-dvh text-neutral-900 dark:text-white">
      <div className="mx-auto max-w-2xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:pb-8">
        {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
        {tab === 'incomes' && <Incomes />}
        {tab === 'expenses' && <Expenses />}
        {tab === 'salaries' && <Salaries />}
        {tab === 'reserves' && <Reserves />}
        {tab === 'settings' && <Settings />}
      </div>

      {/* Нижняя навигация */}
      <nav className="fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between rounded-t-[28px] border-t border-neutral-200/60 bg-white px-2 py-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:border-neutral-700/60 dark:bg-neutral-800">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex flex-1 flex-col items-center gap-1 py-1"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    active ? 'bg-brand text-neutral-900' : 'bg-transparent text-neutral-400 dark:text-neutral-500'
                  }`}
                >
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span
                  className={`text-[10px] transition-colors ${
                    active
                      ? 'font-semibold text-neutral-900 dark:text-white'
                      : 'text-neutral-400 dark:text-neutral-500'
                  }`}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
