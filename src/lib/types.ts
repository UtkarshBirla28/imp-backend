export interface Restaurant {
  id: string
  name: string
  image: string
  cuisine: string
  isCustom?: boolean
}

export interface DateAssignment {
  [dateKey: string]: Restaurant | null
}

export interface Promise {
  id: string
  text: string
  completed: boolean
  isCustom: boolean
  sortOrder?: number
  createdAt: string   // ← new (matches DB)
  updatedAt: string   // ← new (matches DB)
}