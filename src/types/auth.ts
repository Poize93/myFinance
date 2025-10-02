export interface User {
  id: number
  loginid: string
  name: string
  email?: string
  account_key: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  loginId: string
  password: string
}

export interface RegisterData {
  loginId: string
  password: string
  name: string
  email?: string
}
