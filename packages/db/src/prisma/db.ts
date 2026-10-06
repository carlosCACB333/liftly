import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

function createDb() {
  return postgres<Contract>({
    contractJson,
    url: process.env.DATABASE_URL!,
  })
}

// Singleton para que el hot reload de Next no abra conexiones nuevas
const g = globalThis as unknown as { __db?: ReturnType<typeof createDb> }
export const db = g.__db ?? createDb()
if (process.env.NODE_ENV !== "production") g.__db = db