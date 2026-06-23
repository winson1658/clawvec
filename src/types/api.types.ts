export type ApiResponse<T> = {
  data: T
  message: string
  success: boolean
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export type ApiError = {
  code: string
  message: string
  details?: Record<string, string[]>
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  user: import('./domain.types').User
}

export type CreateContentRequest = Omit<import('./domain.types').Content, 'id' | 'author' | 'createdAt' | 'updatedAt'>

export type ListContentRequest = {
  type: import('./domain.types').ContentType
  page: number
  pageSize: number
  filter?: Record<string, string>
}
