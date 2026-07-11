/**
 * BFF (Backend For Frontend) API 프록시
 *
 * 클라이언트 → /api/... → 이 Route Handler → grimoire-server
 *
 * - 클라이언트는 같은 도메인으로만 호출 → CORS 문제 없음
 * - 백엔드 URL(API_URL)은 런타임 환경변수 → Docker 이미지 1개로 모든 환경 배포
 * - HttpOnly Cookie가 같은 도메인이므로 자동 전송
 */
import { NextRequest, NextResponse } from 'next/server'

function getApiUrl(): string {
  return process.env.API_URL || 'http://localhost:3000/api'
}

/**
 * 공통 프록시 로직 — 모든 HTTP 메서드에서 재사용
 */
async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string,
): Promise<NextResponse> {
  const { path } = await params
  const apiPath = path.join('/')
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${getApiUrl()}/${apiPath}${searchParams ? `?${searchParams}` : ''}`

  // 요청 헤더 구성
  const headers: Record<string, string> = {}

  const contentType = request.headers.get('Content-Type')
  if (contentType) headers['Content-Type'] = contentType

  // 인증 쿠키 전달
  const cookie = request.headers.get('cookie')
  if (cookie) headers['Cookie'] = cookie

  // Authorization 헤더 전달
  const authorization = request.headers.get('authorization')
  if (authorization) headers['Authorization'] = authorization

  // 요청 옵션 — 클라이언트의 AbortSignal을 백엔드로 전파해 서버측에서도 요청을 중단.
  // 전파하지 않으면 클라 timeout 후에도 백엔드가 Claude/OpenAI 호출을 계속 진행해
  // 불필요한 토큰 비용 + DB 트랜잭션 지속. signal 전파로 전체 경로에서 동일 시점 취소.
  const fetchOptions: RequestInit = {
    method,
    headers,
    cache: 'no-store',
    signal: request.signal,
  }

  // GET/HEAD 외에는 body 전달 — arrayBuffer로 원본 바이트 무손실 중계 (F-6).
  // request.text()는 UTF-8 lossy 디코딩이라 커버 이미지·DOCX 등 바이너리/multipart 바이트를
  // 손상시킨다(예: 0x89 PNG 헤더 → U+FFFD 치환). Content-Type(=boundary)은 위에서 원본 그대로
  // 전달하므로, 바디도 원본 바이트 그대로 전달해야 서버가 multipart를 정상 파싱한다.
  if (method !== 'GET' && method !== 'HEAD') {
    const bodyBuffer = await request.arrayBuffer()
    if (bodyBuffer.byteLength > 0) {
      fetchOptions.body = bodyBuffer
    }
  }

  try {
    const res = await fetch(url, fetchOptions)

    const data = await res.text()
    const response = new NextResponse(data, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/json',
      },
    })

    // 백엔드의 Set-Cookie 헤더 전달 (인증 토큰 등)
    const setCookie = res.headers.getSetCookie()
    setCookie.forEach((c) => response.headers.append('Set-Cookie', c))

    return response
  } catch (error) {
    // 백엔드 연결 실패
    console.error(`[BFF Proxy] ${method} ${url} 실패:`, error)
    return NextResponse.json(
      { message: '서버에 연결할 수 없습니다.' },
      { status: 502 },
    )
  }
}

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params, 'GET')
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params, 'POST')
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params, 'PUT')
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params, 'PATCH')
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params, 'DELETE')
}
