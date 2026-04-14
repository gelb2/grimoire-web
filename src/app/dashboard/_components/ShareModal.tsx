"use client"

import { toast } from 'sonner'

export interface ShareModalData {
  workId: string
  episodeId: string
  title: string
}

export interface ShareResultData {
  sharedUrl: string
  expireAt: string | null
}

interface ShareModalProps {
  modal: ShareModalData
  result: ShareResultData | null
  onCreateShare: (expireIn: '12h' | '24h' | '48h' | 'never') => void
  onClose: () => void
}

export function ShareModal({ modal, result, onCreateShare, onClose }: ShareModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-black mb-1">공유 링크 생성</h3>
        <p className="text-sm text-neutral-500 mb-4">&ldquo;{modal.title}&rdquo;</p>

        {result ? (
          <div className="space-y-3">
            <div className="bg-neutral-50 rounded-lg p-3">
              <p className="text-xs text-neutral-500 mb-1">공유 링크</p>
              <p className="text-sm text-black break-all font-mono">{result.sharedUrl}</p>
            </div>
            {result.expireAt && (
              <p className="text-xs text-neutral-500">
                만료: {new Date(result.expireAt).toLocaleString('ko-KR')}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(result.sharedUrl); toast.success('링크가 복사됐습니다') }}
                className="flex-1 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-neutral-800 transition"
              >
                링크 복사
              </button>
              <button onClick={onClose}
                className="px-4 py-2 border border-neutral-300 text-neutral-500 text-sm rounded-lg hover:border-black transition">
                닫기
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-neutral-600 mb-2">만료 시간을 선택하세요</p>
            {(['12h', '24h', '48h', 'never'] as const).map(opt => (
              <button key={opt} onClick={() => onCreateShare(opt)}
                className="w-full px-4 py-2.5 text-left text-sm border border-neutral-200 rounded-lg hover:border-black hover:bg-neutral-50 transition">
                {opt === 'never' ? '무제한' : opt.replace('h', '시간')}
              </button>
            ))}
            <button onClick={onClose}
              className="w-full px-4 py-2 text-neutral-500 text-sm hover:text-black transition mt-2">
              취소
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
