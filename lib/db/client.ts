import Database from "better-sqlite3"
import fs from "fs"
import path from "path"
import { Pool, type PoolClient } from "pg"

const DATA_DIR = path.join(process.cwd(), "data")
const DB_PATH = path.join(DATA_DIR, "proposals.db")

let sqliteDb: Database.Database | null = null
let pgPool: Pool | null = null

export function usePostgres(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

function getSqlite(): Database.Database {
  if (sqliteDb) return sqliteDb
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  sqliteDb = new Database(DB_PATH)
  sqliteDb.pragma("journal_mode = WAL")
  return sqliteDb
}

function getPool(): Pool {
  if (pgPool) return pgPool
  pgPool = new Pool({ connectionString: process.env.DATABASE_URL })
  return pgPool
}

/** Convert ? placeholders to $1, $2 for Postgres */
function toPgSql(sql: string): string {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (usePostgres()) {
    const result = await getPool().query(toPgSql(sql), params)
    return result.rows as T[]
  }
  const db = getSqlite()
  return db.prepare(sql).all(...params) as T[]
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function execute(sql: string, params: unknown[] = []): Promise<void> {
  if (usePostgres()) {
    await getPool().query(toPgSql(sql), params)
    return
  }
  getSqlite().prepare(sql).run(...params)
}

export async function withTransaction<T>(fn: (run: typeof execute) => Promise<T>): Promise<T> {
  if (usePostgres()) {
    const client = await getPool().connect()
    try {
      await client.query("BEGIN")
      const run = async (sql: string, params: unknown[] = []) => {
        await client.query(toPgSql(sql), params)
      }
      const result = await fn(run)
      await client.query("COMMIT")
      return result
    } catch (e) {
      await client.query("ROLLBACK")
      throw e
    } finally {
      client.release()
    }
  }
  const db = getSqlite()
  const run = async (sql: string, params: unknown[] = []) => {
    db.prepare(sql).run(...params)
  }
  db.exec("BEGIN")
  try {
    const result = await fn(run)
    db.exec("COMMIT")
    return result
  } catch (e) {
    db.exec("ROLLBACK")
    throw e
  }
}

export function getSqliteDb(): Database.Database {
  return getSqlite()
}

export async function closeDb(): Promise<void> {
  if (pgPool) {
    await pgPool.end()
    pgPool = null
  }
  if (sqliteDb) {
    sqliteDb.close()
    sqliteDb = null
  }
}
