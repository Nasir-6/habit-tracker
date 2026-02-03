import { drizzle } from 'drizzle-orm/node-postgres'

import * as schema from './schema.ts'
import { getPool } from './pool.ts'

export const db = drizzle(getPool(), { schema })
