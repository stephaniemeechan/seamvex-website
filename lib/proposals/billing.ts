/** Billing starts 1st of month; if action is already on the 1st, same day. */
export function billingStart(actionDate: Date): Date {
  if (actionDate.getUTCDate() === 1) {
    return new Date(Date.UTC(actionDate.getUTCFullYear(), actionDate.getUTCMonth(), 1))
  }
  return new Date(Date.UTC(actionDate.getUTCFullYear(), actionDate.getUTCMonth() + 1, 1))
}

export function addMonthsUtc(start: Date, months: number): Date {
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, start.getUTCDate()))
}

/** Last day of term: day before start + term months */
export function contractEndFromStart(start: Date, termMonths: number): Date {
  const endExclusive = addMonthsUtc(start, termMonths)
  return new Date(endExclusive.getTime() - 24 * 60 * 60 * 1000)
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function daysInclusive(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1
}

export function bfLabelFromTerm(termMonths: number): string {
  switch (termMonths) {
    case 1:
      return "Monthly"
    case 3:
      return "3-monthly"
    case 4:
      return "4-monthly"
    case 6:
      return "6-monthly"
    case 12:
      return "Annual"
    default:
      return `${termMonths}-monthly`
  }
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

/** Human-readable contract period from action date + term. */
export function contractPeriodFromAction(
  actionDate: string,
  termMonths: number,
): { start: string; end: string; startLabel: string; endLabel: string } {
  const action = parseIsoDate(actionDate)
  const start = billingStart(action)
  const end = contractEndFromStart(start, termMonths)
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
    startLabel: fmt(start),
    endLabel: fmt(end),
  }
}
