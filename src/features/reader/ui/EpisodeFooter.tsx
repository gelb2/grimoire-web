"use client"

// 에피소드 하단 — 이전화/좋아요/다음화 + 댓글 (대댓글 지원)

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useThrottledAction } from '@/hooks/useThrottle'

interface EpisodeFooterProps {
  episodeId: string
  authorSlug: string
  workSlug: string
  prevEpisodeSlug?: string | null
  nextEpisodeSlug?: string | null
}

interface CommentData {
  id: string
  authorId: string
  episodeId: string
  content: string
  parentId?: string
  authorName?: string
  createdAt: string
}

export function EpisodeFooter({ episodeId, authorSlug, workSlug, prevEpisodeSlug, nextEpisodeSlug }: EpisodeFooterProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState<CommentData[]>([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingComments, setDeletingComments] = useState<Map<string, boolean>>(new Map())
  const [replyingTo, setReplyingTo] = useState<string | null>(null) // 답글 대상 댓글 ID
  const [replyContent, setReplyContent] = useState('')
  const [showGiftPopup, setShowGiftPopup] = useState(false)
  const [giftSending, setGiftSending] = useState(false)
  const [giftMessage, setGiftMessage] = useState<string | null>(null)
  const likeThrottle = useThrottledAction(1000)  // 좋아요 1초 쿨다운

  useEffect(() => {
    api.getLikeCount(episodeId).then(data => setLikeCount(data.count)).catch(() => {})
    api.getComments(episodeId).then(setComments).catch(() => {})
  }, [episodeId])

  const handleLike = () => {
    likeThrottle.execute(async () => {
      try {
        const result = await api.toggleLike(episodeId)
        setLiked(result.liked)
        setLikeCount(result.likeCount)
      } catch {
        toast.error('로그인이 필요합니다')
      }
    })
  }

  const handleComment = async () => {
    if (!newComment.trim() || submitting) return
    setSubmitting(true)
    try {
      const comment = await api.createComment(episodeId, newComment)
      setComments(prev => [...prev, comment])
      setNewComment('')
    } catch {
      toast.error('댓글 작성에 실패했습니다. 로그인을 확인하세요.')
    }
    finally { setSubmitting(false) }
  }

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || submitting) return
    setSubmitting(true)
    try {
      const comment = await api.createComment(episodeId, replyContent, parentId)
      setComments(prev => [...prev, comment])
      setReplyContent('')
      setReplyingTo(null)
    } catch {
      toast.error('답글 작성에 실패했습니다')
    }
    finally { setSubmitting(false) }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (deletingComments.get(commentId)) return  // 이미 삭제 중
    setDeletingComments(prev => new Map(prev).set(commentId, true))
    try {
      await api.deleteComment(commentId)
      // 댓글 삭제 시 해당 댓글의 대댓글도 제거
      setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId))
    } catch {
      toast.error('댓글 삭제에 실패했습니다')
    }
    finally {
      setDeletingComments(prev => {
        const next = new Map(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  const handleGift = async (amount: number) => {
    if (giftSending) return
    setGiftSending(true)
    try {
      const result = await api.giftCredits(authorSlug, amount)
      setGiftMessage(`${amount} 크레딧을 선물했습니다!`)
      setShowGiftPopup(false)
      setTimeout(() => setGiftMessage(null), 3000)
    } catch {
      setGiftMessage('선물 실패 — 로그인 또는 크레딧을 확인하세요')
      setTimeout(() => setGiftMessage(null), 3000)
    } finally {
      setGiftSending(false)
    }
  }

  // 댓글을 트리 구조로 분류 — 최상위 + 대댓글
  const topLevelComments = comments.filter(c => !c.parentId)
  const repliesByParent = comments.reduce<Record<string, CommentData[]>>((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = []
      acc[c.parentId].push(c)
    }
    return acc
  }, {})

  return (
    <div className="max-w-2xl mx-auto mt-16 mb-8">
      {/* 이전화/좋아요/다음화 */}
      <div className="flex items-center justify-center gap-4 py-6 border-t border-b border-g-border">
        {prevEpisodeSlug ? (
          <Link href={`/${authorSlug}/${workSlug}/${prevEpisodeSlug}`} className="px-4 py-2 rounded-lg text-sm text-g-text-muted transition hover:opacity-80">
            &larr; 이전화
          </Link>
        ) : (
          <span className="px-4 py-2 text-sm text-g-text-muted opacity-30">이전화</span>
        )}

        <button onClick={handleLike} disabled={likeThrottle.pending} className={`px-6 py-2 rounded-full border text-sm transition hover:opacity-80 disabled:opacity-50 ${liked ? 'border-g-accent text-g-accent' : 'border-g-border text-g-text-muted'}`}>
          {liked ? '\u2665' : '\u2661'} {likeCount} 좋아요
        </button>

        <div className="relative">
          <button
            onClick={() => setShowGiftPopup(!showGiftPopup)}
            className="px-4 py-2 rounded-full border border-g-border text-sm text-g-text-muted transition hover:border-g-accent hover:text-g-accent"
          >
            응원 보내기
          </button>
          {showGiftPopup && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-xl border border-g-border bg-g-bg2 shadow-lg z-10">
              <p className="text-xs text-g-text-muted mb-2 text-center whitespace-nowrap">크레딧 선물</p>
              <div className="flex gap-2">
                {[1, 3, 5].map(amount => (
                  <button
                    key={amount}
                    onClick={() => handleGift(amount)}
                    disabled={giftSending}
                    className="px-3 py-1.5 rounded-lg text-sm border border-g-border text-g-text hover:bg-g-accent hover:text-g-bg transition disabled:opacity-30"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {giftMessage && (
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-g-accent whitespace-nowrap">
            {giftMessage}
          </span>
        )}

        {nextEpisodeSlug ? (
          <Link href={`/${authorSlug}/${workSlug}/${nextEpisodeSlug}`} className="px-4 py-2 rounded-lg text-sm text-g-text-muted transition hover:opacity-80">
            다음화 &rarr;
          </Link>
        ) : (
          <span className="px-4 py-2 text-sm text-g-text-muted opacity-30">다음화</span>
        )}
      </div>

      {/* 댓글 */}
      <div className="mt-8">
        <h3 className="text-sm font-medium mb-4 text-g-text-muted">
          댓글 {comments.length}
        </h3>

        {/* 최상위 댓글 입력 */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleComment()}
            placeholder="작품에 대한 감상을 남겨주세요..."
            maxLength={500}
            className="flex-1 px-4 py-2 rounded-lg text-sm border border-g-border bg-g-bg text-g-text focus:outline-none transition"
          />
          <button
            onClick={handleComment}
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-g-accent text-g-bg transition disabled:opacity-30"
          >
            등록
          </button>
        </div>

        {comments.length === 0 ? (
          <p className="text-center py-8 text-sm text-g-text-muted">
            아직 댓글이 없습니다. 첫 감상을 남겨보세요.
          </p>
        ) : (
          <div className="space-y-4">
            {topLevelComments.map((comment) => (
              <div key={comment.id}>
                {/* 최상위 댓글 */}
                <CommentItem
                  comment={comment}
                  onReply={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  onDelete={handleDeleteComment}
                  deleting={deletingComments.get(comment.id) ?? false}
                />

                {/* 대댓글 목록 (들여쓰기) */}
                {(repliesByParent[comment.id] ?? []).map((reply) => (
                  <div key={reply.id} className="pl-8">
                    <CommentItem
                      comment={reply}
                      onDelete={handleDeleteComment}
                      deleting={deletingComments.get(reply.id) ?? false}
                      isReply
                    />
                  </div>
                ))}

                {/* 답글 입력폼 */}
                {replyingTo === comment.id && (
                  <div className="pl-8 mt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleReply(comment.id)}
                        placeholder="답글을 입력하세요..."
                        maxLength={500}
                        autoFocus
                        className="flex-1 px-3 py-1.5 rounded-lg text-sm border border-g-border bg-g-bg text-g-text focus:outline-none transition"
                      />
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={submitting || !replyContent.trim()}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-g-accent text-g-bg transition disabled:opacity-30"
                      >
                        답글
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyContent('') }}
                        className="px-3 py-1.5 rounded-lg text-xs text-g-text-muted border border-g-border transition hover:opacity-80"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** 개별 댓글 아이템 */
function CommentItem({
  comment,
  onReply,
  onDelete,
  deleting,
  isReply = false,
}: {
  comment: CommentData
  onReply?: () => void
  onDelete: (id: string) => void
  deleting: boolean
  isReply?: boolean
}) {
  return (
    <div className="py-3 border-b border-g-border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-g-text-muted">
          {comment.authorName || '독자'}
        </span>
        <span className="text-xs text-g-text-dim">
          {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-g-text">
        {comment.content}
      </p>
      <div className="flex items-center gap-3 mt-1.5">
        {/* 답글 버튼 — 최상위 댓글에만 표시 (2depth 제한) */}
        {!isReply && onReply && (
          <button
            onClick={onReply}
            className="text-xs text-g-text-dim hover:text-g-text-muted transition"
          >
            답글
          </button>
        )}
        <button
          onClick={() => onDelete(comment.id)}
          disabled={deleting}
          className="text-xs text-g-text-dim hover:text-red-400 transition disabled:opacity-30"
        >
          삭제
        </button>
      </div>
    </div>
  )
}
