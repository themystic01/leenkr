import { BadgePercent, Banknote, Share2, UserPlus } from 'lucide-react'
import { CloseBand, MarketingLayout, PageHero, PageSection } from '../../components/marketing/SiteChrome'
import { usePageTitle } from '../../lib/title'

const STEPS = [
  {
    number: '01',
    icon: Share2,
    title: 'Get your link',
    copy: 'Apply with the handle your page lives on. We send back a referral link that points at the Leenkr sign-up.',
  },
  {
    number: '02',
    icon: UserPlus,
    title: 'They subscribe',
    copy: 'A creator who signs up through your link and moves onto a paid plan is counted as your referral — free sign-ups alone do not.',
  },
  {
    number: '03',
    icon: Banknote,
    title: 'You get paid',
    copy: 'Up to 5% of every payment that referral makes, paid out monthly once the balance clears the minimum.',
  },
]

const FAQ = [
  {
    q: 'How much is a referral worth?',
    a: 'Up to 5% of each payment the creator you referred makes. The exact rate depends on the plan they land on: Creator pays the full 5%, Pro pays 4%.',
  },
  {
    q: 'How long does the commission last?',
    a: 'For as long as the referred creator stays on a paid plan — there is no twelve-month cut-off.',
  },
  {
    q: 'When do payouts land?',
    a: 'Monthly, in the first week, once your balance is at least $20. Below that it rolls into the next month rather than disappearing.',
  },
  {
    q: 'Can I refer myself or my own pages?',
    a: 'No. Self-referrals and pages owned by the same account are filtered out before payout, and repeated attempts close the account from the programme.',
  },
]

export default function Earn() {
  usePageTitle('Earn · Leenkr')

  return (
    <MarketingLayout>
      <div className="mk-page">
        <PageHero
          kicker="Earn"
          title={
            <>
              Earn up to <span className="mk-hl">5%</span> for
              <br />
              every referral that sticks.
            </>
          }
          lede="Know creators who sell what they make? Send them to Leenkr. When they subscribe to a paid plan, you earn a cut of every payment they make — for as long as they stay."
        >
          <a className="btn" href="mailto:affiliates@leenkr.com?subject=Leenkr%20affiliate%20programme">
            <BadgePercent size={16} />
            Apply to the programme
          </a>
        </PageHero>

        <PageSection kicker="How it works" title="Three steps, no dashboard to babysit">
          <div className="mk-steps">
            {STEPS.map((step) => {
              const Icon = step.icon
              return (
                <article className="mk-step" key={step.number}>
                  <span className="mk-step-num">{step.number}</span>
                  <span className="mk-card-icon">
                    <Icon size={17} />
                  </span>
                  <h3>{step.title}</h3>
                  <p className="mk-copy">{step.copy}</p>
                </article>
              )
            })}
          </div>
        </PageSection>

        <PageSection kicker="The numbers" title="What a referral pays">
          <div className="mk-grid mk-grid-2">
            <article className="mk-card">
              <h3>5% on Creator</h3>
              <p className="mk-copy">
                A creator on Creator at $24/month pays you $1.20 every month they stay subscribed.
              </p>
            </article>
            <article className="mk-card">
              <h3>4% on Pro</h3>
              <p className="mk-copy">
                A creator on Pro at $9/month pays you $0.36 every month. Small per referral, and it compounds
                with volume.
              </p>
            </article>
            <article className="mk-card">
              <h3>No cap on referrals</h3>
              <p className="mk-copy">
                Refer two creators or two hundred. Commission is calculated per referred account, per payment.
              </p>
            </article>
            <article className="mk-card">
              <h3>Paid monthly</h3>
              <p className="mk-copy">
                Bank transfer or PayPal, first week of the month, minimum $20 balance. Statements are itemised
                per referral.
              </p>
            </article>
          </div>
        </PageSection>

        <PageSection kicker="Questions" title="Before you apply">
          <div className="mk-faq">
            {FAQ.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <p className="mk-note">
            Applications are reviewed within two working days. Write to{' '}
            <a className="mk-card-link" href="mailto:affiliates@leenkr.com">
              affiliates@leenkr.com
            </a>{' '}
            with the handle you promote from.
          </p>
        </PageSection>
      </div>

      <CloseBand />
    </MarketingLayout>
  )
}
