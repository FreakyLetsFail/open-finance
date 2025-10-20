/**
 * TypeScript Types for Member Management System
 * DSGVO-compliant member data structures
 */

// Member Status Types
export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'cancelled';

// Membership Types
export type MembershipType = 'regular' | 'premium' | 'student' | 'senior' | 'family' | 'honorary';

// Gender Types (DSGVO-compliant)
export type Gender = 'male' | 'female' | 'diverse' | 'not_specified';

// Payment Methods
export type PaymentMethod = 'sepa' | 'bank_transfer' | 'cash' | 'credit_card' | 'other';

// DSGVO Legal Basis (Art. 6 GDPR)
export type LegalBasis =
  | 'consent'              // Art. 6(1)(a) - Consent
  | 'contract'             // Art. 6(1)(b) - Contract performance
  | 'legal_obligation'     // Art. 6(1)(c) - Legal obligation
  | 'vital_interest'       // Art. 6(1)(d) - Vital interests
  | 'public_task'          // Art. 6(1)(e) - Public task
  | 'legitimate_interest'; // Art. 6(1)(f) - Legitimate interests

// Consent Types
export type ConsentType =
  | 'data_processing'
  | 'marketing'
  | 'newsletter'
  | 'photo_publication'
  | 'third_party_sharing'
  | 'profiling';

// Document Types
export type DocumentType =
  | 'contract'
  | 'consent_form'
  | 'invoice'
  | 'receipt'
  | 'correspondence'
  | 'dsgvo_export'
  | 'other';

// Export Types
export type ExportType = 'full' | 'personal_data' | 'financial' | 'documents';
export type ExportFormat = 'json' | 'csv' | 'pdf' | 'xml';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

// Base Member Interface
export interface Member {
  id: string;
  memberNumber: string;

  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: Gender;

  // Contact Information
  email: string;
  phone?: string;
  mobile?: string;

  // Address Information
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  country?: string;

  // Membership Information
  membershipType: MembershipType;
  status: MemberStatus;
  entryDate: string;
  exitDate?: string;

  // Financial Information
  monthlyFee?: number;
  paymentMethod?: PaymentMethod;
  iban?: string;
  bic?: string;

  // Additional Information
  notes?: string;
  tags?: string[];

  // Audit Fields
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;

  // Soft Delete
  deletedAt?: string;
  deletedBy?: string;
}

// Member Creation Input (without auto-generated fields)
export interface CreateMemberInput {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  gender?: Gender;
  phone?: string;
  mobile?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  membershipType: MembershipType;
  status?: MemberStatus;
  entryDate?: string;
  monthlyFee?: number;
  paymentMethod?: PaymentMethod;
  iban?: string;
  bic?: string;
  notes?: string;
  tags?: string[];
}

// Member Update Input (all fields optional except id)
export interface UpdateMemberInput {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: Gender;
  phone?: string;
  mobile?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  membershipType?: MembershipType;
  status?: MemberStatus;
  entryDate?: string;
  exitDate?: string;
  monthlyFee?: number;
  paymentMethod?: PaymentMethod;
  iban?: string;
  bic?: string;
  notes?: string;
  tags?: string[];
}

// Member Consent Interface
export interface MemberConsent {
  id: string;
  memberId: string;
  consentType: ConsentType;
  consentPurpose: string;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
  legalBasis: LegalBasis;
  consentText: string;
  consentVersion: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

// Consent Creation Input
export interface CreateConsentInput {
  memberId: string;
  consentType: ConsentType;
  consentPurpose: string;
  granted: boolean;
  legalBasis: LegalBasis;
  consentText: string;
  consentVersion: string;
  ipAddress?: string;
  userAgent?: string;
}

// Member Document Interface
export interface MemberDocument {
  id: string;
  memberId: string;
  documentType: DocumentType;
  documentName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  category?: string;
  tags?: string[];
  containsPersonalData: boolean;
  retentionPeriodDays?: number;
  createdAt: string;
  createdBy?: string;
  deletedAt?: string;
  deletedBy?: string;
}

// Document Upload Input
export interface UploadDocumentInput {
  memberId: string;
  documentType: DocumentType;
  documentName: string;
  file: File | Buffer;
  category?: string;
  tags?: string[];
  containsPersonalData?: boolean;
  retentionPeriodDays?: number;
}

// Member Activity Log Interface
export interface MemberActivityLog {
  id: string;
  memberId: string;
  activityType: string;
  activityDescription?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  performedBy?: string;
  createdAt: string;
}

// Data Export Interface
export interface MemberDataExport {
  id: string;
  memberId: string;
  exportType: ExportType;
  exportFormat: ExportFormat;
  filePath?: string;
  fileSize?: number;
  status: ExportStatus;
  requestedAt: string;
  completedAt?: string;
  expiresAt?: string;
  requestedBy?: string;
  errorMessage?: string;
}

// Export Request Input
export interface RequestExportInput {
  memberId: string;
  exportType?: ExportType;
  exportFormat?: ExportFormat;
}

// Search and Filter Types
export interface MemberSearchParams {
  query?: string;
  status?: MemberStatus;
  membershipType?: MembershipType;
  tags?: string[];
  entryDateFrom?: string;
  entryDateTo?: string;
  city?: string;
  postalCode?: string;
  page?: number;
  limit?: number;
  sortBy?: MemberSortField;
  sortOrder?: 'asc' | 'desc';
}

export type MemberSortField =
  | 'memberNumber'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'entryDate'
  | 'createdAt'
  | 'status';

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Member with Relations
export interface MemberWithRelations extends Member {
  consents?: MemberConsent[];
  documents?: MemberDocument[];
  activities?: MemberActivityLog[];
}

// Statistics and Analytics
export interface MemberStatistics {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  byMembershipType: Record<MembershipType, number>;
  byStatus: Record<MemberStatus, number>;
  newThisMonth: number;
  cancelledThisMonth: number;
  totalMonthlyRevenue: number;
}

// DSGVO Export Data Structure
export interface DSGVOExportData {
  member: Member;
  consents: MemberConsent[];
  documents: MemberDocument[];
  activities: MemberActivityLog[];
  exportMetadata: {
    exportedAt: string;
    exportedBy: string;
    dataController: string;
    retentionPolicy: string;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

// Validation Error Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  validationErrors: ValidationError[];
}
