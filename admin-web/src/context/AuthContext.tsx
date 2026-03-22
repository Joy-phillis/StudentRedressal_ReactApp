import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../services/supabase'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url?: string
  created_at?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      }
    } catch (error) {
      console.error('Error checking session:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data?.role === 'admin') {
        setUser({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          role: data.role,
          avatar_url: data.avatar_url,
          created_at: data.created_at,
        })
      } else {
        // Not an admin, sign out
        await supabase.auth.signOut()
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setUser(null)
    }
  }

  async function login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        await fetchUserProfile(data.user.id)
        return { error: null }
      }

      return { error: 'Login failed' }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
