import { useEffect, type ReactNode } from 'react'

/** Mobile bottom → top sheet / desktop-friendly panel */
export function BottomSheet({
  open,
  title,
  onClose,
  children,
  tall,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  tall?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="sheet-root" role="presentation">
      <button type="button" className="sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className={`sheet-panel ${tall ? 'tall' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sheet-grab" aria-hidden="true" />
        <header className="sheet-hd">
          <h3>{title}</h3>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="sheet-bd">{children}</div>
      </div>
    </div>
  )
}
