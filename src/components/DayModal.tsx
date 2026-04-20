import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarDays, ShieldCheck, X } from 'lucide-react'
import type { AppMode, Waiter } from '../types'

type DayModalProps = {
  date: Date | null
  mode: AppMode
  waiters: Waiter[]
  assignedWaiterIds: string[]
  onClose: () => void
  onToggleWaiterShift: (waiterId: string) => void
}

function capitalize(value: string): string {
  if (!value.length) {
    return value
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function DayModal({
  date,
  mode,
  waiters,
  assignedWaiterIds,
  onClose,
  onToggleWaiterShift,
}: DayModalProps) {
  if (!date) {
    return null
  }

  const title = capitalize(format(date, 'd MMMM', { locale: ru }))
  const subtitle = capitalize(format(date, 'EEEE', { locale: ru }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200 transition-colors dark:bg-slate-900 dark:ring-slate-700 sm:p-6"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Детали дня
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            aria-label="Закрыть окно"
          >
            <X size={18} />
          </button>
        </header>

        {mode === 'view' ? (
          <>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
              <CalendarDays size={14} />
              С кем ты работаешь в этот день
            </div>

            {assignedWaiterIds.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                В этот день никто не назначен.
              </p>
            ) : (
              <ul className="space-y-2">
                {assignedWaiterIds.map((waiterId) => {
                  const waiter = waiters.find((item) => item.id === waiterId)

                  if (!waiter) {
                    return null
                  }

                  return (
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
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        ) : (
          <>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              <ShieldCheck size={14} />
              Режим администратора: назначение смен
            </div>

            {waiters.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                Добавьте хотя бы одного официанта, чтобы назначать смены.
              </p>
            ) : (
              <ul className="space-y-2">
                {waiters.map((waiter) => {
                  const checked = assignedWaiterIds.includes(waiter.id)

                  return (
                    <li key={waiter.id}>
                      <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700/80">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: waiter.color }}
                          />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {waiter.name}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleWaiterShift(waiter.id)}
                          className="h-4 w-4 accent-teal-600"
                        />
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  )
}
