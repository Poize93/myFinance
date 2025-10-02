import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabaseDb } from '../supabaseDb'
import type { User, AuthState, LoginCredentials, RegisterData } from '../types/auth'

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })

  // Check for existing session on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...')
        const userId = localStorage.getItem('userId')
        console.log('Stored userId:', userId)
        
        // Create a default test user if no users exist
        const storedUsers = JSON.parse(localStorage.getItem('offlineUsers') || '[]')
        if (storedUsers.length === 0) {
          const defaultUser = {
            id: 1,
            loginId: 'testuser',
            password: 'password123',
            name: 'Test User',
            email: 'test@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          localStorage.setItem('offlineUsers', JSON.stringify([defaultUser]))
          console.log('Created default test user')
        }
        
        if (userId) {
          // Check if Supabase is configured
          const { isSupabaseConfigured } = await import('../supabase')
          console.log('Supabase configured:', isSupabaseConfigured)
          
          if (!isSupabaseConfigured) {
            // Offline mode - check local storage
            const storedUsers = JSON.parse(localStorage.getItem('offlineUsers') || '[]')
            console.log('Stored users:', storedUsers)
            const user = storedUsers.find((u: any) => u.id.toString() === userId)
            console.log('Found user:', user)
            
            if (user) {
              const offlineUser: User = {
                id: user.id,
                loginid: user.loginId,
                name: user.name,
                email: user.email,
                account_key: user.account_key || 'offline-account',
                created_at: user.created_at,
                updated_at: user.updated_at
              }
              
              console.log('Setting authenticated user:', offlineUser)
              setAuthState({
                user: offlineUser,
                isAuthenticated: true,
                isLoading: false
              })
              return
            }
          } else {
            // Supabase mode
            const user = await supabaseDb.getUserById(parseInt(userId))
            if (user && user.id) {
              if ((user as any).account_key) {
                localStorage.setItem('account_key', (user as any).account_key as string)
              }
              setAuthState({
                user: user as User,
                isAuthenticated: true,
                isLoading: false
              })
              return
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
      console.log('Setting unauthenticated state')
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }

    checkAuth()
  }, [])

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Login attempt with credentials:', { loginId: credentials.loginId, password: '[HIDDEN]' })
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      // Check if Supabase is configured
      const { isSupabaseConfigured } = await import('../supabase')
      console.log('Supabase configured for login:', isSupabaseConfigured)
      
      if (!isSupabaseConfigured) {
        // Offline mode - use simple local authentication
        const storedUsers = JSON.parse(localStorage.getItem('offlineUsers') || '[]')
        console.log('Stored users for login:', storedUsers)
        const user = storedUsers.find((u: any) => u.loginId === credentials.loginId)
        if (!user) {
          setAuthState(prev => ({ ...prev, isLoading: false }))
          return { success: false, message: 'User does not exist' }
        }
        if (user.password !== credentials.password) {
          setAuthState(prev => ({ ...prev, isLoading: false }))
          return { success: false, message: 'Incorrect password' }
        }

        {
          const offlineUser: User = {
            id: user.id,
            loginid: user.loginId,
            name: user.name,
            email: user.email,
            account_key: user.account_key || 'offline-account',
            created_at: user.created_at,
            updated_at: user.updated_at
          }
          
          console.log('Setting userId in localStorage:', user.id.toString())
          localStorage.setItem('userId', user.id.toString())
          console.log('Setting authenticated state')
          setAuthState({
            user: offlineUser,
            isAuthenticated: true,
            isLoading: false
          })
          return { success: true, message: 'Login successful (offline mode)' }
        }
      }
      
      // Supabase mode
      const result = await supabaseDb.authenticateUser(credentials.loginId, credentials.password)
      
      if (result.success && result.user && result.user.id) {
        localStorage.setItem('userId', result.user.id.toString())
        if ((result.user as any).account_key) {
          localStorage.setItem('account_key', (result.user as any).account_key as string)
        }
        setAuthState({
          user: result.user as User,
          isAuthenticated: true,
          isLoading: false
        })
        return { success: true, message: 'Login successful' }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return { success: false, message: result.message || 'Login failed' }
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { success: false, message: 'An error occurred during login' }
    }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      // Check if Supabase is configured
      const { isSupabaseConfigured } = await import('../supabase')
      
      if (!isSupabaseConfigured) {
        // Offline mode - store user locally
        const storedUsers = JSON.parse(localStorage.getItem('offlineUsers') || '[]')
        
        // Check if user already exists
        const existingUser = storedUsers.find((u: any) => u.loginId === data.loginId)
        if (existingUser) {
          setAuthState(prev => ({ ...prev, isLoading: false }))
          return { success: false, message: 'User with this login ID already exists' }
        }
        
        // Create new user
        const newUser = {
          id: Date.now(), // Simple ID generation
          loginId: data.loginId,
          password: data.password,
          name: data.name,
          email: data.email || '',
          account_key: 'offline-account',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        storedUsers.push(newUser)
        localStorage.setItem('offlineUsers', JSON.stringify(storedUsers))
        
        const offlineUser: User = {
          id: newUser.id,
          loginid: newUser.loginId,
          name: newUser.name,
          email: newUser.email,
          account_key: newUser.account_key,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at
        }
        
        localStorage.setItem('userId', newUser.id.toString())
        setAuthState({
          user: offlineUser,
          isAuthenticated: true,
          isLoading: false
        })
        return { success: true, message: 'Registration successful (offline mode)' }
      }
      
      // Supabase mode
      const result = await supabaseDb.createUser(data)
      
      if (result.success && result.user && result.user.id) {
        localStorage.setItem('userId', result.user.id.toString())
        if ((result.user as any).account_key) {
          localStorage.setItem('account_key', (result.user as any).account_key as string)
        }
        setAuthState({
          user: result.user as User,
          isAuthenticated: true,
          isLoading: false
        })
        return { success: true, message: 'Registration successful' }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return { success: false, message: result.message || 'Registration failed' }
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { success: false, message: 'An error occurred during registration' }
    }
  }

  const logout = () => {
    console.log('Logging out user')
    localStorage.removeItem('userId')
    localStorage.removeItem('account_key')
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
  }

  // Debug function to check current auth state
  const debugAuthState = () => {
    console.log('Current auth state:', authState)
    console.log('LocalStorage userId:', localStorage.getItem('userId'))
    console.log('LocalStorage offlineUsers:', localStorage.getItem('offlineUsers'))
  }

  // Expose debug function globally for testing
  if (typeof window !== 'undefined') {
    (window as any).debugAuth = debugAuthState
  }

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
