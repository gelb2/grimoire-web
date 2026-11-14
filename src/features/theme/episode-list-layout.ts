import type { AuthorTheme } from './presets'

type Layout = AuthorTheme['episodeListLayout']
const layouts: readonly string[] = ['series', 'grid', 'classic', 'magazine', 'gallery', 'minimal']

// 초기 테마는 layout에 저장했다. 현재 필드가 있으면 작가의 현재 선택을 우선한다.
export function resolveEpisodeListLayout(theme: Partial<AuthorTheme> & { layout?: unknown }): Layout {
  const value = theme.episodeListLayout ?? theme.layout
  return typeof value === 'string' && layouts.includes(value) ? value as Layout : 'grid'
}
