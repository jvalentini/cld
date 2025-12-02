import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
})

function validateEnv() {
  try {
    return envSchema.parse(import.meta.env)
  } catch (error) {
    console.error('❌ Invalid environment variables:', error.errors)
    throw new Error('Invalid environment variables')
  }
}

export const env = validateEnv()
