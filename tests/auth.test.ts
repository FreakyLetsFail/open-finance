import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password'
import { generateToken, verifyToken } from '@/lib/auth/jwt'

describe('Authentication', () => {
  describe('Password hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
    })

    it('should verify correct password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('WrongPassword', hash)

      expect(isValid).toBe(false)
    })
  })

  describe('Password strength validation', () => {
    it('should validate strong password', () => {
      const result = validatePasswordStrength('StrongPass123!')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject weak password', () => {
      const result = validatePasswordStrength('weak')
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('JWT operations', () => {
    it('should generate valid token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'user' as const
      }

      const token = generateToken(payload)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })

    it('should verify valid token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'user' as const
      }

      const token = generateToken(payload)
      const verified = verifyToken(token)

      expect(verified.userId).toBe(payload.userId)
      expect(verified.email).toBe(payload.email)
      expect(verified.role).toBe(payload.role)
    })

    it('should reject invalid token', () => {
      expect(() => {
        verifyToken('invalid-token')
      }).toThrow()
    })
  })
})
