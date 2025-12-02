// quiz-app/src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'
import { env } from './config/env.js'

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
