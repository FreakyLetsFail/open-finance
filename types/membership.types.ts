/**
 * Beitragsverwaltungs-System TypeScript Typen
 *
 * Definiert alle TypeScript Interfaces und Types für:
 * - Mitgliederverwaltung
 * - Beitragsdefinitionen
 * - Rechnungen und Zahlungen
 * - Mahnwesen
 * - SEPA-Lastschrift
 */

import { Json } from './database.types'

// ============================================
// ENUMS
// ============================================

export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'cancelled'
export type Salutation = 'Herr' | 'Frau' | 'Divers'
export type SepaMandateStatus = 'pending' | 'active' | 'revoked' | 'expired'

export type ContributionType = 'membership_fee' | 'entrance_fee' | 'special_fee' | 'donation' | 'other'
export type RecurrenceInterval = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'one_time'

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
export type PaymentMethod = 'sepa_debit' | 'bank_transfer' | 'cash' | 'card' | 'other'

export type ReminderLevel = 1 | 2 | 3
export type ReminderStatus = 'draft' | 'sent' | 'paid' | 'escalated' | 'cancelled'
export type ReminderSendVia = 'email' | 'post' | 'both'

export type SepaBatchStatus = 'draft' | 'prepared' | 'submitted' | 'executed' | 'failed' | 'cancelled'
export type SepaTransactionStatus = 'pending' | 'submitted' | 'executed' | 'returned' | 'failed' | 'cancelled'

// ============================================
// MEMBER TYPES
// ============================================

export interface Member {
  id: string
  user_id: string | null
  member_number: string
  salutation: Salutation | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  date_of_birth: string | null

  // Address
  street: string | null
  house_number: string | null
  postal_code: string | null
  city: string | null
  country: string

  // Membership
  membership_start: string
  membership_end: string | null
  status: MemberStatus

  // SEPA
  iban: string | null
  bic: string | null
  account_holder: string | null
  sepa_mandate_reference: string | null
  sepa_mandate_date: string | null
  sepa_mandate_status: SepaMandateStatus | null

  // Metadata
  notes: string | null
  tags: string[] | null
  metadata: Json | null

  created_at: string
  updated_at: string
}

export interface MemberInsert {
  user_id?: string | null
  member_number?: string
  salutation?: Salutation | null
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  date_of_birth?: string | null
  street?: string | null
  house_number?: string | null
  postal_code?: string | null
  city?: string | null
  country?: string
  membership_start: string
  membership_end?: string | null
  status?: MemberStatus
  iban?: string | null
  bic?: string | null
  account_holder?: string | null
  sepa_mandate_reference?: string | null
  sepa_mandate_date?: string | null
  sepa_mandate_status?: SepaMandateStatus | null
  notes?: string | null
  tags?: string[] | null
  metadata?: Json | null
}

export interface MemberUpdate extends Partial<MemberInsert> {
  id?: string
}

// ============================================
// CONTRIBUTION DEFINITION TYPES
// ============================================

export interface ContributionDefinition {
  id: string
  name: string
  description: string | null
  contribution_type: ContributionType
  amount: number
  currency: string
  is_recurring: boolean
  recurrence_interval: RecurrenceInterval | null
  valid_from: string
  valid_until: string | null
  category: string | null
  is_tax_deductible: boolean
  is_active: boolean
  metadata: Json | null
  created_at: string
  updated_at: string
}

export interface ContributionDefinitionInsert {
  name: string
  description?: string | null
  contribution_type: ContributionType
  amount: number
  currency?: string
  is_recurring?: boolean
  recurrence_interval?: RecurrenceInterval | null
  valid_from: string
  valid_until?: string | null
  category?: string | null
  is_tax_deductible?: boolean
  is_active?: boolean
  metadata?: Json | null
}

export interface ContributionDefinitionUpdate extends Partial<ContributionDefinitionInsert> {
  id?: string
}

// ============================================
// MEMBER CONTRIBUTION TYPES
// ============================================

