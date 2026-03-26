"use client"

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

export function EpisodeFooter({ episodeId, authorSlug, workSlug, prevEpisodeSlug, nextEpisodeSlug }: EpisodeFooterProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingComments, setDeletingComments] = useState<Map<string, boolean>>(new Map())
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

  const handleDeleteComment = async (commentId: string) => {
    if (deletingComments.get(commentId)) return  // 이미 삭제 중
    setDeletingComments(prev => new Map(prev).set(commentId, true))
    try {
      await api.deleteComment(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch {}
    finally {
      setDeletingComments(prev => {
        const next = new Map(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-16 mb-8">
      {/* 이전화/좋아요/다음화 */}
      <div className="flex items-center justify-center gap-4 py-6 border-t border-b" style={{ borderColor: 'var(--u-border, #333)' }}>
        {prevEpisodeSlug ? (
          <a href={`/${authorSlug}/${prevEpisodeSlug}`} className="px-4 py-2 rounded-lg text-sm transition hover:opacity-80" style={{ color: 'var(--u-text-muted, #999)' }}>
            &larr; 이전화
          </a>
        ) : (
          <span className="px-4 py-2 text-sm opacity-30" style={{ color: 'var(--u-text-muted, #999)' }}>이전화</span>
        )}

        <button onClick={handleLike} disabled={likeThrottle.pending} className="px-6 py-2 rounded-full border text-sm transition hover:opacity-80 disabled:opacity-50" style={{ borderColor: liked ? 'var(--u-accent, #c8a96e)' : 'var(--u-border, #333)', color: liked ? 'var(--u-accent, #c8a96e)' : 'var(--u-text-muted, #999)' }}>
          {liked ? '\u2665' : '\u2661'} {likeCount} 좋아요
        </button>

        {nextEpisodeSlug ? (
          <a href={`/${authorSlug}/${nextEpisodeSlug}`} className="px-4 py-2 rounded-lg text-sm transition hover:opacity-80" style={{ color: 'var(--u-text-muted, #999)' }}>
            다음화 &rarr;
          </a>
        ) : (
          <span className="px-4 py-2 text-sm opacity-30" style={{ color: 'var(--u-text-muted, #999)' }}>다음화</span>
        )}
      </div>

      {/* 댓글 */}
      <div className="mt-8">
        <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--u-text-muted, #999)' }}>
          댓글 {comments.length}
        </h3>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleComment()}
            placeholder="작품에 대한 감상을 남겨주세요..."
            maxLength={500}
            className="flex-1 px-4 py-2 rounded-lg text-sm border focus:outline-none transition"
            style={{ backgroundColor: 'var(--u-bg, #0a0a0a)', borderColor: 'var(--u-border, #333)', color: 'var(--u-text, #d4c5a0)' }}
          />
          <button
            onClick={handleComment}
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-30"
            style={{ backgroundColor: 'var(--u-accent, #c8a96e)', color: 'var(--u-bg, #0a0a0a)' }}
          >
            등록
          </button>
        </div>

        {comments.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--u-text-muted, #666)' }}>
            아직 댓글이 없습니다. 첫 감상을 남겨보세요.
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <div key={comment.id} className="py-3 border-b" style={{ borderColor: 'var(--u-border, #222)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--u-text-muted, #999)' }}>
                    {comment.authorName || '독자'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--u-text-muted, #666)' }}>
                    {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--u-text, #d4c5a0)' }}>
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
