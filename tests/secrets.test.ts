import { describe, it, expect } from 'vitest'

// Secret patterns regex tests directly
const SECRET_PATTERNS = [
  { name: 'Generic API key', pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"`]([A-Za-z0-9_\-]{20,})['"`]/i },
  { name: 'Generic secret', pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"`]([A-Za-z0-9_\-!@#$%^&*]{8,})['"`]/i },
  { name: 'Bearer token', pattern: /bearer\s+['"`]?([A-Za-z0-9\-._~+/]{20,})['"`]?/i },
  { name: 'Supabase anon/service key', pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_\-]{10,}/ },
  { name: 'OpenAI API key', pattern: /sk-[A-Za-z0-9]{20,}/ },
  { name: 'GitHub token', pattern: /gh[ps]_[A-Za-z0-9]{36}/ },
  { name: 'Stripe secret key', pattern: /sk_(?:live|test)_[A-Za-z0-9]{24,}/ },
  { name: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/ },
]

describe('Secret Pattern Detection', () => {
  it('detects OpenAI API keys', () => {
    const testLine = 'const openaiKey = "sk-proj12345678901234567890abc"'
    const match = SECRET_PATTERNS.find(p => p.pattern.test(testLine))
    expect(match?.name).toBe('OpenAI API key')
  })

  it('detects Stripe secret keys', () => {
    const testLine = 'const stripeKey = "sk_test_51Mzxyz1234567890abcdef12"'
    const match = SECRET_PATTERNS.find(p => p.pattern.test(testLine))
    expect(match?.name).toBe('Stripe secret key')
  })

  it('detects AWS access key IDs', () => {
    const testLine = 'const awsKey = "AKIAIOSFODNN7EXAMPLE"'
    const match = SECRET_PATTERNS.find(p => p.pattern.test(testLine))
    expect(match?.name).toBe('AWS access key')
  })

  it('detects Supabase JWT tokens', () => {
    const testLine = 'const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9"'
    const match = SECRET_PATTERNS.find(p => p.pattern.test(testLine))
    expect(match?.name).toBe('Supabase anon/service key')
  })

  it('does not flag clean code without secrets', () => {
    const cleanLine = 'const port = process.env.PORT || 3000'
    const match = SECRET_PATTERNS.find(p => p.pattern.test(cleanLine))
    expect(match).toBeUndefined()
  })
})
