import { describe, expect, it } from 'vitest'
import { resolveEpisodeListLayout } from './episode-list-layout'

describe('복원한 초기 테마의 목차 설정', () => {
  it('layout:series로 저장한 카드형 목차를 복원한다', () => {
    expect(resolveEpisodeListLayout({ layout: 'series' })).toBe('series')
  })
  it('현재 작가가 선택한 episodeListLayout을 우선한다', () => {
    expect(resolveEpisodeListLayout({ layout: 'series', episodeListLayout: 'gallery' })).toBe('gallery')
  })
  it('레이아웃이 없거나 알 수 없는 값이면 기존 작품 목록을 사용한다', () => {
    expect(resolveEpisodeListLayout({})).toBe('grid')
    expect(resolveEpisodeListLayout({ layout: 'unexpected' })).toBe('grid')
  })
})
