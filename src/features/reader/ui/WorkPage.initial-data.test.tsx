// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { WorkPage } from './WorkPage'

const getWork = vi.fn()
vi.mock('@/lib/api', () => ({ api: { getWork: (...args: unknown[]) => getWork(...args) } }))
afterEach(() => { cleanup(); vi.clearAllMocks() })

const initialWork = {
  id: 'work-test', slug: 'book', title: '서버에서 읽은 작품',
  episodes: [{ id: 'one', slug: 'one', title: '첫 회차' }, { id: 'two', slug: 'two', title: '둘째 회차' }],
}

describe('최초 작품 목차', () => {
  it('서버 데이터가 있으면 로딩 화면과 중복 API 요청 없이 실제 목차를 표시한다', () => {
    render(<WorkPage authorSlug="writer" workSlug="book" initialWork={initialWork} />)
    expect(screen.getByRole('heading', { name: '서버에서 읽은 작품' })).toBeVisible()
    expect(screen.getByRole('link', { name: /첫 회차/ })).toHaveAttribute('href', '/writer/book/one')
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    expect(getWork).not.toHaveBeenCalled()
  })

  it('같은 작품을 서버에서 새로 읽으면 새 제목과 회차를 반영한다', () => {
    const { rerender } = render(<WorkPage authorSlug="writer" workSlug="book" initialWork={initialWork} />)
    rerender(<WorkPage authorSlug="writer" workSlug="book" initialWork={{ ...initialWork, title: '수정한 작품' }} />)
    expect(screen.getByRole('heading', { name: '수정한 작품' })).toBeVisible()
    expect(getWork).not.toHaveBeenCalled()
  })
})
