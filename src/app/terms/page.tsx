import { PlatformNav } from '@/components/PlatformNav'

export const metadata = {
  title: '이용약관 | Grimoire',
  description: '그리모어 서비스 이용약관',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-black mb-8">이용약관</h1>
        <p className="text-sm text-neutral-400 mb-8">시행일: 2026년 4월 5일</p>

        <div className="prose prose-neutral max-w-none text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-bold text-black">제1조 (목적)</h2>
            <p>이 약관은 그리모어(이하 &quot;서비스&quot;)가 제공하는 소설 퍼블리싱 플랫폼 서비스의 이용조건 및 절차, 회원과 서비스 간의 권리·의무를 규정함을 목적으로 합니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">제2조 (정의)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li><strong>서비스</strong>: grimoire-book.com에서 운영하는 소설 퍼블리싱 플랫폼</li>
              <li><strong>회원</strong>: 본 약관에 동의하고 회원가입을 완료한 자</li>
              <li><strong>작가</strong>: 서비스에 원고를 업로드하고 작가 공간을 운영하는 회원</li>
              <li><strong>크레딧</strong>: 서비스 내 유료 기능 이용을 위한 가상 재화</li>
              <li><strong>테마</strong>: 작가 공간의 시각적 디자인을 결정하는 설정값</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">제6조 (원고 및 저작권)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>회원이 업로드한 원고의 저작권은 <strong>원저작자(회원)</strong>에게 있습니다.</li>
              <li>서비스는 원고를 플랫폼 내에서 표시·배포하는 데 필요한 범위 내에서만 이용합니다.</li>
              <li>회원은 언제든지 자신의 원고를 삭제할 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">제7조 (데이터 분석 활용 동의)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스는 원고에서 <strong>익명화된 통계 데이터</strong>(장르, 키워드, 분량)를 추출하여 활용할 수 있습니다.</li>
              <li>원고 원문 텍스트는 외부에 제공되지 않습니다.</li>
              <li>회원은 설정 페이지에서 데이터 분석 활용을 거부할 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">제8조 (크레딧 및 결제)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>AI 테마 생성 시 1크레딧이 차감되며, 생성 실패 시 자동 환불됩니다.</li>
              <li>구매한 크레딧은 현금 환불이 불가합니다 (법령에 따른 청약철회 기간 제외).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">제9조 (구독 플랜)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>유료 플랜 만료 시 작가 공간은 시스템 기본 테마로 전환됩니다.</li>
              <li>커스텀 테마는 삭제되지 않고 보관되며, 재구독 시 복원 가능합니다.</li>
            </ul>
          </section>

          <p className="text-neutral-400 pt-8 border-t border-neutral-200">
            전체 약관은 <a href="https://grimoire-book.com/terms" className="underline">grimoire-book.com/terms</a>에서 확인할 수 있습니다.
            <br />문의: grimoire.book@gmail.com
          </p>
        </div>
      </main>
    </div>
  )
}
