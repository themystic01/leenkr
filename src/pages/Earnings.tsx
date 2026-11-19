import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Banknote,
  Building2,
  Check,
  Clock,
  CreditCard,
  Loader2,
  Receipt,
  Wallet,
} from 'lucide-react'
import { NIGERIAN_BANKS, bankName } from '../lib/banks'
import { fetchEarnings, requestPayout, savePayoutAccount, type Earnings } from '../lib/api'
import { money } from '../lib/payments'
import { useSession } from '../auth'
import { hasBackend } from '../lib/supabase'
import { usePageTitle } from '../lib/title'

function when(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type EarningsView = 'overview' | 'sales' | 'payouts'

const VIEWS: { key: EarningsView; label: string; icon: typeof Wallet }[] = [
  { key: 'overview', label: 'Overview', icon: Wallet },
  { key: 'sales', label: 'Sales', icon: Receipt },
  { key: 'payouts', label: 'Payouts', icon: Banknote },
]

export default function EarningsPage() {
  usePageTitle('Earnings · Leenkr')
  const { session } = useSession()
  const [data, setData] = useState<Earnings | null>(null)
  const [loading, setLoading] = useState(hasBackend)
  const [error, setError] = useState('')
  const [view, setView] = useState<EarningsView>('overview')

  // payout form
  const [bankCode, setBankCode] = useState('058')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [accountSaved, setAccountSaved] = useState(false)

  // withdrawal form
  const [amountText, setAmountText] = useState('')
  const [note, setNote] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [payoutNotice, setPayoutNotice] = useState('')

  const load = useCallback(async () => {
    if (!session || !hasBackend) {
      setLoading(false)
      return
    }
    const next = await fetchEarnings(session.userId)
    setData(next)
    setLoading(false)
    if (next?.account) {
      setBankCode(next.account.bankCode)
      setAccountNumber(next.account.accountNumber)
      setAccountName(next.account.accountName)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  const totals = useMemo(() => {
    const orders = data?.orders ?? []
    const paid = orders.filter((order) => order.status === 'paid')
    const gross = paid.reduce((sum, order) => sum + order.amount, 0)
    const net = paid.reduce((sum, order) => sum + order.creatorNet, 0)
    const fees = paid.reduce((sum, order) => sum + order.platformFee + order.gatewayFee, 0)
    const payouts = data?.payouts ?? []
    const paidOut = payouts
      .filter((payout) => payout.status === 'paid')
      .reduce((sum, payout) => sum + payout.amount, 0)
    const held = payouts
      .filter((payout) => payout.status === 'pending' || payout.status === 'processing')
      .reduce((sum, payout) => sum + payout.amount, 0)
    const best = [...paid].sort((a, b) => b.amount - a.amount)[0]
    return {
      gross,
      net,
      fees,
      paidOut,
      held,
      available: Math.max(net - paidOut - held, 0),
      sales: paid.length,
      best,
    }
  }, [data])

  const saveAccount = async (event: FormEvent) => {
    event.preventDefault()
    if (!session) {
      setError('Sign in again to save a payout account.')
      return
    }
    if (accountNumber.replace(/\s+/g, '').length !== 10) {
      setError('A Nigerian account number is 10 digits.')
      return
    }
    if (accountName.trim().length < 3) {
      setError('Add the name on the account.')
      return
    }
    setError('')
    setSavingAccount(true)
    const failure = await savePayoutAccount(session.userId, {
      bankCode,
      bankName: bankName(bankCode),
      accountNumber,
      accountName: accountName.trim(),
    })
    setSavingAccount(false)
    if (failure) {
      setError(failure)
      return
    }
    setAccountSaved(true)
    await load()
  }

  const withdraw = async (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(amountText.replace(/,/g, ''))
    if (!Number.isFinite(amount) || amount <= 0) {
      setPayoutNotice('Enter the amount to withdraw.')
      return
    }
    setPayoutNotice('')
    setRequesting(true)
    const result = await requestPayout(data?.account?.id ?? null, amount, note)
    setRequesting(false)
    if (!result.ok) {
      setPayoutNotice(result.error)
      return
    }
    setAmountText('')
    setNote('')
    setPayoutNotice(`Withdrawal ${result.reference} queued. Simulated payouts settle in 1–2 business days.`)
    await load()
  }

  if (!hasBackend) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <p className="eyebrow">Money</p>
            <h1 className="page-title">Earnings</h1>
            <p className="page-sub">Sales, fees and payouts all land here.</p>
          </div>
        </header>
        <div className="card">
          <div className="empty-panel">
            Sign in with the backend configured to see real earnings. The demo store has no orders.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Money</p>
          <h1 className="page-title">Earnings</h1>
          <p className="page-sub">
            Every product sale, the fees taken out of it, and what has been paid into your bank.
          </p>
        </div>
        <div className="head-actions">
          <Link className="btn ghost" to="/dashboard/insight">
            See traffic
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>

      <div className="switch" role="tablist" aria-label="Earnings sections">
        {VIEWS.map((item) => {
          const Icon = item.icon
          const selected = view === item.key
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={selected}
              className="switch-item"
              onClick={() => setView(item.key)}
            >
              <Icon size={15} strokeWidth={1.9} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      {view === 'overview' ? (
        <div className="panel earn-panel" role="tabpanel" aria-label="Overview">
          <section className="earn-grid">
            <div className="card earn-hero">
              <span className="earn-label">
                <Wallet size={15} /> Available to withdraw
              </span>
              <p className="earn-value">{money(totals.available)}</p>
              <p className="earn-note">
                {money(totals.net)} earned after fees · {money(totals.held)} already queued
              </p>
            </div>
            <div className="card earn-cell">
              <span className="earn-label">Lifetime sales</span>
              <p className="earn-cell-value">{money(totals.gross)}</p>
              <p className="earn-note">{totals.sales} paid orders</p>
            </div>
            <div className="card earn-cell">
              <span className="earn-label">Fees</span>
              <p className="earn-cell-value">{money(totals.fees)}</p>
              <p className="earn-note">Platform 5% + Nigerian gateway fee</p>
            </div>
            <div className="card earn-cell">
              <span className="earn-label">Paid out</span>
              <p className="earn-cell-value">{money(totals.paidOut)}</p>
              <p className="earn-note">Across {data?.payouts.length ?? 0} withdrawals</p>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Payout destination</h2>
              <button type="button" className="link-btn" onClick={() => setView('payouts')}>
                Manage payouts
              </button>
            </div>
            {data?.account ? (
              <p className="earn-note">
                {data.account.bankName} · {data.account.accountNumber} · {data.account.accountName}
              </p>
            ) : (
              <p className="earn-note">
                No bank account saved yet. Add one under Payouts so sales can be withdrawn.
              </p>
            )}
          </section>
        </div>
      ) : null}

      {view === 'sales' ? (
        <div className="panel earn-panel" role="tabpanel" aria-label="Sales">
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Sales</h2>
              <span className="card-note">{totals.sales} paid</span>
            </div>
            {loading ? (
              <p className="empty-panel">Loading sales…</p>
            ) : (data?.orders.length ?? 0) === 0 ? (
              <p className="empty-panel">
                No sales yet. Publish a product with a file and it can take payments.
              </p>
            ) : (
              <ul className="earn-list">
                {data!.orders.slice(0, 25).map((order) => (
                  <li key={order.id}>
                    <span className="earn-row-main">
                      <span className="earn-row-title">{order.productTitle}</span>
                      <span className="earn-row-sub">
                        {order.buyerEmail} · {order.reference} · {when(order.createdAt)}
                      </span>
                    </span>
                    <span className="earn-row-money">
                      <strong>{money(order.amount, order.currency)}</strong>
                      <span className="earn-row-sub">
                        net {money(order.creatorNet, order.currency)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      {view === 'payouts' ? (
        <div className="panel earn-panel" role="tabpanel" aria-label="Payouts">
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Payout account</h2>
              <span className="card-note">Where the money lands</span>
            </div>
            <form className="stack" onSubmit={saveAccount}>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="payout-bank">Bank</label>
                  <select
                    id="payout-bank"
                    className="input"
                    value={bankCode}
                    onChange={(event) => {
                      setBankCode(event.target.value)
                      setAccountSaved(false)
                    }}
                  >
                    {NIGERIAN_BANKS.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="payout-account">Account number</label>
                  <input
                    id="payout-account"
                    className="input"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="0123456789"
                    value={accountNumber}
                    onChange={(event) => {
                      setAccountNumber(event.target.value.replace(/[^0-9]/g, ''))
                      setAccountSaved(false)
                    }}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="payout-name">Name on the account</label>
                <input
                  id="payout-name"
                  className="input"
                  placeholder="Ada Obi"
                  value={accountName}
                  onChange={(event) => {
                    setAccountName(event.target.value)
                    setAccountSaved(false)
                  }}
                />
              </div>
              {error ? <p className="field-error">{error}</p> : null}
              {accountSaved ? (
                <p className="earn-saved">
                  <Check size={14} /> Payout account saved
                </p>
              ) : null}
              <button type="submit" className="btn ghost" disabled={savingAccount}>
                {savingAccount ? <Loader2 size={15} className="spin" /> : <Building2 size={15} />}
                {savingAccount ? 'Saving…' : 'Save payout account'}
              </button>
            </form>
          </section>

          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Withdraw</h2>
              <span className="card-note">Simulated payout</span>
            </div>
            <form className="stack" onSubmit={withdraw}>
              <div className="field">
                <label htmlFor="payout-amount">Amount (₦)</label>
                <input
                  id="payout-amount"
                  className="input"
                  inputMode="decimal"
                  placeholder={totals.available > 0 ? String(totals.available) : '0'}
                  value={amountText}
                  onChange={(event) => setAmountText(event.target.value.replace(/[^0-9.]/g, ''))}
                />
                <span className="hint">
                  <CreditCard size={12} /> {money(totals.available)} available now
                </span>
              </div>
              <div className="field">
                <label htmlFor="payout-note">Note (optional)</label>
                <input
                  id="payout-note"
                  className="input"
                  placeholder="September sales"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
              <button type="submit" className="btn" disabled={requesting || !data?.account}>
                {requesting ? <Loader2 size={16} className="spin" /> : <Banknote size={16} />}
                {requesting ? 'Requesting…' : 'Request payout'}
              </button>
              {!data?.account ? <p className="hint">Save a bank account first.</p> : null}
              {payoutNotice ? <p className="earn-saved">{payoutNotice}</p> : null}
            </form>
          </section>

          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Withdrawal history</h2>
              <span className="card-note">
                {money(totals.paidOut)} paid · {money(totals.held)} queued
              </span>
            </div>
            {(data?.payouts.length ?? 0) === 0 ? (
              <p className="empty-panel">No withdrawals requested yet.</p>
            ) : (
              <ul className="earn-list">
                {data!.payouts.map((payout) => (
                  <li key={payout.id}>
                    <span className="earn-row-main">
                      <span className="earn-row-title">{money(payout.amount, payout.currency)}</span>
                      <span className="earn-row-sub">
                        {payout.reference} · {when(payout.requestedAt)}
                        {payout.note ? ` · ${payout.note}` : ''}
                      </span>
                    </span>
                    <span className={`earn-status ${payout.status}`}>
                      <Clock size={12} />
                      {payout.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}
