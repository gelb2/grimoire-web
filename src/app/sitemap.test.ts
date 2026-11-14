import { afterEach, describe, expect, it, vi } from 'vitest'
import sitemap from './sitemap'

afterEach(() => vi.unstubAllEnvs())
describe('운영자 사이트 주소', () => {
  it('미설정 시 작성자 도메인을 발행하지 않는다', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    expect(sitemap()).toEqual([])
  })
  it('설정한 출처만 사이트맵에 사용한다', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://writer.example.test/')
    expect(sitemap().map(x => x.url)).toEqual(['https://writer.example.test', 'https://writer.example.test/explore'])
  })
  it.each(['https://user:password@example.test', 'https://example.test/path', 'https://example.test?key=value', 'javascript:alert(1)'])('출처가 아닌 설정은 거절한다: %s', url => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', url)
    expect(() => sitemap()).toThrow()
  })
})
