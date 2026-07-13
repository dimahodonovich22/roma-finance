import { useState } from 'react'
import Dashboard from './screens/Dashboard'
import Incomes from './screens/Incomes'
import Expenses from './screens/Expenses'
import Salaries from './screens/Salaries'
import Reserves from './screens/Reserves'
import Settings from './screens/Settings'

const TABS = [
  { id: 'dashboard', label: 'Итог', icon: '📊' },
  { id: 'incomes', label: 'Доходы', icon: '💰' },
  { id: 'expenses', label: 'Расходы', icon: '🧾' },
  { id: 'salaries', label: 'Зарплаты', icon: '👥' },
  { id: 'reserves', label: 'Отложено', icon: '🏦' },
  { id: 'settings', label: 'Ещё', icon: '⚙️' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function App() {
  const [tab, setTab] = useState<TabId>('dashboard')

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white">
      <div className="mx-auto max-w-2xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:pb-8">
        {tab === 'dashboard' && <Dashboard onNavigate={(t) => setTab(t as TabId)} />}
        {tab === 'incomes' && <Incomes />}
        {tab === 'expenses' && <Expenses />}
        {tab === 'salaries' && <Salaries />}
        {tab === 'reserves' && <Reserves />}
        {tab === 'settings' && <Settings />}
      </div>

      {/* Нижняя навигация */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/90">
        <div className="mx-auto flex max-w-2xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
                tab === t.id
                  ? 'font-semibold text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
