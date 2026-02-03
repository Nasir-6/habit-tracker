import { Pool } from 'pg'

let pool: Pool | undefined

export function getPool() {
  if (pool) {
    return pool
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables')
  }

  pool = new Pool({ connectionString })
  return pool
}
