import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { toDateKey } from '../hooks/useShiftScheduler'
import { ALL_WAITERS_FILTER, type ShiftsByDate, type Waiter } from '../types'

type ShiftCalendarProps = {
  monthDate: Date
  waiters: Waiter[]
  shiftsByDate: ShiftsByDate
  selectedWaiterId: string
  onDaySelect: (day: Date) => void
}

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function capitalize(value: string): string {
  if (!value.length) {
    return value
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function ShiftCalendar({
  monthDate,
  waiters,
  shiftsByDate,
  selectedWaiterId,
  onDaySelect,
}: ShiftCalendarProps) {
  const calendarStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const waiterMap = new Map(waiters.map((waiter) => [waiter.id, waiter]))

  return (
    <section className="rounded-3xl bg-white/80 p-2 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70 backdrop-blur-md sm:p-3 md:p-4">
      <h2 className="sr-only">Календарь смен</h2>
      <div>
        <div className="mb-2 grid grid-cols-7 gap-1 sm:mb-3 sm:gap-2">
          {weekDays.map((weekDay) => (
            <div
              key={weekDay}
              className="px-0.5 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:px-2 sm:text-xs"
            >
              {weekDay}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day) => {
            const dayKey = toDateKey(day)
            const dayWaiterIds = shiftsByDate[dayKey] ?? []
            const isCurrentMonth = isSameMonth(day, monthDate)
            const hasSelectedFilter = selectedWaiterId !== ALL_WAITERS_FILTER
            const hasSelectedWaiterShift = dayWaiterIds.includes(selectedWaiterId)
            const isDimmed = hasSelectedFilter && !hasSelectedWaiterShift
            const isHighlighted = hasSelectedFilter && hasSelectedWaiterShift

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => onDaySelect(day)}
                className={[
                  'min-h-[4.75rem] rounded-xl border p-1 text-left transition duration-200 sm:min-h-[8rem] sm:rounded-2xl sm:p-2.5',
                  isCurrentMonth
                    ? 'border-slate-200 bg-white/90 shadow-sm shadow-slate-100'
                    : 'border-slate-200/70 bg-slate-50/70',
                  isDimmed ? 'opacity-40' : 'opacity-100',
                  isHighlighted ? 'ring-2 ring-teal-300' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={[
                      'text-xs font-semibold sm:text-sm',
                      isCurrentMonth ? 'text-slate-800' : 'text-slate-400',
                    ].join(' ')}
                  >
                    {format(day, 'd')}
                  </span>
                  {isToday(day) ? <span className="h-1.5 w-1.5 rounded-full bg-sky-500 sm:h-2 sm:w-2" /> : null}
                </div>

                <p className="mt-0.5 text-[9px] font-medium text-slate-400 sm:mt-1 sm:text-[10px]">
                  {capitalize(format(day, 'EEE', { locale: ru }))}
                </p>

                <div className="mt-1 space-y-1 sm:mt-2">
                  {dayWaiterIds.length === 0 ? (
                    <>
                      <p className="rounded-md bg-slate-100 px-1 py-0.5 text-center text-[9px] font-medium text-slate-400 sm:hidden">
                        -
                      </p>
                      <p className="hidden rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-400 sm:block">
                        Нет смен
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1 sm:hidden">
                        {dayWaiterIds.slice(0, 4).map((waiterId) => {
                          const waiter = waiterMap.get(waiterId)

                          if (!waiter) {
                            return null
                          }

                          return (
                            <span
                              key={`${dayKey}-dot-${waiter.id}`}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: waiter.color }}
                            />
                          )
                        })}
                      </div>

                      <div className="hidden space-y-1 sm:block">
                        {dayWaiterIds.slice(0, 3).map((waiterId) => {
                          const waiter = waiterMap.get(waiterId)

                          if (!waiter) {
                            return null
                          }

                          return (
                            <span
                              key={`${dayKey}-${waiter.id}`}
                              className="inline-flex w-full items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700"
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: waiter.color }}
                              />
                              <span className="truncate">{waiter.name}</span>
                            </span>
                          )
                        })}
                        {dayWaiterIds.length > 3 ? (
                          <p className="px-2 text-[10px] font-medium text-slate-500">
                            +{dayWaiterIds.length - 3} еще
                          </p>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
