import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface RSVPRecord {
  id?: string
  full_name: string
  email: string
  attending: boolean
  guests: number
  notes?: string
  ip_address?: string
  user_agent?: string
  created_at?: string
}
