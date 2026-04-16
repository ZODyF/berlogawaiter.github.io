import { addDays, addMonths, endOfMonth, format, isWeekend, startOfMonth } from 'date-fns'
import { useEffect, useState } from 'react'
import type { ShiftsByDate, Waiter } from '../types'

const WAITERS_STORAGE_KEY = 'waiter-shift-calendar.waiters.v1'
const SHIFTS_STORAGE_KEY = 'waiter-shift-calendar.shifts.v1'

const WAITER_COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#6366f1', '#10b981']
const DEFAULT_WAITER_NAMES = ['Анна', 'Максим', 'София', 'Илья', 'Ева']

function toSafeJson<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function isWaiter(item: unknown): item is Waiter {
  if (typeof item !== 'object' || item === null) {
    return false
  }

  const maybeWaiter = item as Waiter
  return (
    typeof maybeWaiter.id === 'string' &&
    typeof maybeWaiter.name === 'string' &&
    typeof maybeWaiter.color === 'string'
  )
}

function normalizeWaiters(data: unknown): Waiter[] {
  if (!Array.isArray(data)) {
    return []
  }

  return data.filter(isWaiter)
}

function normalizeShifts(data: unknown): ShiftsByDate {
  if (typeof data !== 'object' || data === null) {
    return {}
  }

  const result: ShiftsByDate = {}

  for (const [date, waiterIds] of Object.entries(data)) {
    if (Array.isArray(waiterIds)) {
      result[date] = waiterIds.filter((waiterId): waiterId is string => typeof waiterId === 'string')
    }
  }

  return result
}

function buildInitialWaiters(): Waiter[] {
  return DEFAULT_WAITER_NAMES.map((name, index) => ({
    id: `waiter-${index + 1}`,
    name,
    color: WAITER_COLORS[index % WAITER_COLORS.length],
  }))
}

function buildInitialShifts(waiters: Waiter[]): ShiftsByDate {
  const result: ShiftsByDate = {}

  if (waiters.length === 0) {
    return result
  }

  const start = startOfMonth(addMonths(new Date(), -1))
  const end = endOfMonth(addMonths(new Date(), 1))

  let current = start
  let dayIndex = 0

  while (current <= end) {
    const shiftsPerDay = isWeekend(current) ? Math.min(3, waiters.length) : Math.min(2, waiters.length)
    const assigned: string[] = []

    for (let index = 0; index < shiftsPerDay; index += 1) {
      assigned.push(waiters[(dayIndex + index) % waiters.length].id)
    }

    result[toDateKey(current)] = assigned
    current = addDays(current, 1)
    dayIndex += 1
  }

  return result
}

function generateWaiterId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `waiter-${Date.now()}`
}

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function useShiftScheduler() {
  const [{ initialWaiters, initialShifts }] = useState(() => {
    const fallbackWaiters = buildInitialWaiters()

    if (typeof window === 'undefined') {
      return {
        initialWaiters: fallbackWaiters,
        initialShifts: buildInitialShifts(fallbackWaiters),
      }
    }

    const savedWaiters = normalizeWaiters(
      toSafeJson<unknown>(window.localStorage.getItem(WAITERS_STORAGE_KEY), fallbackWaiters),
    )

    const waiters = savedWaiters.length > 0 ? savedWaiters : fallbackWaiters

    const savedShifts = normalizeShifts(
      toSafeJson<unknown>(window.localStorage.getItem(SHIFTS_STORAGE_KEY), {}),
    )

    return {
      initialWaiters: waiters,
      initialShifts: Object.keys(savedShifts).length > 0 ? savedShifts : buildInitialShifts(waiters),
    }
  })

  const [waiters, setWaiters] = useState<Waiter[]>(initialWaiters)
  const [shiftsByDate, setShiftsByDate] = useState<ShiftsByDate>(initialShifts)

  useEffect(() => {
    window.localStorage.setItem(WAITERS_STORAGE_KEY, JSON.stringify(waiters))
  }, [waiters])

  useEffect(() => {
    window.localStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(shiftsByDate))
  }, [shiftsByDate])

  const addWaiter = (rawName: string): boolean => {
    const name = rawName.trim()

    if (!name) {
      return false
    }

    if (waiters.some((waiter) => waiter.name.toLowerCase() === name.toLowerCase())) {
      return false
    }

    const waiter: Waiter = {
      id: generateWaiterId(),
      name,
      color: WAITER_COLORS[waiters.length % WAITER_COLORS.length],
    }

    setWaiters((previous) => [...previous, waiter])
    return true
  }

  const removeWaiter = (waiterId: string) => {
    setWaiters((previous) => previous.filter((waiter) => waiter.id !== waiterId))
    setShiftsByDate((previous) => {
      const next: ShiftsByDate = {}

      for (const [dateKey, waiterIds] of Object.entries(previous)) {
        next[dateKey] = waiterIds.filter((id) => id !== waiterId)
      }

      return next
    })
  }

  const toggleShiftForDate = (dateKey: string, waiterId: string) => {
    setShiftsByDate((previous) => {
      const dayShifts = previous[dateKey] ?? []
      const hasShift = dayShifts.includes(waiterId)

      const nextDayShifts = hasShift
        ? dayShifts.filter((id) => id !== waiterId)
        : [...dayShifts, waiterId]

      return {
        ...previous,
        [dateKey]: nextDayShifts,
      }
    })
  }

  return {
    waiters,
    shiftsByDate,
    addWaiter,
    removeWaiter,
    toggleShiftForDate,
  }
}
