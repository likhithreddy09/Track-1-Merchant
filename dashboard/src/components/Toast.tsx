import { useEffect } from 'react'

export type ToastItem = {
  id: string
  title: string
  body?: string
  tone?: 'ok' | 'info' | 'warn'
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const id = window.setTimeout(() => onDismiss(toast.id), 3200)
    return () => window.clearTimeout(id)
  }, [toast.id, onDismiss])

  return (
    <div className={`toast toast-${toast.tone || 'info'}`}>
      <div>
        <strong>{toast.title}</strong>
        {toast.body ? <p>{toast.body}</p> : null}
      </div>
      <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
