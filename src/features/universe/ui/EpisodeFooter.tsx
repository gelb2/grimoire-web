"use client"

// 에피소드 하단 — 이전화/좋아요/다음화 + 댓글 (대댓글 지원)

import { useState, useEffect } from 'react'
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
      } catch { /* 로그인 필요 */ }
    })
  }

  const handleComment = async () => {
    if (!newComment.trim() || submitting) return
    setSubmitting(true)
    try {
      const comment = await api.createComment(episodeId, newComment)
      setComments(prev => [...prev, comment])
      setNewComment('')
    } catch { /* 로그인 필요 */ }
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
    } catch { /* 로그인 필요 */ }
    finally { setSubmitting(false) }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (deletingComments.get(commentId)) return  // 이미 삭제 중
    setDeletingComments(prev => new Map(prev).set(commentId, true))
    try {
      await api.deleteComment(commentId)
      // 댓글 삭제 시 해당 댓글의 대댓글도 제거
      setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId))
    } catch {}
    finally {
      setDeletingComments(prev => {
        const next = new Map(prev)
        next.delete(commentId)
        return next
      })
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
      <div className="flex items-center justify-center gap-4 py-6 border-t border-b border-u-border">
        {prevEpisodeSlug ? (
          <a href={`/${authorSlug}/${workSlug}/${prevEpisodeSlug}`} className="px-4 py-2 rounded-lg text-sm text-u-text-muted transition hover:opacity-80">
            &larr; 이전화
          </a>
        ) : (
          <span className="px-4 py-2 text-sm text-u-text-muted opacity-30">이전화</span>
        )}

        <button onClick={handleLike} disabled={likeThrottle.pending} className={`px-6 py-2 rounded-full border text-sm transition hover:opacity-80 disabled:opacity-50 ${liked ? 'border-u-accent text-u-accent' : 'border-u-border text-u-text-muted'}`}>
          {liked ? '\u2665' : '\u2661'} {likeCount} 좋아요
        </button>

        {nextEpisodeSlug ? (
          <a href={`/${authorSlug}/${workSlug}/${nextEpisodeSlug}`} className="px-4 py-2 rounded-lg text-sm text-u-text-muted transition hover:opacity-80">
            다음화 &rarr;
          </a>
        ) : (
          <span className="px-4 py-2 text-sm text-u-text-muted opacity-30">다음화</span>
        )}
      </div>

      {/* 댓글 */}
      <div className="mt-8">
        <h3 className="text-sm font-medium mb-4 text-u-text-muted">
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
            className="flex-1 px-4 py-2 rounded-lg text-sm border border-u-border bg-u-bg text-u-text focus:outline-none transition"
          />
          <button
            onClick={handleComment}
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-u-accent text-u-bg transition disabled:opacity-30"
          >
            등록
          </button>
        </div>

        {comments.length === 0 ? (
          <p className="text-center py-8 text-sm text-u-text-muted">
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
                        className="flex-1 px-3 py-1.5 rounded-lg text-sm border border-u-border bg-u-bg text-u-text focus:outline-none transition"
                      />
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={submitting || !replyContent.trim()}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-u-accent text-u-bg transition disabled:opacity-30"
                      >
                        답글
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyContent('') }}
                        className="px-3 py-1.5 rounded-lg text-xs text-u-text-muted border border-u-border transition hover:opacity-80"
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
    <div className="py-3 border-b border-u-border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-u-text-muted">
          {comment.authorName || '독자'}
        </span>
        <span className="text-xs text-u-text-dim">
          {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-u-text">
        {comment.content}
      </p>
      <div className="flex items-center gap-3 mt-1.5">
        {/* 답글 버튼 — 최상위 댓글에만 표시 (2depth 제한) */}
        {!isReply && onReply && (
          <button
            onClick={onReply}
            className="text-xs text-u-text-dim hover:text-u-text-muted transition"
          >
            답글
          </button>
        )}
        <button
          onClick={() => onDelete(comment.id)}
          disabled={deleting}
          className="text-xs text-u-text-dim hover:text-red-400 transition disabled:opacity-30"
        >
          삭제
        </button>
      </div>
    </div>
  )
}
