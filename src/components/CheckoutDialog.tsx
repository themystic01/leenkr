import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Check, CreditCard, Loader2, Lock, ShieldCheck, X } from 'lucide-react'
import { purchaseProduct } from '../lib/api'
import { GATEWAYS, money, splitPayment, type GatewayKey } from '../lib/payments'
import { rememberOrderToken } from '../lib/download'
import type { Product } from '../store'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Props = {
  open: boolean
  product: Product
  onClose: () => void
  onPaid: (token: string, reference: string) => void
}

/**
 * Payment simulation. The provider is chosen like a real Nigerian checkout
 * (Paystack / Flutterwave / Monnify), the fees are shown before paying, and the
 * order is recorded by the database once the "gateway" reports success. No card
 * details are collected and no gateway is called yet.
 */
export default function CheckoutDialog({ open, product, onClose, onPaid }: Props) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [provider, setProvider] = useState<GatewayKey>('paystack')
  const [error, setError] = useState('')
  const [step, setStep] = useState<'details' | 'processing' | 'done'>('details')
  const [receipt, setReceipt] = useState<{ reference: string; token: string } | null>(null)

  useEffect(() => {
    if (!open) return
    setStep('details')
    setReceipt(null)
    setError('')
  }, [open, product.id])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && step !== 'processing') onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open, step, onClose])

  if (!open) return null

  const split = splitPayment(product.price, product.currency)
  const active = GATEWAYS.find((gateway) => gateway.key === provider) ?? GATEWAYS[0]

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter the email the receipt should go to.')
      return
    }
    setError('')
    setStep('processing')

    // The gateway round trip will live here; for now it is one deliberate pause
    // so the states read like a real checkout.
    await new Promise((resolve) => setTimeout(resolve, 1400))
    const result = await purchaseProduct(product.id, email, name, provider)

    if (!result.ok) {
      setStep('details')
      setError(result.error)
      return
    }

    rememberOrderToken(product.id, result.token)
    setReceipt({ reference: result.reference, token: result.token })
    setStep('done')
    onPaid(result.token, result.reference)
  }

  return (
    <div
      className="dialog-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && step !== 'processing') onClose()
      }}
    >
      <div className="dialog checkout" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <header className="dialog-head">
          <span className="dialog-mark">
            {step === 'done' ? <Check size={18} /> : <CreditCard size={18} />}
          </span>
          <div>
            <h2 id="checkout-title">
              {step === 'done' ? 'Payment complete' : step === 'processing' ? 'Talking to the gateway' : 'Checkout'}
            </h2>
            <p className="dialog-sub">
              {step === 'done'
                ? 'The file is unlocked for this product.'
                : `${product.title} · ${money(product.price, product.currency)}`}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close checkout"
            disabled={step === 'processing'}
          >
            <X size={18} />
          </button>
        </header>

        {step === 'done' && receipt ? (
          <div className="dialog-body">
            <div className="checkout-receipt">
              <span className="checkout-tick">
                <Check size={22} />
              </span>
              <div>
                <p className="checkout-strong">Paid {money(product.price, product.currency)}</p>
                <p className="checkout-muted">
                  Receipt {receipt.reference} · {active.label} (simulated)
                </p>
              </div>
            </div>
            <p className="checkout-note">
              Use the download button on the product to fetch the file. This device keeps the purchase, so the
              link works again later.
            </p>
            <footer className="dialog-foot">
              <button type="button" className="btn" onClick={onClose}>
                Back to the product
                <ArrowRight size={16} />
              </button>
            </footer>
          </div>
        ) : (
          <form className="dialog-form" onSubmit={submit} noValidate>
            <div className="dialog-body">
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="checkout-email">Receipt email</label>
                  <input
                    id="checkout-email"
                    type="email"
                    className="input"
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={email}
                    disabled={step === 'processing'}
                    onChange={(event) => {
                      setError('')
                      setEmail(event.target.value)
                    }}
                  />
                </div>
                <div className="field">
                  <label htmlFor="checkout-name">Name (optional)</label>
                  <input
                    id="checkout-name"
                    className="input"
                    autoComplete="name"
                    placeholder="Ada Obi"
                    value={name}
                    disabled={step === 'processing'}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>Pay with</label>
                <div className="gateway-list" role="radiogroup" aria-label="Payment provider">
                  {GATEWAYS.map((gateway) => (
                    <button
                      key={gateway.key}
                      type="button"
                      role="radio"
                      aria-checked={provider === gateway.key}
                      className={provider === gateway.key ? 'gateway on' : 'gateway'}
                      disabled={step === 'processing'}
                      onClick={() => setProvider(gateway.key)}
                    >
                      <span className="gateway-name">
                        {gateway.label}
                        {provider === gateway.key ? <Check size={14} /> : null}
                      </span>
                      <span className="gateway-note">{gateway.note}</span>
                      <span className="gateway-channels">{gateway.channels}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="checkout-split">
                <div>
                  <span>Product</span>
                  <strong>{money(product.price, product.currency)}</strong>
                </div>
                <div>
                  <span>Processing ({active.label})</span>
                  <strong>{money(split.gateway, product.currency)}</strong>
                </div>
                <div>
                  <span>Platform fee</span>
                  <strong>{money(split.platform, product.currency)}</strong>
                </div>
                <div className="checkout-total">
                  <span>Creator receives</span>
                  <strong>{money(split.net, product.currency)}</strong>
                </div>
              </div>

              <p className="dialog-sub checkout-note">
                <ShieldCheck size={14} /> Simulation only — no card is charged. Provider choice is stored on the
                order so a real gateway can take over unchanged.
              </p>

              {error ? <p className="field-error">{error}</p> : null}
            </div>

            <footer className="dialog-foot">
              <button type="button" className="btn ghost" onClick={onClose} disabled={step === 'processing'}>
                Cancel
              </button>
              <button type="submit" className="btn" disabled={step === 'processing'}>
                {step === 'processing' ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Confirming…
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    Pay {money(product.price, product.currency)}
                  </>
                )}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  )
}
