/**
 * features/reader Public API (FSD 약식 정합 — 묶음 MM)
 *
 * 신설 (2026-05-06): FSD 정합 검증 결과 reader/index.ts 부재 발견 → Public API 격리 규칙 정합화.
 * 외부 (app/components 등)에서는 본 index.ts 경유로만 import 권장.
 *
 * 정통 FSD 정식 도입은 별도 sprint (project_remaining_tasks.md 참조).
 */

export { AuthorSpace } from './ui/AuthorSpace'
export { CardTransitionProvider } from './ui/CardTransition'
export { EpisodeFooter } from './ui/EpisodeFooter'
export { EpisodeViewer } from './ui/EpisodeViewer'
export { SeriesLanding } from './ui/SeriesLanding'
export { SeriesNav } from './ui/SeriesNav'
export { WorkPage } from './ui/WorkPage'

export type { AuthorData } from './ui/layouts'
