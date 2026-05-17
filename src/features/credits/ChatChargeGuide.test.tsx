/**
 * @vitest-environment jsdom
 *
 * 크레딧 개편 I Phase — ChatChargeGuide (채팅 4구간 차감 안내) 검증.
 *
 * 정본: shared-contracts §30 / S Phase Draft §14 (web — 채팅 차감 안내).
 *
 * - 4구간(짧음/보통/긺/아주 긺) 라벨 + 차감 N(190/810/3,390/5,520pt) 모두 표시.
 * - compact 모드 / 일반 모드 양쪽 렌더.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ChatChargeGuide } from './ChatChargeGuide'

afterEach(cleanup)

describe('ChatChargeGuide — 일반 모드', () => {
  it('제목 + 4구간 라벨 + 차감 N 표시', () => {
    render(<ChatChargeGuide />)
    expect(screen.getByText('AI 채팅 차감 안내')).toBeTruthy()
    // 4구간 라벨
    expect(screen.getByText('짧은 대화')).toBeTruthy()
    expect(screen.getByText('보통 대화')).toBeTruthy()
    expect(screen.getByText('긴 대화')).toBeTruthy()
    expect(screen.getByText('아주 긴 대화')).toBeTruthy()
    // 차감 N — §8 확정값
    expect(screen.getByText('190 pt')).toBeTruthy()
    expect(screen.getByText('810 pt')).toBeTruthy()
    expect(screen.getByText('3,390 pt')).toBeTruthy()
    expect(screen.getByText('5,520 pt')).toBeTruthy()
  })

  it('사후 차감 안내 문구 표시', () => {
    render(<ChatChargeGuide />)
    expect(screen.getByText(/AI 응답 후 확정/)).toBeTruthy()
  })
})

describe('ChatChargeGuide — compact 모드', () => {
  it('compact 모드에서도 4구간 라벨 + 차감 N 표시', () => {
    render(<ChatChargeGuide compact />)
    expect(screen.getByText('채팅 차감 안내')).toBeTruthy()
    expect(screen.getByText('짧은 대화')).toBeTruthy()
    expect(screen.getByText('아주 긴 대화')).toBeTruthy()
    expect(screen.getByText('190 pt')).toBeTruthy()
    expect(screen.getByText('5,520 pt')).toBeTruthy()
  })
})
