"use client"

// 에피소드 하단 — 이전화/좋아요/다음화 + 댓글 (대댓글 지원, 비로그인 참여 지원)

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthProvider'
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
  authorId: string | null
  episodeId: string
  content: string
  nickname?: string
  parentId?: string
  authorName?: string
  createdAt: string
}

export function EpisodeFooter({ episodeId, authorSlug, workSlug, prevEpisodeSlug, nextEpisodeSlug }: EpisodeFooterProps) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [comments, setComments] = useState<CommentData[]>([])
  const [newComment, setNewComment] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingComments, setDeletingComments] = useState<Map<string, boolean>>(new Map())
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [showGiftPopup, setShowGiftPopup] = useState(false)
  const [giftSending, setGiftSending] = useState(false)
  const [giftMessage, setGiftMessage] = useState<string | null>(null)
  // 익명 댓글용
  const [anonNickname, setAnonNickname] = useState('')
  const [anonPassword, setAnonPassword] = useState('')
  const [deletePasswordModal, setDeletePasswordModal] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const likeThrottle = useThrottledAction(1000)

  useEffect(() => {
    // 익명 닉네임 복원 (localStorage → hydration 이후)
    const saved = localStorage.getItem('grimoire_anon_nickname')
    if (saved) setAnonNickname(saved)
  }, [])

  useEffect(() => {
    // 좋아요 상태+수 한 번에 조회
    api.getLikeStatus(episodeId).then(data => {
      setLiked(data.liked)
      setLikeCount(data.likeCount)
    }).catch(() => {
      api.getLikeCount(episodeId).then(data => setLikeCount(data.count)).catch(() => {})
    })
    api.getComments(episodeId).then(setComments).catch(() => {})
    // 북마크/진행도는 로그인 시에만
    if (user) {
      api.getBookmarks().then(bookmarks => {
        setBookmarked(bookmarks.some((b: { episodeId: string }) => b.episodeId === episodeId))
      }).catch(() => {})
      api.saveProgress(episodeId, 0).catch(() => {})
    }
  }, [episodeId, user])

  const handleLike = () => {
    likeThrottle.execute(async () => {
      try {
        const result = await api.toggleLike(episodeId)
        setLiked(result.liked)
        setLikeCount(result.likeCount)
      } catch {
        // 비로그인 409 = 이미 좋아요 누름
        toast.error('이미 좋아요를 눌렀습니다')
      }
    })
  }

  const handleBookmark = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다')
      return
    }
    try {
      const result = await api.toggleBookmark(episodeId)
      setBookmarked(result.bookmarked)
      toast.success(result.bookmarked ? '서재에 추가됐습니다' : '서재에서 제거됐습니다')
    } catch {
      toast.error('서재 기능은 로그인이 필요합니다')
    }
  }

  const handleComment = async () => {
    if (!newComment.trim() || submitting) return
    // 비로그인이면 닉네임/비밀번호 확인
    if (!user) {
      if (!anonNickname.trim() || anonNickname.trim().length < 2) {
        toast.error('닉네임을 2자 이상 입력해주세요')
        return
      }
      if (!anonPassword || anonPassword.length < 4) {
        toast.error('비밀번호를 4자 이상 입력해주세요')
        return
      }
    }
    setSubmitting(true)
    try {
      const anonymous = !user ? { nickname: anonNickname.trim(), password: anonPassword } : undefined
      const comment = await api.createComment(episodeId, newComment, undefined, anonymous, honeypot)
      setComments(prev => [...prev, comment])
      setNewComment('')
      if (!user) {
        localStorage.setItem('grimoire_anon_nickname', anonNickname.trim())
        setAnonPassword('')
      }
    } catch {
      toast.error('댓글 작성에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || submitting) return
    if (!user) {
      if (!anonNickname.trim() || anonNickname.trim().length < 2) {
        toast.error('닉네임을 2자 이상 입력해주세요')
        return
      }
      if (!anonPassword || anonPassword.length < 4) {
        toast.error('비밀번호를 4자 이상 입력해주세요')
        return
      }
    }
    setSubmitting(true)
    try {
      const anonymous = !user ? { nickname: anonNickname.trim(), password: anonPassword } : undefined
      const comment = await api.createComment(episodeId, replyContent, parentId, anonymous, honeypot)
      setComments(prev => [...prev, comment])
      setReplyContent('')
      setReplyingTo(null)
      if (!user) {
        localStorage.setItem('grimoire_anon_nickname', anonNickname.trim())
        setAnonPassword('')
      }
    } catch {
      toast.error('답글 작성에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string, isAnonymous: boolean) => {
    if (deletingComments.get(commentId)) return
    // 익명 댓글이면 비밀번호 모달 열기
    if (isAnonymous && !user) {
      setDeletePasswordModal(commentId)
      setDeletePassword('')
      return
    }
    setDeletingComments(prev => new Map(prev).set(commentId, true))
    try {
      await api.deleteComment(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId))
    } catch {
      toast.error('댓글 삭제에 실패했습니다')
    } finally {
      setDeletingComments(prev => {
        const next = new Map(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  const handleDeleteAnonymousComment = async () => {
    if (!deletePasswordModal || !deletePassword) return
    const commentId = deletePasswordModal
    setDeletingComments(prev => new Map(prev).set(commentId, true))
    try {
      await api.deleteComment(commentId, deletePassword)
      setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId))
      setDeletePasswordModal(null)
      setDeletePassword('')
    } catch {
      toast.error('비밀번호가 일치하지 않습니다')
    } finally {
      setDeletingComments(prev => {
        const next = new Map(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  const handleGift = async (amount: number) => {
    if (giftSending) return
    if (!user) {
      toast.error('로그인이 필요합니다')
      return
    }
    setGiftSending(true)
    try {
      await api.giftCredits(authorSlug, amount)
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

        <button onClick={handleBookmark} className={`px-4 py-2 rounded-full border text-sm transition hover:opacity-80 ${bookmarked ? 'border-g-accent text-g-accent' : 'border-g-border text-g-text-muted'}`}>
          {bookmarked ? '★' : '☆'} 서재
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
        <div className="mb-6 space-y-2">
          {/* 비로그인 시 닉네임/비밀번호 필드 */}
          {!user && (
            <div className="flex gap-2">
              <input
                type="text"
                value={anonNickname}
                onChange={e => setAnonNickname(e.target.value)}
                placeholder="닉네임 (2~20자)"
                maxLength={20}
                className="w-32 px-3 py-1.5 rounded-lg text-xs border border-g-border bg-g-bg text-g-text focus:outline-none transition"
              />
              <input
                type="password"
                value={anonPassword}
                onChange={e => setAnonPassword(e.target.value)}
                placeholder="비밀번호 (4~20자)"
                maxLength={20}
                className="w-32 px-3 py-1.5 rounded-lg text-xs border border-g-border bg-g-bg text-g-text focus:outline-none transition"
              />
              <span className="text-xs text-g-text-dim self-center">삭제 시 비밀번호가 필요합니다</span>
            </div>
          )}
          {/* honeypot — 봇 방어용 숨겨진 필드 */}
          <input
            type="text"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
          />
          <div className="flex gap-2">
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
        </div>

        {comments.length === 0 ? (
          <p className="text-center py-8 text-sm text-g-text-muted">
            아직 댓글이 없습니다. 첫 감상을 남겨보세요.
          </p>
        ) : (
          <div className="space-y-4">
            {topLevelComments.map((comment) => (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  onReply={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  onDelete={(id) => handleDeleteComment(id, !comment.authorId)}
                  deleting={deletingComments.get(comment.id) ?? false}
                />

                {(repliesByParent[comment.id] ?? []).map((reply) => (
                  <div key={reply.id} className="pl-8">
                    <CommentItem
                      comment={reply}
                      onDelete={(id) => handleDeleteComment(id, !reply.authorId)}
                      deleting={deletingComments.get(reply.id) ?? false}
                      isReply
                    />
                  </div>
                ))}

                {replyingTo === comment.id && (
                  <div className="pl-8 mt-2 space-y-2">
                    {!user && (
                      <div className="flex gap-2">
                        <input type="text" value={anonNickname} onChange={e => setAnonNickname(e.target.value)} placeholder="닉네임" maxLength={20}
                          className="w-28 px-2 py-1 rounded text-xs border border-g-border bg-g-bg text-g-text focus:outline-none" />
                        <input type="password" value={anonPassword} onChange={e => setAnonPassword(e.target.value)} placeholder="비밀번호" maxLength={20}
                          className="w-28 px-2 py-1 rounded text-xs border border-g-border bg-g-bg text-g-text focus:outline-none" />
                      </div>
                    )}
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
                      <button onClick={() => handleReply(comment.id)} disabled={submitting || !replyContent.trim()}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-g-accent text-g-bg transition disabled:opacity-30">답글</button>
                      <button onClick={() => { setReplyingTo(null); setReplyContent('') }}
                        className="px-3 py-1.5 rounded-lg text-xs text-g-text-muted border border-g-border transition hover:opacity-80">취소</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 익명 댓글 삭제 비밀번호 모달 */}
      {deletePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-g-bg border border-g-border rounded-xl p-6 w-80 shadow-lg">
            <h4 className="text-sm font-medium text-g-text mb-3">댓글 삭제</h4>
            <p className="text-xs text-g-text-muted mb-3">작성 시 입력한 비밀번호를 입력하세요</p>
            <input
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDeleteAnonymousComment()}
              placeholder="비밀번호"
              autoFocus
              className="w-full px-3 py-2 rounded-lg text-sm border border-g-border bg-g-bg text-g-text focus:outline-none mb-3"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setDeletePasswordModal(null); setDeletePassword('') }}
                className="px-3 py-1.5 rounded-lg text-xs text-g-text-muted border border-g-border">취소</button>
              <button onClick={handleDeleteAnonymousComment} disabled={!deletePassword}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white disabled:opacity-30">삭제</button>
            </div>
          </div>
        </div>
      )}
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
  const isAnonymous = !comment.authorId
  const displayName = isAnonymous
    ? `${comment.nickname || '익명'}`
    : (comment.authorName || '독자')

  return (
    <div className="py-3 border-b border-g-border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-g-text-muted">
          {displayName}
          {isAnonymous && <span className="ml-1 text-g-text-dim">(익명)</span>}
        </span>
        <span className="text-xs text-g-text-dim">
          {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-g-text">
        {comment.content}
      </p>
      <div className="flex items-center gap-3 mt-1.5">
        {!isReply && onReply && (
          <button onClick={onReply} className="text-xs text-g-text-dim hover:text-g-text-muted transition">답글</button>
        )}
        <button onClick={() => onDelete(comment.id)} disabled={deleting}
          className="text-xs text-g-text-dim hover:text-red-400 transition disabled:opacity-30">삭제</button>
      </div>
    </div>
  )
}
