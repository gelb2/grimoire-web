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
            {comments.map((comment: any) => (
              <div key={comment.id} className="py-3 border-b border-u-border">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
