import Link from 'next/link'

export const metadata = {
  title: '개인정보보호방침 | Grimoire',
  description: '그리모어 개인정보 처리방침',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="px-6 py-4 border-b border-neutral-200">
        <Link href="/" className="text-sm uppercase tracking-[0.15em] text-neutral-500 hover:text-black transition">Grimoire</Link>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-black mb-8">개인정보보호방침</h1>
        <p className="text-sm text-neutral-400 mb-8">시행일: 2026년 4월 5일</p>

        <div className="prose prose-neutral max-w-none text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-bold text-black">1. 수집하는 개인정보</h2>
            <h3 className="text-base font-semibold text-black mt-4">회원가입 시</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>이메일 (필수) — 계정 식별, 로그인</li>
              <li>비밀번호 (필수) — bcrypt 해시로 저장, 원문 미보관</li>
              <li>필명/작가명 (필수) — 서비스 내 표시</li>
              <li>작가 공간 주소 (필수) — 고유 URL 생성</li>
            </ul>

            <h3 className="text-base font-semibold text-black mt-4">자동 수집</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>IP 주소 — 댓글/좋아요 시 중복 방지, 악용 차단</li>
              <li>쿠키 — 로그인 인증, 비로그인 식별</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">2. 개인정보 이용 목적</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스 제공: 회원 인증, 작가 공간 운영, 에피소드 열람</li>
              <li>AI 기능: 테마 생성 시 분위기 설명 텍스트를 AI(Anthropic Claude)에 전달</li>
              <li>보안: reCAPTCHA(Google), IP 기반 악용 차단</li>
              <li>통계: 조회수 등 서비스 개선용 익명 통계</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">3. 제3자 제공</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google — reCAPTCHA 봇 방지, OAuth 소셜 로그인</li>
              <li>Anthropic — AI 테마 생성 (분위기 설명 텍스트만 전달, 원고 원문 미제공)</li>
              <li>결제 대행사(PayApp) — 결제 처리</li>
              <li>Microsoft Azure — 클라우드 인프라</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">4. 쿠키 사용</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>grimoire_token</code> — 로그인 인증 (HttpOnly, Secure, 15분)</li>
              <li><code>grimoire_refresh</code> — 토큰 갱신 (HttpOnly, Secure, 7일)</li>
              <li><code>grimoire_anon</code> — 비로그인 좋아요 중복 방지</li>
              <li>Google reCAPTCHA 쿠키 — 봇 방지</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">5. 보유 및 파기</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>회원 정보 — 탈퇴 시 즉시 삭제</li>
              <li>IP 주소 — 작성일로부터 1년 후 삭제</li>
              <li>결제 기록 — 전자상거래법에 따라 5년 보관</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">6. 이용자의 권리</h2>
            <p>열람, 수정, 삭제, 처리 정지 요청이 가능합니다. 서비스 내 설정 페이지 또는 이메일(grimoire.book@gmail.com)로 요청하세요.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">7. 보호 조치</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>비밀번호 bcrypt 암호화</li>
              <li>HTTPS(TLS 1.2+) 전구간 적용</li>
              <li>HttpOnly + Secure 쿠키</li>
              <li>Helmet.js 보안 헤더</li>
              <li>Rate Limiting</li>
            </ul>
          </section>

          <p className="text-neutral-400 pt-8 border-t border-neutral-200">
            개인정보 보호책임자: grimoire.book@gmail.com
          </p>
        </div>
      </main>
    </div>
  )
}
