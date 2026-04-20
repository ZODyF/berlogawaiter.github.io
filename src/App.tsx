import { addMonths, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Trash2,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { DayModal } from './components/DayModal'
import { ShiftCalendar } from './components/ShiftCalendar'
import { toDateKey, useShiftScheduler } from './hooks/useShiftScheduler'
import { ALL_WAITERS_FILTER, type AppMode } from './types'

function capitalize(value: string): string {
  if (!value.length) {
    return value
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function App() {
  const [mode, setMode] = useState<AppMode>('view')
  const [monthDate, setMonthDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedWaiterId, setSelectedWaiterId] = useState(ALL_WAITERS_FILTER)
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
  }

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:gap-6">
        <header className="rounded-3xl bg-white/85 p-4 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200/70 backdrop-blur-md md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Расписание официантов
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Shift Board
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Простой календарь смен без авторизации с общей облачной синхронизацией
              </p>
              <p
                className={[
                  'mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                  syncMode === 'cloud'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700',
                ].join(' ')}
              >
                {syncMode === 'cloud'
                  ? 'Общий режим: изменения видны всем пользователям.'
                  : 'Локальный режим: добавьте Firebase env-переменные для общего сохранения.'}
              </p>
              {syncMode === 'local' && syncConfigIssue ? (
                <p className="mt-2 text-xs font-semibold text-amber-700">{syncConfigIssue}</p>
              ) : null}
              {syncError ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{syncError}</p>
              ) : null}
            </div>

            <div className="inline-flex rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode('view')}
                className={[
                  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
                  mode === 'view'
                    ? 'bg-white text-slate-900 shadow-sm shadow-slate-300/60'
                    : 'text-slate-500 hover:text-slate-700',
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
                    ? 'bg-white text-slate-900 shadow-sm shadow-slate-300/60'
                    : 'text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                <ShieldCheck size={16} />
                Режим администратора
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMonthDate((prev) => addMonths(prev, -1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-800"
                aria-label="Предыдущий месяц"
              >
                <ChevronLeft size={18} />
              </button>

              <p className="min-w-[10.5rem] px-1 text-center text-sm font-bold text-slate-800">
                {monthTitle}
              </p>

              <button
                type="button"
                onClick={() => setMonthDate((prev) => addMonths(prev, 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-800"
                aria-label="Следующий месяц"
              >
                <ChevronRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => setMonthDate(new Date())}
                className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-300/50 transition hover:text-slate-900"
              >
                Сегодня
              </button>
            </div>

            {mode === 'view' ? (
              <label className="flex w-full max-w-sm flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                Фильтр по официанту
                <select
                  value={selectedWaiterId}
                  onChange={(event) => setSelectedWaiterId(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
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
              <p className="rounded-2xl bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
                Кликните по дню в календаре, чтобы назначить или снять смену
              </p>
            )}
          </div>
        </header>

        {mode === 'admin' ? (
          <section className="rounded-3xl bg-white/85 p-4 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200/70 backdrop-blur-md md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-teal-600" />
              <h2 className="text-lg font-bold text-slate-900">Список официантов</h2>
            </div>

            <form onSubmit={handleAddWaiter} className="flex flex-col gap-2 sm:flex-row">
              <input
                value={newWaiterName}
                onChange={(event) => setNewWaiterName(event.target.value)}
                placeholder="Введите имя нового официанта"
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
              />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <UserRoundPlus size={16} />
                Добавить
              </button>
            </form>

            {waiters.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Список пуст. Добавьте сотрудников, чтобы назначать смены.
              </p>
            ) : (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {waiters.map((waiter) => (
                  <li
                    key={waiter.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: waiter.color }}
                      />
                      <span className="text-sm font-semibold text-slate-700">{waiter.name}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveWaiter(waiter.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
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
          selectedWaiterId={selectedWaiterId}
          onDaySelect={setSelectedDate}
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
