/**
 * Utility Functions for Member Management
 * Including member number generation, DSGVO compliance helpers, and data transformations
 */

import { Member, MemberConsent, DSGVOExportData } from '@/types/members.types';

/**
 * Generate a unique member number
 * Format: MYY-XXXX (e.g., M25-0001)
 * This is a client-side helper; actual generation happens in the database
 */
export function generateMemberNumber(year?: number): string {
  const currentYear = year || new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  const randomNum = Math.floor(Math.random() * 9999) + 1;
  const paddedNum = randomNum.toString().padStart(4, '0');

  return `M${yearSuffix}-${paddedNum}`;
}

/**
 * Validate IBAN checksum
 */
export function validateIBAN(iban: string): boolean {
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();

  // Check format
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleanIban)) {
    return false;
  }

  // Move first 4 characters to end
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);

  // Convert letters to numbers (A=10, B=11, etc.)
  const numericString = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  );

  // Calculate mod 97
  let remainder = numericString.slice(0, 2);
  for (let i = 2; i < numericString.length; i += 7) {
    remainder = (parseInt(remainder + numericString.slice(i, i + 7)) % 97).toString();
  }

  return parseInt(remainder) === 1;
}

/**
 * Format IBAN with spaces for display
 */
export function formatIBAN(iban: string): string {
  const cleanIban = iban.replace(/\s/g, '');
  return cleanIban.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Mask sensitive data for display (DSGVO compliance)
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 4) {
    return '***' + cleaned.slice(-2);
  }
  return cleaned.slice(0, 3) + '***' + cleaned.slice(-2);
}

