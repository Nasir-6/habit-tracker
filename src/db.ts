import { getPool } from '@/db/pool'

export function getClient() {
  if (!process.env.DATABASE_URL) {
    return undefined
  }

  return getPool()
}