export interface MemberContribution {
  id: string
  member_id: string
  contribution_definition_id: string
  custom_amount: number | null
  custom_interval: RecurrenceInterval | null
  start_date: string
  end_date: string | null
  is_active: boolean
  auto_generate_invoices: boolean
  auto_process_payment: boolean
  notes: string | null
  metadata: Json | null
  created_at: string
  updated_at: string
}

export interface MemberContributionInsert {
  member_id: string
  contribution_definition_id: string
  custom_amount?: number | null
  custom_interval?: RecurrenceInterval | null
  start_date: string
  end_date?: string | null
  is_active?: boolean
  auto_generate_invoices?: boolean
  auto_process_payment?: boolean
  notes?: string | null
  metadata?: Json | null
}

export interface MemberContributionUpdate extends Partial<MemberContributionInsert> {
  id?: string
}

// ============================================
// INVOICE TYPES
// ============================================

export interface ContributionInvoice {
  id: string
  invoice_number: string
  member_id: string
  member_contribution_id: string | null
  invoice_date: string
  due_date: string
  period_start: string | null
  period_end: string | null
  amount: number
  currency: string
  tax_rate: number
  tax_amount: number
  total_amount: number
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  paid_amount: number
  paid_date: string | null
  reminder_level: number
  last_reminder_date: string | null
  next_reminder_date: string | null
  description: string | null
  line_items: Json | null
  notes: string | null
  metadata: Json | null
  created_at: string
  updated_at: string
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
  tax_rate?: number
}

export interface ContributionInvoiceInsert {
  invoice_number?: string
  member_id: string
  member_contribution_id?: string | null
  invoice_date: string
  due_date: string
  period_start?: string | null
  period_end?: string | null
  amount: number
  currency?: string
  tax_rate?: number
  tax_amount?: number
  total_amount: number
  payment_method?: PaymentMethod | null
  payment_status?: PaymentStatus
  paid_amount?: number
  paid_date?: string | null
  reminder_level?: number
  last_reminder_date?: string | null
  next_reminder_date?: string | null
  description?: string | null
  line_items?: Json | null
  notes?: string | null
  metadata?: Json | null
}