export function maskIBAN(iban: string): string {
  const cleaned = iban.replace(/\s/g, '');
  if (cleaned.length <= 8) {
    return 'DE**' + '****'.repeat(Math.floor(cleaned.length / 4));
  }
  return cleaned.slice(0, 4) + '****' + cleaned.slice(-4);
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get membership duration in months
 */
export function getMembershipDuration(entryDate: string, exitDate?: string): number {
  const start = new Date(entryDate);
  const end = exitDate ? new Date(exitDate) : new Date();

  const months = (end.getFullYear() - start.getFullYear()) * 12 +
                 (end.getMonth() - start.getMonth());

  return Math.max(0, months);
}

/**
 * Check if member data contains valid consents (DSGVO compliance)
 */
export function hasValidConsent(
  consents: MemberConsent[],
  consentType: string
): boolean {
  const consent = consents.find(c => c.consentType === consentType);

  if (!consent) return false;

  // Consent must be granted and not revoked
  return consent.granted && !consent.revokedAt;
}

/**
 * Get active consents for a member
 */
export function getActiveConsents(consents: MemberConsent[]): MemberConsent[] {
  return consents.filter(c => c.granted && !c.revokedAt);
}

/**
 * Check if data can be processed based on legal basis (DSGVO Art. 6)
 */
export function canProcessData(
  consents: MemberConsent[],
  purpose: string
): { allowed: boolean; reason: string } {
  // Check for consent-based processing
  const consent = consents.find(c =>
    c.consentPurpose.toLowerCase().includes(purpose.toLowerCase()) &&
    c.granted &&
    !c.revokedAt
  );

  if (consent) {
    return { allowed: true, reason: `Consent granted (${consent.legalBasis})` };
  }

  // Check for contract-based processing
  const contractBasis = consents.find(c =>
    c.legalBasis === 'contract' &&
    c.granted &&
    !c.revokedAt
  );

  if (contractBasis) {
    return { allowed: true, reason: 'Contract performance (Art. 6(1)(b))' };
  }

  return { allowed: false, reason: 'No valid legal basis found' };
}

/**
 * Calculate data retention deadline (DSGVO compliance)
 */
export function calculateRetentionDeadline(
  createdAt: string,
  retentionPeriodDays: number
): Date {
  const created = new Date(createdAt);
  const deadline = new Date(created);
  deadline.setDate(deadline.getDate() + retentionPeriodDays);

  return deadline;
}

/**
 * Check if data should be deleted based on retention policy
 */
export function shouldDeleteData(
  createdAt: string,
  retentionPeriodDays: number
): boolean {
  const deadline = calculateRetentionDeadline(createdAt, retentionPeriodDays);
  return new Date() > deadline;
}

/**
 * Anonymize member data (DSGVO right to erasure)
 */
export function anonymizeMember(member: Member): Partial<Member> {
  return {
    id: member.id,
    memberNumber: member.memberNumber,
    firstName: 'ANONYMIZED',
    lastName: 'ANONYMIZED',
    email: `anonymized-${member.id}@deleted.local`,
    phone: undefined,
    mobile: undefined,
    street: undefined,
    houseNumber: undefined,
    postalCode: undefined,
    city: undefined,
    dateOfBirth: undefined,
    iban: undefined,
    bic: undefined,
    notes: 'Member data anonymized per DSGVO request',
    status: 'cancelled',
    deletedAt: new Date().toISOString()
  };
}

/**
 * Prepare DSGVO-compliant export data (Art. 15 & 20)
 */
export function prepareDSGVOExport(data: DSGVOExportData): string {
  const exportData = {
    ...data,
    _metadata: {
      exportedAt: new Date().toISOString(),
      format: 'JSON',
      dsgvoCompliance: {
        article15: 'Right of access by the data subject',
        article20: 'Right to data portability',
        dataController: data.exportMetadata.dataController,
        processingPurpose: 'Member management and administration',
        legalBasis: 'Art. 6(1)(b) GDPR - Contract performance'
      },
      disclaimer: 'This export contains all personal data we process about you. ' +
                  'Data is provided in a structured, commonly used, and machine-readable format.'
    }
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Convert member data to CSV format
 */
export function memberToCSV(members: Member[]): string {
  if (members.length === 0) return '';

  const headers = [
    'Member Number', 'First Name', 'Last Name', 'Email', 'Phone', 'Mobile',
    'Street', 'House Number', 'Postal Code', 'City', 'Country',
    'Membership Type', 'Status', 'Entry Date', 'Monthly Fee', 'Created At'
  ];

  const rows = members.map(m => [
    m.memberNumber,
    m.firstName,
    m.lastName,
    m.email,
    m.phone || '',
    m.mobile || '',
    m.street || '',
    m.houseNumber || '',
    m.postalCode || '',
    m.city || '',
    m.country || '',
    m.membershipType,
    m.status,
    m.entryDate,
    m.monthlyFee?.toString() || '',
    m.createdAt
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Validate member data completeness
 */
export function validateMemberCompleteness(member: Member): {
  complete: boolean;
  missingFields: string[];
} {
  const requiredFields: (keyof Member)[] = [
    'firstName',
    'lastName',
    'email',
    'membershipType',
    'status',
    'entryDate'
  ];

  const recommendedFields: (keyof Member)[] = [
    'phone',
    'mobile',
    'street',
    'postalCode',
    'city',
    'dateOfBirth'
  ];

  const missingRequired = requiredFields.filter(field => !member[field]);
  const missingRecommended = recommendedFields.filter(field => !member[field]);

  return {
    complete: missingRequired.length === 0 && missingRecommended.length === 0,
    missingFields: [...missingRequired, ...missingRecommended]
  };
}

/**
 * Calculate monthly revenue from members
 */
export function calculateMonthlyRevenue(members: Member[]): number {
  return members
    .filter(m => m.status === 'active' && m.monthlyFee)
    .reduce((sum, m) => sum + (m.monthlyFee || 0), 0);
}

/**
 * Group members by field
 */
export function groupMembersBy<K extends keyof Member>(
  members: Member[],
  field: K
): Map<Member[K], Member[]> {
  const grouped = new Map<Member[K], Member[]>();

  members.forEach(member => {
    const key = member[field];
    const existing = grouped.get(key) || [];
    grouped.set(key, [...existing, member]);
  });

  return grouped;
}

/**
 * Search members by query string
 */
export function searchMembers(members: Member[], query: string): Member[] {
  const lowerQuery = query.toLowerCase();

  return members.filter(member =>
    member.memberNumber.toLowerCase().includes(lowerQuery) ||
    member.firstName.toLowerCase().includes(lowerQuery) ||
    member.lastName.toLowerCase().includes(lowerQuery) ||
    member.email.toLowerCase().includes(lowerQuery) ||
    (member.city && member.city.toLowerCase().includes(lowerQuery)) ||
    (member.tags && member.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
  );
}

/**
 * Sort members by field
 */
export function sortMembers<K extends keyof Member>(
  members: Member[],
  field: K,
  order: 'asc' | 'desc' = 'asc'
): Member[] {
  return [...members].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return order === 'asc' ? comparison : -comparison;
  });
}
