export type AppMode = 'view' | 'admin'

export type Waiter = {
  id: string
  name: string
  color: string
}

export type ShiftsByDate = Record<string, string[]>

export const ALL_WAITERS_FILTER = 'all'
