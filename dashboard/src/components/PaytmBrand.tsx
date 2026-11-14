export function PaytmBrand({
  product = 'Neighbourhood',
  onHome,
}: {
  product?: string
  onHome?: () => void
}) {
  return (
    <button
      type="button"
      className="brand brand-btn"
      onClick={onHome}
      aria-label={`Paytm ${product} home`}
    >
      <img
        className="paytm-logo"
        src="https://pwebassets.paytm.com/commonwebassets/paytmweb/header/images/logo_new.svg"
        alt="Paytm"
        width={92}
        height={28}
      />
      {product ? <span className="prod">{product}</span> : null}
    </button>
  )
}

export function PaytmStripe() {
  return <div className="paytm-stripe" aria-hidden="true" />
}
