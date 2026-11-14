export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="empty-state">
      <span className="empty-mark" aria-hidden="true" />
      <strong>{title}</strong>
      <p>{body}</p>
      {actionLabel && onAction ? (
        <button type="button" className="empty-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
