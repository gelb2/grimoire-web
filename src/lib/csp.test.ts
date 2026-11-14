import { describe, it, expect } from 'vitest'
import { buildCsp, apiConnectSrc } from './csp'

describe('CSP 사용자 API 출처', () => {
  it.each(['local', 'localhost'])('%s는 루프백 API를 허용한다', env => {
    expect(apiConnectSrc(env)).toBe('http://localhost:3000')
  })
  it.each(['development', 'production', undefined])('%s는 기본 BFF만 사용한다', env => {
    expect(apiConnectSrc(env)).toBe('')
    expect(buildCsp(env)).not.toContain('grimoire-book.com')
  })
  it('설정한 API 출처만 추가한다', () => {
    expect(apiConnectSrc('production', 'https://api.example.test')).toBe('https://api.example.test')
    expect(buildCsp('production', 'https://api.example.test')).toContain("connect-src 'self' https://api.example.test ")
  })
  it.each(['https://user:password@example.test', 'https://example.test/path', 'https://example.test?key=value', 'https://example.test#hash', 'javascript:alert(1)', 'not-a-url'])('잘못된 출처는 빌드를 중단한다: %s', origin => {
    expect(() => buildCsp('production', origin)).toThrow()
  })
  it('GCS 테마 CSS와 기존 보안 지시어를 유지한다', () => {
    const csp = buildCsp('localhost')
    expect(csp).toContain("style-src 'self' 'unsafe-inline' https://accounts.google.com https://storage.googleapis.com")
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-src https://www.google.com https://accounts.google.com https://polar.sh")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("form-action 'self'")
  })
})
