import type { InventoryListing } from '../types'

export function DealModal({
  deal,
  onClose,
}: {
  deal: InventoryListing | null
  onClose: () => void
}) {
  if (!deal) return null

  return (
    <div className="modal-veil" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <h3>Deal request sent</h3>
          <button type="button" className="modal-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-bd">
          <div className={`inv-type ${deal.type}`}>
            {deal.type === 'surplus' ? 'Buy surplus' : 'Sell shortage'}
          </div>
          <h4>{deal.sku}</h4>
          <div className="modal-grid">
            <div>
              <label>Counterparty</label>
              <b>{deal.shopName}</b>
            </div>
            <div>
              <label>Distance</label>
              <b>{deal.distanceKm} km</b>
            </div>
            <div>
              <label>Qty</label>
              <b>{deal.qty}</b>
            </div>
            <div>
              <label>Unit price</label>
              <b>₹{deal.unitPrice}</b>
            </div>
            <div>
              <label>Match</label>
              <b>{deal.matchScore}</b>
            </div>
            <div>
              <label>Urgency</label>
              <b>{deal.urgency}</b>
            </div>
          </div>
          <p className="muted">{deal.reason}</p>
          <div className="modal-steps">
            <div><span>1</span> Merchant notified on Paytm</div>
            <div><span>2</span> Negotiate qty & pickup</div>
            <div><span>3</span> Settle on Paytm rails</div>
          </div>
          <button className="btn btn-primary" type="button" onClick={onClose} style={{ width: '100%' }}>
            Continue demo
          </button>
        </div>
      </div>
    </div>
  )
}
