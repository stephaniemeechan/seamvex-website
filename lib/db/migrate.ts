import { execute, queryOne, usePostgres } from "@/lib/db/client"

const TABLE_MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS xero_tokens (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at BIGINT NOT NULL,
    tenant_id TEXT NOT NULL,
    tenant_name TEXT
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_sub TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'standard',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    xero_contact_id TEXT UNIQUE,
    company_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive',
    support_info TEXT,
    customer_number TEXT,
    billing_address1 TEXT,
    billing_address2 TEXT,
    billing_address3 TEXT,
    postcode TEXT,
    country TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    accounts_contact TEXT,
    accounts_email TEXT,
    xero_synced_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS contact_attachments (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    title TEXT NOT NULL,
    drive_file_id TEXT,
    drive_url TEXT,
    kind TEXT NOT NULL DEFAULT 'other',
    uploaded_by TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    contact_id TEXT,
    xero_contact_id TEXT,
    company_name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    rollout_status TEXT NOT NULL DEFAULT 'not_started',
    contract_start TEXT,
    contract_end TEXT,
    licensing_mode TEXT,
    deployment TEXT,
    fully_managed INTEGER NOT NULL DEFAULT 0,
    support_type TEXT,
    payment_mode TEXT,
    term_months INTEGER,
    current_lines_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    contract_id TEXT,
    contact_id TEXT,
    document_number TEXT NOT NULL UNIQUE,
    order_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'proposal',
    currency TEXT NOT NULL,
    payment_mode TEXT NOT NULL,
    term_months INTEGER NOT NULL,
    licensing_mode TEXT NOT NULL,
    deployment TEXT NOT NULL,
    fully_managed INTEGER NOT NULL DEFAULT 0,
    support_type TEXT NOT NULL,
    contract_type TEXT NOT NULL,
    collection_method TEXT NOT NULL,
    action_date TEXT NOT NULL,
    contract_start TEXT,
    contract_end TEXT,
    amendment_date TEXT,
    legacy_agreement_date TEXT,
    legacy_document_number TEXT,
    customer_po TEXT,
    notes TEXT,
    order_discount_pct REAL DEFAULT 0,
    order_discount_fixed REAL DEFAULT 0,
    subtotal REAL,
    order_total REAL,
    customer_json TEXT NOT NULL,
    lines_json TEXT NOT NULL,
    sign_token TEXT,
    documenso_document_id TEXT,
    documenso_signing_url TEXT,
    xero_invoice_id TEXT,
    signed_at TEXT,
    signed_pdf_path TEXT,
    customer_signature_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    order_id TEXT,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'normal',
    assignee_user_id TEXT,
    gmail_thread_id TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    ticket_id TEXT,
    contact_id TEXT,
    order_id TEXT,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    assignee_user_id TEXT,
    due_date TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS ticket_activities (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    body TEXT,
    metadata_json TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS email_log (
    id TEXT PRIMARY KEY,
    sent_by_user_id TEXT,
    order_id TEXT,
    ticket_id TEXT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    gmail_message_id TEXT,
    thread_id TEXT,
    created_at TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS user_gmail_tokens (
    user_id TEXT PRIMARY KEY,
    refresh_token_enc TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS user_google_tokens (
    user_id TEXT PRIMARY KEY,
    refresh_token_enc TEXT NOT NULL,
    scopes TEXT,
    updated_at TEXT NOT NULL
  );
  `,
]

const INDEX_MIGRATIONS: string[] = [
  `
  CREATE INDEX IF NOT EXISTS idx_orders_contract ON orders(contract_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_orders_contact ON orders(contact_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_orders_sign_token ON orders(sign_token);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_contacts_xero ON contacts(xero_contact_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_tickets_contact ON tickets(contact_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_user_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_tasks_ticket ON tasks(ticket_id);
  `,
]

async function addColumnIfMissing(table: string, column: string, ddl: string): Promise<void> {
  if (usePostgres()) {
    await execute(
      `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${ddl}`,
    )
    return
  }
  const cols = await queryOne<{ name: string }>(
    `SELECT name FROM pragma_table_info('${table}') WHERE name = ?`,
    [column],
  )
  if (!cols) {
    await execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`)
  }
}

export async function runMigrations(): Promise<void> {
  for (const sql of TABLE_MIGRATIONS) {
    await execute(sql)
  }

  await addColumnIfMissing("orders", "contact_id", "TEXT")
  await addColumnIfMissing("orders", "customer_po", "TEXT")
  await addColumnIfMissing("orders", "documenso_document_id", "TEXT")
  await addColumnIfMissing("orders", "documenso_signing_url", "TEXT")
  await addColumnIfMissing("orders", "xero_invoice_id", "TEXT")
  await addColumnIfMissing("contracts", "contact_id", "TEXT")

  for (const sql of INDEX_MIGRATIONS) {
    await execute(sql)
  }

  const soSeq = await queryOne<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'so_sequence'",
  )
  if (!soSeq) {
    await execute("INSERT INTO settings (key, value) VALUES ('so_sequence', '1000121')")
  }
}
