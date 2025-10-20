/**
 * Beitragsverwaltungs-Service
 *
 * Business Logic für:
 * - Automatische Beitragsberechnung
 * - Wiederkehrende Rechnungserstellung
 * - Zahlungsverarbeitung
 * - Mahnwesen
 */

import { addMonths, addYears, addDays, differenceInDays, format, parseISO } from 'date-fns'
import {
  ContributionDefinition,
  MemberContribution,
  ContributionInvoice,
  ContributionInvoiceInsert,
  RecurrenceInterval,
  ContributionCalculation,
  ReminderLevel,
  Member,
  ContributionReminderInsert
} from '@/types/membership.types'

/**
 * Berechnet das nächste Fälligkeitsdatum basierend auf dem Intervall
 */
export function calculateNextDueDate(
  startDate: Date,
  interval: RecurrenceInterval
): Date {
  switch (interval) {
    case 'monthly':
      return addMonths(startDate, 1)
    case 'quarterly':
      return addMonths(startDate, 3)
    case 'semi_annual':
      return addMonths(startDate, 6)
    case 'annual':
      return addYears(startDate, 1)
    case 'one_time':
      return startDate
    default:
      throw new Error(`Invalid recurrence interval: ${interval}`)
  }
}

/**
 * Berechnet den Zeitraum für eine wiederkehrende Rechnung
 */
export function calculateInvoicePeriod(
  startDate: Date,
  interval: RecurrenceInterval
): { period_start: Date; period_end: Date } {
  const period_start = startDate
  const period_end = calculateNextDueDate(startDate, interval)

  return {
    period_start,
    period_end: addDays(period_end, -1) // Einen Tag zurück für korrektes Enddatum
  }
}

/**
 * Berechnet Beitrag inklusive Steuer
 */
export function calculateContributionAmount(
  baseAmount: number,
  taxRate: number = 0,
  interval: RecurrenceInterval = 'annual'
): ContributionCalculation {
  const tax_amount = baseAmount * (taxRate / 100)
  const total_amount = baseAmount + tax_amount

  const period_start = format(new Date(), 'yyyy-MM-dd')
  const { period_end } = calculateInvoicePeriod(new Date(), interval)

  return {
    base_amount: baseAmount,
    tax_amount,
    total_amount,
    period_start,
    period_end: format(period_end, 'yyyy-MM-dd'),
    interval
  }
}

/**
 * Generiert Rechnung aus Mitgliedsbeitrag
 */
export function generateInvoiceFromContribution(
  member: Member,
  contribution: MemberContribution,
  definition: ContributionDefinition,
  invoiceDate: Date = new Date()
): Omit<ContributionInvoiceInsert, 'invoice_number'> {
  const interval = contribution.custom_interval || definition.recurrence_interval || 'annual'
  const amount = contribution.custom_amount || definition.amount

  const { period_start, period_end } = calculateInvoicePeriod(invoiceDate, interval)
  const dueDate = addDays(invoiceDate, 14) // 14 Tage Zahlungsziel

  const calculation = calculateContributionAmount(amount, 0, interval)

  // Bestimme Zahlungsmethode basierend auf SEPA-Mandat
  const payment_method = member.sepa_mandate_status === 'active' ? 'sepa_debit' : 'bank_transfer'

  return {
    member_id: member.id,
    member_contribution_id: contribution.id,
    invoice_date: format(invoiceDate, 'yyyy-MM-dd'),
    due_date: format(dueDate, 'yyyy-MM-dd'),
    period_start: format(period_start, 'yyyy-MM-dd'),
    period_end: format(period_end, 'yyyy-MM-dd'),
    amount: calculation.base_amount,
    tax_amount: calculation.tax_amount,
    total_amount: calculation.total_amount,
    currency: definition.currency,
    payment_method,
    description: `${definition.name} für Zeitraum ${format(period_start, 'dd.MM.yyyy')} - ${format(period_end, 'dd.MM.yyyy')}`,
    line_items: [
      {
        description: definition.name,
        quantity: 1,
        unit_price: calculation.base_amount,
        total: calculation.base_amount,
        tax_rate: 0
      }
    ]
  }
}

/**
 * Prüft ob eine Rechnung überfällig ist
 */
export function isInvoiceOverdue(invoice: ContributionInvoice): boolean {
  if (invoice.payment_status === 'paid' || invoice.payment_status === 'cancelled') {
    return false
  }

  const dueDate = parseISO(invoice.due_date)
  const today = new Date()

  return differenceInDays(today, dueDate) > 0
}

/**
 * Berechnet Tage seit Fälligkeit
 */
export function getDaysOverdue(invoice: ContributionInvoice): number {
  if (!isInvoiceOverdue(invoice)) {
    return 0
  }

  const dueDate = parseISO(invoice.due_date)
  const today = new Date()

  return differenceInDays(today, dueDate)
}

/**
 * Bestimmt Mahnstufe basierend auf überfälligen Tagen
 */
export function determineReminderLevel(daysOverdue: number): ReminderLevel | null {
  if (daysOverdue < 7) {
    return null // Noch keine Mahnung
  } else if (daysOverdue < 21) {
    return 1 // Erste Mahnung nach 7 Tagen
  } else if (daysOverdue < 35) {
    return 2 // Zweite Mahnung nach 21 Tagen
  } else {
    return 3 // Dritte Mahnung nach 35 Tagen
  }
}