export interface ContributionInvoiceUpdate extends Partial<ContributionInvoiceInsert> {
  id?: string
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface ContributionPayment {
  id: string
  payment_number: string
  member_id: string
  invoice_id: string | null
  payment_date: string
  amount: number
  currency: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  sepa_transaction_id: string | null
  sepa_execution_date: string | null
  sepa_mandate_reference: string | null
  bank_reference: string | null
  transaction_reference: string | null
  description: string | null
  notes: string | null
  metadata: Json | null
  created_at: string
  updated_at: string
}

export interface ContributionPaymentInsert {
  payment_number?: string
  member_id: string
  invoice_id?: string | null
  payment_date: string
  amount: number
  currency?: string
  payment_method: PaymentMethod
  payment_status?: PaymentStatus
  sepa_transaction_id?: string | null
  sepa_execution_date?: string | null
  sepa_mandate_reference?: string | null
  bank_reference?: string | null
  transaction_reference?: string | null
  description?: string | null
  notes?: string | null
  metadata?: Json | null
}

export interface ContributionPaymentUpdate extends Partial<ContributionPaymentInsert> {
  id?: string
}

// ============================================
// REMINDER TYPES
// ============================================

export interface ContributionReminder {
  id: string
  reminder_number: string
  invoice_id: string
  member_id: string
  reminder_level: ReminderLevel
  reminder_date: string
  original_amount: number
  reminder_fee: number
  total_amount: number
  currency: string
  payment_deadline: string
  status: ReminderStatus
  sent_via: ReminderSendVia | null
  sent_at: string | null
  description: string | null
  notes: string | null
  metadata: Json | null
  created_at: string
  updated_at: string
}

export interface ContributionReminderInsert {
  reminder_number?: string
  invoice_id: string
  member_id: string
  reminder_level: ReminderLevel
  reminder_date: string
  original_amount: number
  reminder_fee?: number
  total_amount: number
  currency?: string
  payment_deadline: string
  status?: ReminderStatus
  sent_via?: ReminderSendVia | null
  sent_at?: string | null
  description?: string | null
  notes?: string | null
  metadata?: Json | null
}

export interface ContributionReminderUpdate extends Partial<ContributionReminderInsert> {
  id?: string
}

// ============================================
// SEPA BATCH TYPES
// ============================================

export interface SepaBatch {
  id: string
  batch_number: string
  batch_date: string
  execution_date: string
  status: SepaBatchStatus
  total_transactions: number
  total_amount: number
  currency: string
  sepa_xml_file: string | null
  sepa_xml_generated_at: string | null
  notes: string | null
  metadata: Json | null
  created_at: string
  updated_at: string
}

export interface SepaBatchInsert {
  batch_number?: string
  batch_date: string
  execution_date: string
  status?: SepaBatchStatus
  total_transactions?: number
  total_amount?: number
  currency?: string
  sepa_xml_file?: string | null
  sepa_xml_generated_at?: string | null
  notes?: string | null
  metadata?: Json | null
}

export interface SepaBatchUpdate extends Partial<SepaBatchInsert> {
  id?: string
}

// ============================================
// SEPA TRANSACTION TYPES
// ============================================

export interface SepaTransaction {
  id: string
  batch_id: string | null
  invoice_id: string | null
  member_id: string
  transaction_id: string
  mandate_reference: string
  amount: number
  currency: string
  debtor_name: string
  debtor_iban: string
  debtor_bic: string | null
  execution_date: string
  collection_date: string | null
  status: SepaTransactionStatus
  error_code: string | null
  error_message: string | null
  return_reason: string | null
  description: string | null
  metadata: Json | null
  created_at: string
  updated_at: string
}

export interface SepaTransactionInsert {
  batch_id?: string | null
  invoice_id?: string | null
  member_id: string
  transaction_id: string
  mandate_reference: string
  amount: number
  currency?: string
  debtor_name: string
  debtor_iban: string
  debtor_bic?: string | null
  execution_date: string
  collection_date?: string | null
  status?: SepaTransactionStatus
  error_code?: string | null
  error_message?: string | null
  return_reason?: string | null
  description?: string | null
  metadata?: Json | null
}

export interface SepaTransactionUpdate extends Partial<SepaTransactionInsert> {
  id?: string
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface MemberWithContributions extends Member {
  contributions?: MemberContribution[]
  invoices?: ContributionInvoice[]
  payments?: ContributionPayment[]
}

export interface InvoiceWithDetails extends ContributionInvoice {
  member?: Member
  payments?: ContributionPayment[]
  reminders?: ContributionReminder[]
}

export interface PaymentStatistics {
  total_paid: number
  total_pending: number
  total_overdue: number
  payment_count: number
  average_payment: number
  currency: string
}

export interface MemberStatistics {
  total_members: number
  active_members: number
  inactive_members: number
  suspended_members: number
  cancelled_members: number
  new_members_this_month: number
  sepa_mandate_active: number
}

// ============================================
// CALCULATION HELPERS
// ============================================

export interface ContributionCalculation {
  base_amount: number
  tax_amount: number
  total_amount: number
  period_start: string
  period_end: string
  interval: RecurrenceInterval
}

export interface ReminderFeeStructure {
  level_1_fee: number
  level_2_fee: number
  level_3_fee: number
  currency: string
}

// ============================================
// SEPA XML TYPES
// ============================================

export interface SepaXmlConfig {
  creditor_name: string
  creditor_iban: string
  creditor_bic: string
  creditor_id: string
  message_id_prefix: string
}

export interface SepaDirectDebitTransaction {
  mandate_reference: string
  mandate_date: string
  debtor_name: string
  debtor_iban: string
  debtor_bic?: string
  amount: number
  currency: string
  end_to_end_id: string
  remittance_info: string
}
