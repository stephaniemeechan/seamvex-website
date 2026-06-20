#!/usr/bin/env node
/**
 * HTTP smoke tests for go-live. Run: node scripts/go-live-smoke-test.mjs
 */
const BASE = process.env.SMOKE_BASE_URL ?? "https://seamvex.com"

const checks = [
  { name: "Marketing home", url: `${BASE}/`, expectStatus: [200] },
  { name: "Admin login", url: `${BASE}/admin/login`, expectStatus: [200] },
  { name: "Twilio domain verify", url: `${BASE}/531804029afb8ab9fd1af341c1cac943.html`, expectStatus: [200], bodyIncludes: "twilio-domain-verification" },
  { name: "Legacy sign blocked", url: `${BASE}/sign/test-token`, expectStatus: [404] },
  { name: "Documenso webhook rejects unsigned", url: `${BASE}/api/documenso/webhook`, method: "POST", expectStatus: [401, 503], body: "{}" },
  { name: "Google OAuth configured", url: `${BASE}/api/auth/google`, expectStatus: [302, 303, 307], redirect: "manual" },
]

async function run() {
  let failed = 0
  for (const c of checks) {
    try {
      const res = await fetch(c.url, {
        method: c.method ?? "GET",
        headers: c.body ? { "Content-Type": "application/json" } : undefined,
        body: c.body,
        redirect: c.redirect ?? "follow",
      })
      const text = await res.text()
      const statusOk = c.expectStatus.includes(res.status)
      const bodyOk = !c.bodyIncludes || text.includes(c.bodyIncludes)
      if (statusOk && bodyOk) {
        console.log(`PASS ${c.name} (${res.status})`)
      } else {
        console.error(`FAIL ${c.name} — status ${res.status}, expected ${c.expectStatus.join("|")}`)
        failed++
      }
    } catch (e) {
      console.error(`FAIL ${c.name} — ${e instanceof Error ? e.message : e}`)
      failed++
    }
  }
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed")
  process.exit(failed ? 1 : 0)
}

run()
