import { addMonths, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { DayModal } from './components/DayModal'
import { ShiftCalendar } from './components/ShiftCalendar'
import { toDateKey, useShiftScheduler } from './hooks/useShiftScheduler'
import { ALL_WAITERS_FILTER, type AppMode } from './types'

type ThemeMode = 'dark' | 'light'
type MobileBadgeFormat = 'short' | 'full'

const THEME_STORAGE_KEY = 'berloga-shift.theme.v1'
const MOBILE_BADGE_FORMAT_STORAGE_KEY = 'berloga-shift.mobile-badge-format.v1'

function capitalize(value: string): string {
  if (!value.length) {
    return value
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
  return saved === 'light' ? 'light' : 'dark'
}

function getInitialMobileBadgeFormat(): MobileBadgeFormat {
  if (typeof window === 'undefined') {
    return 'short'
  }

  const saved = window.localStorage.getItem(MOBILE_BADGE_FORMAT_STORAGE_KEY)
  return saved === 'full' ? 'full' : 'short'
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const [mode, setMode] = useState<AppMode>('view')
  const [monthDate, setMonthDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedWaiterId, setSelectedWaiterId] = useState(ALL_WAITERS_FILTER)
  const [quickAssignWaiterId, setQuickAssignWaiterId] = useState(ALL_WAITERS_FILTER)
  const [mobileBadgeFormat, setMobileBadgeFormat] =
    useState<MobileBadgeFormat>(getInitialMobileBadgeFormat)
  const [newWaiterName, setNewWaiterName] = useState('')

  const {
    waiters,
    shiftsByDate,
    syncMode,
    syncConfigIssue,
    syncError,
    addWaiter,
    removeWaiter,
    toggleShiftForDate,
  } = useShiftScheduler()

  const monthTitle = useMemo(
    () => capitalize(format(monthDate, 'LLLL yyyy', { locale: ru })),
    [monthDate],
  )

  useEffect(() => {
    const root = document.documentElement
    const isDark = theme === 'dark'

    root.classList.toggle('dark', isDark)
    root.classList.toggle('light', !isDark)
    root.style.colorScheme = theme

    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(MOBILE_BADGE_FORMAT_STORAGE_KEY, mobileBadgeFormat)
  }, [mobileBadgeFormat])

  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : null
  const selectedDayShifts = selectedDateKey ? shiftsByDate[selectedDateKey] ?? [] : []

  const handleAddWaiter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const hasAdded = addWaiter(newWaiterName)

    if (hasAdded) {
      setNewWaiterName('')
    }
  }

  const handleRemoveWaiter = (waiterId: string) => {
    removeWaiter(waiterId)

    if (selectedWaiterId === waiterId) {
      setSelectedWaiterId(ALL_WAITERS_FILTER)
    }

    if (quickAssignWaiterId === waiterId) {
      setQuickAssignWaiterId(ALL_WAITERS_FILTER)
    }
  }

  const handleDayClick = (day: Date) => {
    if (mode === 'admin' && quickAssignWaiterId !== ALL_WAITERS_FILTER) {
      toggleShiftForDate(toDateKey(day), quickAssignWaiterId)
      return
    }

    setSelectedDate(day)
  }

  return (
    <main className="min-h-screen px-3 py-4 text-slate-900 transition-colors dark:text-slate-100 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:gap-6">
        <header className="rounded-3xl bg-white/85 p-4 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200/70 backdrop-blur-md transition-colors dark:bg-slate-900/80 dark:shadow-slate-950/40 dark:ring-slate-700 md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-3">
              <img
                src="/berloga-logo.svg"
                alt="Berloga Shift logo"
                className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Расписание официантов
                </p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
                  Berloga Shift
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Календарь смен Beerloga Grill Bar
                </p>

                <p
                  className={[
                    'mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                    syncMode === 'cloud'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                  ].join(' ')}
                >
                  {syncMode === 'cloud'
                    ? 'Общий режим: изменения видны всем пользователям.'
                    : 'Локальный режим: добавьте Firebase env-переменные для общего сохранения.'}
                </p>

                {syncMode === 'local' && syncConfigIssue ? (
                  <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {syncConfigIssue}
                  </p>
                ) : null}

                {syncError ? (
                  <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">{syncError}</p>
                ) : null}
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 xl:w-auto xl:items-end">
              <button
                type="button"
                onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 xl:w-auto"
                aria-label="Переключить тему"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
              </button>

              <div className="inline-flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className={[
                    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
                    mode === 'view'
                      ? 'bg-white text-slate-900 shadow-sm shadow-slate-300/60 dark:bg-slate-700 dark:text-slate-100 dark:shadow-none'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100',
                  ].join(' ')}
                >
                  <CalendarDays size={16} />
                  Режим просмотра
                </button>
                <button
                  type="button"
                  onClick={() => setMode('admin')}
                  className={[
                    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
                    mode === 'admin'
                      ? 'bg-white text-slate-900 shadow-sm shadow-slate-300/60 dark:bg-slate-700 dark:text-slate-100 dark:shadow-none'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100',
                  ].join(' ')}
                >
                  <ShieldCheck size={16} />
                  Режим администратора
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setMonthDate((prev) => addMonths(prev, -1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                aria-label="Предыдущий месяц"
              >
                <ChevronLeft size={18} />
              </button>

              <p className="min-w-[10.5rem] px-1 text-center text-sm font-bold text-slate-800 dark:text-slate-100">
                {monthTitle}
              </p>

              <button
                type="button"
                onClick={() => setMonthDate((prev) => addMonths(prev, 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                aria-label="Следующий месяц"
              >
                <ChevronRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => setMonthDate(new Date())}
                className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-300/50 transition hover:text-slate-900 dark:bg-slate-700 dark:text-slate-100 dark:shadow-none"
              >
                Сегодня
              </button>
            </div>

            <div className="flex w-full max-w-md flex-col gap-2">
              {mode === 'view' ? (
                <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  Фильтр по официанту
                  <select
                    value={selectedWaiterId}
                    onChange={(event) => setSelectedWaiterId(event.target.value)}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-sky-500 dark:focus:ring-sky-900"
                  >
                    <option value={ALL_WAITERS_FILTER}>Все официанты</option>
                    {waiters.map((waiter) => (
                      <option key={waiter.id} value={waiter.id}>
                        {waiter.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-teal-700 dark:text-teal-300">
                    Быстрое назначение по клику
                    <select
                      value={quickAssignWaiterId}
                      onChange={(event) => setQuickAssignWaiterId(event.target.value)}
                      className="h-11 rounded-xl border border-teal-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:border-teal-800 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-teal-500 dark:focus:ring-teal-900"
                    >
                      <option value={ALL_WAITERS_FILTER}>Выберите официанта</option>
                      {waiters.map((waiter) => (
                        <option key={waiter.id} value={waiter.id}>
                          {waiter.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <p className="rounded-2xl bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 dark:bg-teal-900/30 dark:text-teal-200">
                    Выберите официанта и нажимайте на день, чтобы сразу поставить или снять смену.
                  </p>
                </>
              )}

              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  Бейджи на телефоне
                </p>
                <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setMobileBadgeFormat('short')}
                    className={[
                      'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                      mobileBadgeFormat === 'short'
                        ? 'bg-white text-slate-900 shadow-sm shadow-slate-300/60 dark:bg-slate-700 dark:text-slate-100 dark:shadow-none'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100',
                    ].join(' ')}
                  >
                    Короткие имена
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileBadgeFormat('full')}
                    className={[
                      'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                      mobileBadgeFormat === 'full'
                        ? 'bg-white text-slate-900 shadow-sm shadow-slate-300/60 dark:bg-slate-700 dark:text-slate-100 dark:shadow-none'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100',
                    ].join(' ')}
                  >
                    Полные имена
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {mode === 'admin' ? (
          <section className="rounded-3xl bg-white/85 p-4 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200/70 backdrop-blur-md transition-colors dark:bg-slate-900/80 dark:shadow-slate-950/40 dark:ring-slate-700 md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-teal-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Список официантов</h2>
            </div>

            <form onSubmit={handleAddWaiter} className="flex flex-col gap-2 sm:flex-row">
              <input
                value={newWaiterName}
                onChange={(event) => setNewWaiterName(event.target.value)}
                placeholder="Введите имя нового официанта"
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-teal-500 dark:focus:ring-teal-900"
              />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-teal-700 dark:hover:bg-teal-600"
              >
                <UserRoundPlus size={16} />
                Добавить
              </button>
            </form>

            {waiters.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                Список пуст. Добавьте сотрудников, чтобы назначать смены.
              </p>
            ) : (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {waiters.map((waiter) => (
                  <li
                    key={waiter.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: waiter.color }}
                      />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {waiter.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveWaiter(waiter.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                      aria-label={`Удалить ${waiter.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        <ShiftCalendar
          monthDate={monthDate}
          waiters={waiters}
          shiftsByDate={shiftsByDate}
          selectedWaiterId={mode === 'view' ? selectedWaiterId : quickAssignWaiterId}
          mobileBadgeFormat={mobileBadgeFormat}
          onDaySelect={handleDayClick}
        />
      </div>

      <DayModal
        date={selectedDate}
        mode={mode}
        waiters={waiters}
        assignedWaiterIds={selectedDayShifts}
        onClose={() => setSelectedDate(null)}
        onToggleWaiterShift={(waiterId) => {
          if (!selectedDateKey) {
            return
          }

          toggleShiftForDate(selectedDateKey, waiterId)
        }}
      />
    </main>
  )
}

export default App
