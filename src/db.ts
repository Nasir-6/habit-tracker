import { getPool } from '@/db/pool'

export async function getClient() {
  if (!process.env.DATABASE_URL) {
    return undefined
  }

  return getPool()
}
