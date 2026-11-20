import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { MarketingLayout } from '../components/marketing/SiteChrome'
import { cleanHandle } from '../lib/handle'
import { usePageTitle } from '../lib/title'

export default function Marketing() {
  usePageTitle('Leenkr — one link for everything you make')
  const navigate = useNavigate()
  const [handle, setHandle] = useState('')

  return (
    <MarketingLayout>
        <section className="mk-hero">
          <div className="mk-hero-inner">
            <div className="mk-hero-title">
              <h1 className="mk-h1">
                Everything you make,
                <br />
                behind <span className="mk-hl">one link</span>
              </h1>
            </div>

            <p className="mk-lede">
              Leenkr turns a long bio link into a page that sells: your products with real prices, your
              writing and videos, and a way to reach you — one section at a time.
            </p>

            <form
              className="mk-claim"
              onSubmit={(event) => {
                event.preventDefault()
                // the handle is picked up again on the onboarding step
                navigate(handle ? `/signup?handle=${encodeURIComponent(handle)}` : '/signup')
              }}
            >
              <input
                className="mk-claim-input"
                type="text"
                name="handle"
                placeholder="enter your username"
                aria-label="Your username"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={handle}
                onChange={(event) => setHandle(cleanHandle(event.target.value))}
              />
              <button className="mk-claim-btn" type="submit">
                Claim your link
              </button>
            </form>

            <p className="mk-trust">Start free. Takes one minute to set up.</p>
          </div>
        </section>

        <section className="mk-close">
          <div className="mk-close-inner">
            <h2 className="mk-h2">Your next customer is one link away</h2>
            <p className="mk-lede">
              Put your products, your links and your inbox on a page that looks like you made it.
            </p>
            <Link className="btn dark" to="/signup">
              Create your page — free
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
    </MarketingLayout>
  )
}
