// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({
  login: vi.fn(), register: vi.fn(), replace: vi.fn(),
  execute: vi.fn(() => { throw new Error('reCAPTCHA provider missing') }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ login: mocks.login, register: mocks.register }) }))
vi.mock('react-google-recaptcha-v3', () => ({
  useGoogleReCaptcha: () => ({ executeRecaptcha: mocks.execute }),
  GoogleReCaptchaProvider: ({ children }: { children: ReactNode }) => children,
}))

describe('reCAPTCHA 미설정 로컬 인증', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_RECAPTCHA_SITE_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', '')
    vi.resetModules()
    vi.clearAllMocks()
  })
  afterEach(() => { cleanup(); vi.unstubAllEnvs() })

  it('로그인을 전송하고 제공자 없는 reCAPTCHA 함수를 호출하지 않는다', async () => {
    const { default: Login } = await import('./login/page')
    render(<Login />)
    fireEvent.change(screen.getByLabelText('이메일 또는 슬러그'), { target: { value: 'local-writer' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'local-fixture-password' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith('local-writer', 'local-fixture-password', undefined))
    expect(mocks.execute).not.toHaveBeenCalled()
    expect(mocks.replace).toHaveBeenCalledWith('/dashboard')
  })

  it('가입 동의와 비밀번호 확인 뒤 reCAPTCHA 없이 등록한다', async () => {
    const { default: Register } = await import('./register/page')
    render(<Register />)
    for (const [placeholder, value] of [
      ['your@email.com', 'writer@example.test'], ['6자 이상', 'local-fixture-password'],
      ['비밀번호를 다시 입력하세요', 'local-fixture-password'], ['필명 또는 닉네임', '가상 작가'],
      ['my-space', 'local-writer'],
    ]) fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /회원가입/ }))
    await waitFor(() => expect(mocks.register).toHaveBeenCalledWith({
      email: 'writer@example.test', password: 'local-fixture-password', name: '가상 작가', slug: 'local-writer',
    }, undefined))
    expect(mocks.execute).not.toHaveBeenCalled()
    expect(mocks.replace).toHaveBeenCalledWith('/dashboard')
  })
})
