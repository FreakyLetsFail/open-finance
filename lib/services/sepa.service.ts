/**
 * SEPA-Lastschrift Service
 *
 * Funktionalität für:
 * - SEPA XML Generierung (pain.008.001.02)
 * - Batch-Verarbeitung
 * - Mandatsverwaltung
 */

import { format } from 'date-fns'
import {
  SepaXmlConfig,
  SepaDirectDebitTransaction,
  SepaBatch,
  SepaTransaction,
  Member,
  ContributionInvoice
} from '@/types/membership.types'

/**
 * SEPA XML Generator für pain.008.001.02 Format
 */
export class SepaXmlGenerator {
  private config: SepaXmlConfig

  constructor(config: SepaXmlConfig) {
    this.config = config
  }

  /**
   * Generiert komplette SEPA XML Datei
   */
  generateXml(
    batch: SepaBatch,
    transactions: SepaDirectDebitTransaction[]
  ): string {
    const messageId = this.generateMessageId(batch.batch_number)
    const creationDateTime = this.formatDateTime(new Date())
    const executionDate = this.formatDate(batch.execution_date)

    const numberOfTransactions = transactions.length
    const controlSum = transactions.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${this.escapeXml(messageId)}</MsgId>
      <CreDtTm>${creationDateTime}</CreDtTm>
      <NbOfTxs>${numberOfTransactions}</NbOfTxs>
      <CtrlSum>${controlSum}</CtrlSum>
      <InitgPty>
        <Nm>${this.escapeXml(this.config.creditor_name)}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${this.escapeXml(batch.batch_number)}</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${numberOfTransactions}</NbOfTxs>
      <CtrlSum>${controlSum}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <LclInstrm>
          <Cd>CORE</Cd>
        </LclInstrm>
        <SeqTp>RCUR</SeqTp>
      </PmtTpInf>
      <ReqdColltnDt>${executionDate}</ReqdColltnDt>
      <Cdtr>
        <Nm>${this.escapeXml(this.config.creditor_name)}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${this.formatIBAN(this.config.creditor_iban)}</IBAN>
        </Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId>
          <BIC>${this.config.creditor_bic}</BIC>
        </FinInstnId>
      </CdtrAgt>
      <CdtrSchmeId>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${this.config.creditor_id}</Id>
              <SchmeNm>
                <Prtry>SEPA</Prtry>
              </SchmeNm>
            </Othr>
          </PrvtId>
        </Id>
      </CdtrSchmeId>
${transactions.map(tx => this.generateTransaction(tx)).join('\n')}
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`

    return xml
  }

  /**
   * Generiert einzelne Transaktion
   */
  private generateTransaction(tx: SepaDirectDebitTransaction): string {
    return `      <DrctDbtTxInf>
        <PmtId>
          <EndToEndId>${this.escapeXml(tx.end_to_end_id)}</EndToEndId>
        </PmtId>
        <InstdAmt Ccy="${tx.currency}">${tx.amount.toFixed(2)}</InstdAmt>
        <DrctDbtTx>
          <MndtRltdInf>
            <MndtId>${this.escapeXml(tx.mandate_reference)}</MndtId>
            <DtOfSgntr>${this.formatDate(tx.mandate_date)}</DtOfSgntr>
          </MndtRltdInf>
        </DrctDbtTx>
        <DbtrAgt>
          <FinInstnId>
            ${tx.debtor_bic ? `<BIC>${tx.debtor_bic}</BIC>` : '<Othr><Id>NOTPROVIDED</Id></Othr>'}
          </FinInstnId>
        </DbtrAgt>
        <Dbtr>
          <Nm>${this.escapeXml(tx.debtor_name)}</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id>
            <IBAN>${this.formatIBAN(tx.debtor_iban)}</IBAN>
          </Id>
        </DbtrAcct>
        <RmtInf>
          <Ustrd>${this.escapeXml(tx.remittance_info)}</Ustrd>
        </RmtInf>
      </DrctDbtTxInf>`
  }

  /**
   * Generiert Message ID
   */
  private generateMessageId(batchNumber: string): string {
    return `${this.config.message_id_prefix}-${batchNumber}`
  }

  /**
   * Formatiert Datum für SEPA XML
   */
  private formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'yyyy-MM-dd')
  }

  /**
   * Formatiert Datum-Zeit für SEPA XML
   */
  private formatDateTime(date: Date): string {
    return date.toISOString()
  }

  /**
   * Formatiert IBAN ohne Leerzeichen
   */
  private formatIBAN(iban: string): string {
    return iban.replace(/\s/g, '').toUpperCase()
  }

  /**
   * Escaped XML Sonderzeichen
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}

/**
 * Erstellt SEPA-Transaktion aus Rechnung und Mitglied
 */
export function createSepaTransactionFromInvoice(
  member: Member,
  invoice: ContributionInvoice
): SepaDirectDebitTransaction {
  if (!member.iban || !member.sepa_mandate_reference || !member.sepa_mandate_date) {
    throw new Error('Member does not have valid SEPA mandate')
  }

  return {
    mandate_reference: member.sepa_mandate_reference,
    mandate_date: member.sepa_mandate_date,
    debtor_name: member.account_holder || `${member.first_name} ${member.last_name}`,
    debtor_iban: member.iban,
    debtor_bic: member.bic || undefined,
    amount: invoice.total_amount - invoice.paid_amount,
    currency: invoice.currency,
    end_to_end_id: `${invoice.invoice_number}`,
    remittance_info: invoice.description || `Rechnung ${invoice.invoice_number}`
  }
}

/**
 * Validiert SEPA-Transaktion
 */
export function validateSepaTransaction(tx: SepaDirectDebitTransaction): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // IBAN Validierung
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/
  if (!ibanRegex.test(tx.debtor_iban.replace(/\s/g, ''))) {
    errors.push('Invalid IBAN format')
  }

  // BIC Validierung (wenn vorhanden)
  if (tx.debtor_bic) {
    const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/
    if (!bicRegex.test(tx.debtor_bic.replace(/\s/g, ''))) {
      errors.push('Invalid BIC format')
    }
  }

  // Betrag Validierung
  if (tx.amount <= 0) {
    errors.push('Amount must be greater than zero')
  }

  if (tx.amount > 999999.99) {
    errors.push('Amount exceeds maximum allowed')
  }

  // Mandatsreferenz Validierung
  if (!tx.mandate_reference || tx.mandate_reference.length > 35) {
    errors.push('Invalid mandate reference')
  }

  // Name Validierung
  if (!tx.debtor_name || tx.debtor_name.length > 70) {
    errors.push('Invalid debtor name')
  }

  // End-to-End ID Validierung
  if (!tx.end_to_end_id || tx.end_to_end_id.length > 35) {
    errors.push('Invalid end-to-end ID')
  }

  // Remittance Info Validierung
  if (tx.remittance_info && tx.remittance_info.length > 140) {
    errors.push('Remittance info too long')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Gruppiert Transaktionen für Batch-Verarbeitung
 */
export function groupTransactionsByExecutionDate(
  transactions: SepaDirectDebitTransaction[]
): Map<string, SepaDirectDebitTransaction[]> {
  const groups = new Map<string, SepaDirectDebitTransaction[]>()

  for (const tx of transactions) {
    const date = format(new Date(), 'yyyy-MM-dd')
    if (!groups.has(date)) {
      groups.set(date, [])
    }
    groups.get(date)!.push(tx)
  }

  return groups
}

/**
 * Berechnet optimales Ausführungsdatum für SEPA-Lastschrift
 * (5 Bankarbeitstage im Voraus für erste Lastschrift)
 */
export function calculateSepaExecutionDate(
  dueDate: Date,
  isFirstDebit: boolean = false
): Date {
  const daysInAdvance = isFirstDebit ? 5 : 2
  const executionDate = new Date(dueDate)
  executionDate.setDate(executionDate.getDate() - daysInAdvance)

  // Skip weekends
  while (executionDate.getDay() === 0 || executionDate.getDay() === 6) {
    executionDate.setDate(executionDate.getDate() - 1)
  }

  return executionDate
}

/**
 * Generiert SEPA-Batch-Statistiken
 */
export function calculateBatchStatistics(
  transactions: SepaDirectDebitTransaction[]
): {
  total_transactions: number
  total_amount: number
  average_amount: number
  min_amount: number
  max_amount: number
  currency: string
} {
  const amounts = transactions.map(tx => tx.amount)

  return {
    total_transactions: transactions.length,
    total_amount: amounts.reduce((sum, amount) => sum + amount, 0),
    average_amount: amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length,
    min_amount: Math.min(...amounts),
    max_amount: Math.max(...amounts),
    currency: transactions[0]?.currency || 'EUR'
  }
}