/**
 * Berechnet Mahngebühr basierend auf Mahnstufe
 */
export function calculateReminderFee(reminderLevel: ReminderLevel): number {
  const fees: Record<ReminderLevel, number> = {
    1: 5.00,   // Erste Mahnung: 5 EUR
    2: 10.00,  // Zweite Mahnung: 10 EUR
    3: 15.00   // Dritte Mahnung: 15 EUR
  }

  return fees[reminderLevel]
}

/**
 * Generiert Mahnung für überfällige Rechnung
 */
export function generateReminder(
  invoice: ContributionInvoice,
  member: Member,
  reminderLevel: ReminderLevel
): Omit<ContributionReminderInsert, 'reminder_number'> {
  const reminderFee = calculateReminderFee(reminderLevel)
  const totalAmount = (invoice.total_amount - invoice.paid_amount) + reminderFee

  // Zahlungsfrist: 7 Tage ab Mahnung
  const paymentDeadline = addDays(new Date(), 7)

  const reminderTexts: Record<ReminderLevel, string> = {
    1: 'Erste Zahlungserinnerung',
    2: 'Zweite Mahnung',
    3: 'Letzte Mahnung vor rechtlichen Schritten'
  }

  return {
    invoice_id: invoice.id,
    member_id: member.id,
    reminder_level: reminderLevel,
    reminder_date: format(new Date(), 'yyyy-MM-dd'),
    original_amount: invoice.total_amount - invoice.paid_amount,
    reminder_fee: reminderFee,
    total_amount: totalAmount,
    payment_deadline: format(paymentDeadline, 'yyyy-MM-dd'),
    description: `${reminderTexts[reminderLevel]} für Rechnung ${invoice.invoice_number}`,
    sent_via: member.email ? 'email' : 'post'
  }
}

/**
 * Prüft ob Rechnung eine Mahnung benötigt
 */
export function shouldSendReminder(invoice: ContributionInvoice): {
  shouldSend: boolean
  level: ReminderLevel | null
} {
  if (!isInvoiceOverdue(invoice)) {
    return { shouldSend: false, level: null }
  }

  const daysOverdue = getDaysOverdue(invoice)
  const level = determineReminderLevel(daysOverdue)

  // Keine Mahnung wenn bereits auf höherer Stufe gemahnt wurde
  if (level && level <= invoice.reminder_level) {
    return { shouldSend: false, level: null }
  }

  return { shouldSend: level !== null, level }
}

/**
 * Berechnet Statistiken für Mitgliedsbeiträge
 */
export function calculateMembershipStatistics(
  invoices: ContributionInvoice[]
): {
  total_revenue: number
  paid_revenue: number
  pending_revenue: number
  overdue_revenue: number
  invoice_count: number
  paid_count: number
  overdue_count: number
} {
  const stats = invoices.reduce(
    (acc, invoice) => {
      acc.total_revenue += invoice.total_amount
      acc.invoice_count++

      if (invoice.payment_status === 'paid') {
        acc.paid_revenue += invoice.total_amount
        acc.paid_count++
      } else if (isInvoiceOverdue(invoice)) {
        acc.overdue_revenue += invoice.total_amount - invoice.paid_amount
        acc.overdue_count++
      } else {
        acc.pending_revenue += invoice.total_amount - invoice.paid_amount
      }

      return acc
    },
    {
      total_revenue: 0,
      paid_revenue: 0,
      pending_revenue: 0,
      overdue_revenue: 0,
      invoice_count: 0,
      paid_count: 0,
      overdue_count: 0
    }
  )

  return stats
}

/**
 * Validiert IBAN (vereinfachte Validierung)
 */
export function validateIBAN(iban: string): boolean {
  // Entferne Leerzeichen
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()

  // Basis-Validierung: 15-34 Zeichen, beginnt mit 2 Buchstaben
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/
  if (!ibanRegex.test(cleanIBAN) || cleanIBAN.length < 15 || cleanIBAN.length > 34) {
    return false
  }

  // Deutsche IBAN: 22 Zeichen
  if (cleanIBAN.startsWith('DE') && cleanIBAN.length !== 22) {
    return false
  }

  return true
}

/**
 * Formatiert IBAN mit Leerzeichen
 */
export function formatIBAN(iban: string): string {
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()
  return cleanIBAN.match(/.{1,4}/g)?.join(' ') || cleanIBAN
}

/**
 * Validiert BIC
 */
export function validateBIC(bic: string): boolean {
  const cleanBIC = bic.replace(/\s/g, '').toUpperCase()
  const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/
  return bicRegex.test(cleanBIC)
}

/**
 * Generiert SEPA-Mandatsreferenz
 */
export function generateMandateReference(memberNumber: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  return `MAND-${memberNumber}-${timestamp}`
}

/**
 * Prüft ob SEPA-Mandat aktiv und gültig ist
 */
export function isSepaMandateValid(member: Member): boolean {
  if (member.sepa_mandate_status !== 'active') {
    return false
  }

  if (!member.iban || !member.account_holder || !member.sepa_mandate_reference) {
    return false
  }

  if (!validateIBAN(member.iban)) {
    return false
  }

  return true
}
