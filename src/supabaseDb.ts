import { supabase, isSupabaseConfigured, type Expense, type OptionList, type Investment, type User } from './supabase'

export class SupabaseDB {
  private generateAccountKey(): string {
    try {
      return (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)
    } catch {
      return Math.random().toString(36).slice(2) + Date.now().toString(36)
    }
  }

  private getAccountKey(): string | null {
    try {
      return localStorage.getItem('account_key')
    } catch {
      return null
    }
  }
  // Test Supabase connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { 
        success: false, 
        message: 'Supabase is not configured. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY' 
      }
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (error) {
        console.error('Supabase connection test failed:', error)
        return { success: false, message: `Connection failed: ${error.message}` }
      }

      console.log('Supabase connection test successful')
      return { success: true, message: 'Connection successful' }
    } catch (error) {
      console.error('Supabase connection test error:', error)
      return { success: false, message: `Connection error: ${error}` }
    }
  }

  // Simple password hashing function (in production, use a proper library like bcrypt)
  private hashPassword(password: string): string {
    // Simple hash for demo purposes - in production use proper hashing
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  // User authentication operations
  async createUser(userData: { loginId: string; password: string; name: string; email?: string }): Promise<{ success: boolean; user?: Omit<User, 'password_hash'>; message?: string }> {
    console.log('createUser called with:', { ...userData, password: '[HIDDEN]' })
    
    if (!isSupabaseConfigured || !supabase) {
      console.error('Supabase not configured:', { isSupabaseConfigured, supabase: !!supabase })
      return { success: false, message: 'Supabase is not configured. Please check your .env file.' }
    }

    try {
      console.log('Checking if user exists...')
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('loginid', userData.loginId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking existing user:', checkError)
        return { success: false, message: 'Error checking user existence' }
      }

      if (existingUser) {
        console.log('User already exists:', existingUser)
        return { success: false, message: 'User with this login ID already exists' }
      }

      const passwordHash = this.hashPassword(userData.password)
      const accountKey = this.generateAccountKey()
      const userToInsert = {
        loginid: userData.loginId,
        name: userData.name,
        email: userData.email || null,
        password_hash: passwordHash,
        account_key: accountKey
      }

      console.log('Inserting user:', { ...userToInsert, password_hash: '[HIDDEN]' })

      const { data, error } = await supabase
        .from('users')
        .insert([userToInsert])
        .select('id, loginid, name, email, account_key, created_at, updated_at')
        .single()

      if (error) {
        console.error('Error creating user:', error)
        return { success: false, message: `Failed to create user: ${error.message}` }
      }

      console.log('User created successfully:', data)
      return { success: true, user: data }
    } catch (error) {
      console.error('Error in createUser:', error)
      return { success: false, message: `An error occurred while creating user: ${error}` }
    }
  }

  async authenticateUser(loginId: string, password: string): Promise<{ success: boolean; user?: Omit<User, 'password_hash'>; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase is not configured. Please check your .env file.' }
    }

    try {
      const passwordHash = this.hashPassword(password)

      // First: check if user exists
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id, loginid, name, email, account_key, created_at, updated_at, password_hash')
        .eq('loginid', loginId)
        .single()

      if (userError) {
        // PGRST116 = No rows found
        if ((userError as any).code === 'PGRST116') {
          return { success: false, message: 'User does not exist' }
        }
        return { success: false, message: 'An error occurred during authentication' }
      }

      if (!userRow) {
        return { success: false, message: 'User does not exist' }
      }

      if (userRow.password_hash !== passwordHash) {
        return { success: false, message: 'Incorrect password' }
      }

      const { password_hash: _omit, ...safeUser } = userRow as any
      return { success: true, user: safeUser }
    } catch (error) {
      console.error('Error in authenticateUser:', error)
      return { success: false, message: 'An error occurred during authentication' }
    }
  }

  async getUserById(id: number): Promise<Omit<User, 'password_hash'> | null> {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, loginid, name, email, account_key, created_at, updated_at')
        .eq('id', id)
        .single()

      if (error || !data) {
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getUserById:', error)
      return null
    }
  }

  // Expense operations
  async addExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env file.')
    }
    const accountKey = this.getAccountKey()
    if (!accountKey) {
      throw new Error('Account key is missing')
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...expense, account_key: accountKey }])
      .select('id')
      .single()

    if (error) {
      console.error('Error adding expense:', error)
      throw error
    }

    return data.id
  }

  async getExpenses(): Promise<Expense[]> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env file.')
    }
    const accountKey = this.getAccountKey()
    if (!accountKey) {
      throw new Error('Account key is missing')
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('account_key', accountKey)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching expenses:', error)
      throw error
    }

    return data || []
  }

  async updateExpense(id: number, expense: Partial<Expense>): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env file.')
    }
    const accountKey = this.getAccountKey()
    if (!accountKey) {
      throw new Error('Account key is missing')
    }

    const { error } = await supabase
      .from('expenses')
      .update({ ...expense, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('account_key', accountKey)

    if (error) {
      console.error('Error updating expense:', error)
      throw error
    }
  }

  async deleteExpense(id: number): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env file.')
    }
    const accountKey = this.getAccountKey()
    if (!accountKey) {
      throw new Error('Account key is missing')
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('account_key', accountKey)

    if (error) {
      console.error('Error deleting expense:', error)
      throw error
    }
  }

  // Option list operations
  async getOptionList(key: string): Promise<OptionList | null> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env file.')
    }
    const accountKey = this.getAccountKey()
    if (!accountKey) {
      throw new Error('Account key is missing')
    }

    const { data, error } = await supabase
      .from('option_lists')
      .select('*')
      .eq('key', key)
      .eq('account_key', accountKey)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching option list:', error)
      throw error
    }

    return data
  }

  async getOptionLists(): Promise<OptionList[]> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env file.')
    }
    const accountKey = this.getAccountKey()
    if (!accountKey) {
      throw new Error('Account key is missing')
    }

    const { data, error } = await supabase
      .from('option_lists')
      .select('*')
      .eq('account_key', accountKey)

    if (error) {
      console.error('Error fetching option lists:', error)
      throw error
    }

    return data || []
  }

  async upsertOptionList(optionList: Omit<OptionList, 'created_at' | 'updated_at'>): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env file.')
    }
    const accountKey = this.getAccountKey()
    if (!accountKey) {
      throw new Error('Account key is missing')
    }

    const { error } = await supabase
      .from('option_lists')
      .upsert([{ ...optionList, account_key: accountKey }], { onConflict: 'key' })

    if (error) {
      console.error('Error upserting option list:', error)
      throw error
    }
  }

  async deleteOptionList(key: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env file.')
    }
    const accountKey = this.getAccountKey()
    if (!accountKey) {
      throw new Error('Account key is missing')
    }

    const { error } = await supabase
      .from('option_lists')
      .delete()
      .eq('key', key)
      .eq('account_key', accountKey)

    if (error) {
      console.error('Error deleting option list:', error)
      throw error
    }
  }

  // Investment operations
  async addInvestment(investment: Omit<Investment, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env file.')
    }
    const accountKey = this.getAccountKey()
    if (!accountKey) {
      throw new Error('Account key is missing')
    }

    const { data, error } = await supabase
      .from('investments')
      .insert([{ ...investment, account_key: accountKey }])
      .select('id')
      .single()

    if (error) {
      console.error('Error adding investment:', error)
      throw error
    }

    return data.id
  }

  async getInvestments(): Promise<Investment[]> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env file.')
    }
    const accountKey = this.getAccountKey()
    if (!accountKey) {
      throw new Error('Account key is missing')
    }

    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('account_key', accountKey)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching investments:', error)
      throw error
    }

    return data || []
  }

  async updateInvestment(id: number, investment: Partial<Investment>): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env file.')
    }
    const accountKey = this.getAccountKey()
    if (!accountKey) {
      throw new Error('Account key is missing')
    }

    const { error } = await supabase
      .from('investments')
      .update({ ...investment, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('account_key', accountKey)

    if (error) {
      console.error('Error updating investment:', error)
      throw error
    }
  }

  async deleteInvestment(id: number): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env file.')
    }
    const accountKey = this.getAccountKey()
    if (!accountKey) {
      throw new Error('Account key is missing')
    }

    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id)
      .eq('account_key', accountKey)

    if (error) {
      console.error('Error deleting investment:', error)
      throw error
    }
  }
}

export const supabaseDb = new SupabaseDB()
