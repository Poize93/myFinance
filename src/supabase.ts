import { createClient } from '@supabase/supabase-js'

// Read Vite envs and fallback to NEXT_PUBLIC_* if provided
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging
console.log('Supabase Environment Variables:', {
  url: supabaseUrl ? 'Present' : 'Missing',
  key: supabaseAnonKey ? 'Present' : 'Missing',
  urlValue: supabaseUrl?.substring(0, 20) + '...' || 'undefined',
  keyValue: supabaseAnonKey?.substring(0, 20) + '...' || 'undefined'
})

// Helper function to validate URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return url.includes('supabase.co') && !url.includes('your_supabase_project_url')
  } catch {
    return false
  }
}

// Create a dummy client if environment variables are missing or invalid (for development)
export const supabase = (supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl)) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl))

console.log('Supabase Configuration Status:', {
  isConfigured: isSupabaseConfigured,
  clientCreated: !!supabase
})

// Database types
export interface Expense {
  id?: number
  date: string
  amount: number
  remark: string
  bank_type: string
  card_type: string
  expense_type: string
  account_key?: string
  created_at?: string
  updated_at?: string
}

export interface OptionList {
  key: string
  items: string[]
  account_key?: string
  created_at?: string
  updated_at?: string
}

export interface Investment {
  id?: number
  date: string
  investment_mode: string
  investment_type: string
  current_value: number
  investment_amount: number
  return_value: number
  account_key?: string
  created_at?: string
  updated_at?: string
}

export interface User {
  id?: number
  loginid: string
  name: string
  email?: string
  password_hash: string
  account_key?: string
  created_at?: string
  updated_at?: string
}
