import { useEffect, useState } from 'react'
import { db } from '../db'

/** Живёт, пока открыт расход: подгружает blob-ы и раздаёт object-URL-ы */
export function useReceiptUrls(expenseId: number | undefined) {
  const [urls, setUrls] = useState<{ id: number; url: string }[]>([])

  useEffect(() => {
    if (!expenseId) {
      setUrls([])
      return
    }
    let created: string[] = []
    let cancelled = false
    db.images
      .where('expenseId')
      .equals(expenseId)
      .toArray()
      .then((imgs) => {
        if (cancelled) return
        const next = imgs.map((img) => ({ id: img.id!, url: URL.createObjectURL(img.blob) }))
        created = next.map((n) => n.url)
        setUrls(next)
      })
    return () => {
      cancelled = true
      created.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [expenseId])

  return urls
}

/** Полноэкранный просмотр картинки */
export function ImageViewer({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <img src={url} alt="Чек" className="max-h-full max-w-full rounded-lg object-contain" />
      <button
        onClick={onClose}
        aria-label="Закрыть"
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full bg-white/20 p-3 text-white"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 3l10 10M13 3L3 13" />
        </svg>
      </button>
    </div>
  )
}
