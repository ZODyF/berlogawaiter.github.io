import { addDays, addMonths, endOfMonth, format, isWeekend, startOfMonth } from 'date-fns'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getDatabase, onValue, ref, set, type DatabaseReference } from 'firebase/database'
import { useEffect, useState } from 'react'
import type { ShiftsByDate, Waiter } from '../types'

const WAITERS_STORAGE_KEY = 'waiter-shift-calendar.waiters.v1'
const SHIFTS_STORAGE_KEY = 'waiter-shift-calendar.shifts.v1'

const WAITER_COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#6366f1', '#10b981']
const DEFAULT_WAITER_NAMES = ['Анна', 'Максим', 'София', 'Илья', 'Ева']

type SyncMode = 'cloud' | 'local'

function createSharedScheduleRef(): DatabaseReference | null {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  const hasAllConfig = Object.values(firebaseConfig).every(
    (value) => typeof value === 'string' && value.length > 0,
  )

  if (!hasAllConfig) {
    return null
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
    return ref(getDatabase(app), 'waiterShiftCalendar/sharedSchedule')
  } catch {
    return null
  }
}

const sharedScheduleRef = createSharedScheduleRef()

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
  const [syncError, setSyncError] = useState<string | null>(null)

  const syncMode: SyncMode = sharedScheduleRef ? 'cloud' : 'local'

  const syncCloudState = (nextWaiters: Waiter[], nextShiftsByDate: ShiftsByDate) => {
    if (!sharedScheduleRef) {
      return
    }

    void set(sharedScheduleRef, {
      waiters: nextWaiters,
      shiftsByDate: nextShiftsByDate,
      updatedAt: Date.now(),
    })
      .then(() => {
        setSyncError(null)
      })
      .catch(() => {
        setSyncError('Не удалось синхронизировать смены с облаком.')
      })
  }

  useEffect(() => {
    if (!sharedScheduleRef) {
      return
    }

    const unsubscribe = onValue(
      sharedScheduleRef,
      (snapshot) => {
        const value = snapshot.val() as {
          waiters?: unknown
          shiftsByDate?: unknown
        } | null

        if (!value) {
          syncCloudState(initialWaiters, initialShifts)
          return
        }

        const nextWaiters = normalizeWaiters(value.waiters)
        const nextShifts = normalizeShifts(value.shiftsByDate)

        setWaiters(nextWaiters.length > 0 ? nextWaiters : initialWaiters)
        setShiftsByDate(nextShifts)
        setSyncError(null)
      },
      () => {
        setSyncError('Не удалось получить данные из облака.')
      },
    )

    return () => unsubscribe()
  }, [initialShifts, initialWaiters])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(WAITERS_STORAGE_KEY, JSON.stringify(waiters))
  }, [waiters])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

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

    const nextWaiters = [...waiters, waiter]
    setWaiters(nextWaiters)
    syncCloudState(nextWaiters, shiftsByDate)
    return true
  }

  const removeWaiter = (waiterId: string) => {
    const nextWaiters = waiters.filter((waiter) => waiter.id !== waiterId)
    const nextShifts: ShiftsByDate = {}

    for (const [dateKey, waiterIds] of Object.entries(shiftsByDate)) {
      nextShifts[dateKey] = waiterIds.filter((id) => id !== waiterId)
    }

    setWaiters(nextWaiters)
    setShiftsByDate(nextShifts)
    syncCloudState(nextWaiters, nextShifts)
  }

  const toggleShiftForDate = (dateKey: string, waiterId: string) => {
    const dayShifts = shiftsByDate[dateKey] ?? []
    const hasShift = dayShifts.includes(waiterId)

    const nextDayShifts = hasShift
      ? dayShifts.filter((id) => id !== waiterId)
      : [...dayShifts, waiterId]

    const nextShifts = {
      ...shiftsByDate,
      [dateKey]: nextDayShifts,
    }

    setShiftsByDate(nextShifts)
    syncCloudState(waiters, nextShifts)
  }

  return {
    waiters,
    shiftsByDate,
    syncMode,
    syncError,
    addWaiter,
    removeWaiter,
    toggleShiftForDate,
  }
}
