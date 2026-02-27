import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://odmiyxwigdwhzsaveccg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbWl5eHdpZ2R3aHpzYXZlY2NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTg4MTMsImV4cCI6MjA4NzQ5NDgxM30.b1zADnBlTEGpPgssBiv6-bn8QoqaPiGufHJzdQDHOeI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})