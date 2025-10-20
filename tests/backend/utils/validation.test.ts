import {
  isValidEmail,
  sanitizeInput,
  isStrongPassword,
  parsePagination,
  formatCurrency,
  isValidDateRange
} from '@/backend/utils/validation';

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidEmail('a@b.c')).toBe(true);
      expect(isValidEmail('test@localhost')).toBe(false); // No TLD
    });
  });

  describe('sanitizeInput', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeInput('<script>alert("XSS")</script>'))
        .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle single and double quotes', () => {
      expect(sanitizeInput("It's a \"test\""))
        .toBe('It&#x27;s a &quot;test&quot;');
    });

    it('should preserve safe characters', () => {
      expect(sanitizeInput('Hello World 123!')).toBe('Hello World 123!');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('isStrongPassword', () => {
    it('should accept strong passwords', () => {
      expect(isStrongPassword('Password123!')).toBe(true);
      expect(isStrongPassword('MyP@ssw0rd')).toBe(true);
      expect(isStrongPassword('Str0ng!Pass')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isStrongPassword('password')).toBe(false); // No uppercase, number, special
      expect(isStrongPassword('Password')).toBe(false); // No number, special
      expect(isStrongPassword('password123')).toBe(false); // No uppercase, special
      expect(isStrongPassword('Pass1!')).toBe(false); // Too short
    });

    it('should handle edge cases', () => {
      expect(isStrongPassword('')).toBe(false);
      expect(isStrongPassword('12345678')).toBe(false);
    });
  });

  describe('parsePagination', () => {
    it('should parse valid pagination params', () => {
      expect(parsePagination({ page: 1, limit: 10 }))
        .toEqual({ page: 1, limit: 10 });
      expect(parsePagination({ page: 5, limit: 25 }))
        .toEqual({ page: 5, limit: 25 });
    });

    it('should use default values when missing', () => {
      expect(parsePagination({}))
        .toEqual({ page: 1, limit: 10 });
    });

    it('should reject invalid values', () => {
      expect(() => parsePagination({ page: -1, limit: 10 })).toThrow();
      expect(() => parsePagination({ page: 1, limit: 0 })).toThrow();
      expect(() => parsePagination({ page: 1, limit: 150 })).toThrow();
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should support different currencies', () => {
      expect(formatCurrency(1234.56, 'EUR')).toContain('1,234.56');
      expect(formatCurrency(1234.56, 'GBP')).toContain('1,234.56');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-100)).toBe('-$100.00');
    });
  });

  describe('isValidDateRange', () => {
    it('should accept valid date ranges', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(isValidDateRange(start, end)).toBe(true);
    });

    it('should accept same dates', () => {
      const date = new Date('2024-01-01');
      expect(isValidDateRange(date, date)).toBe(true);
    });

    it('should reject invalid ranges', () => {
      const start = new Date('2024-12-31');
      const end = new Date('2024-01-01');
      expect(isValidDateRange(start, end)).toBe(false);
    });
  });
});
