import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CalendarClock,
  FileSpreadsheet,
  Layers,
  LifeBuoy,
  Mail,
  Palette,
} from 'lucide-react'
import { MarketingLayout, PageHero, PageSection } from '../../components/marketing/SiteChrome'
import { usePageTitle } from '../../lib/title'

const TOOLS = [
  {
    icon: Layers,
    title: 'Up to five pages, one login',
    copy: 'A studio, a personal page and a shop page under the same account — each with its own handle, all editable from one sidebar.',
  },
  {
    icon: Palette,
    title: 'Shared brand presets',
    copy: 'Set the accent, theme and motion once and apply the same look to every page you run, without repeating the setup.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Lead export',
    copy: 'Download the email, booking and collab requests your pages collected as a CSV your CRM can open.',
  },
  {
    icon: Mail,
    title: 'An inbox that lives on the page',
    copy: 'Bring your own email address, booking link and newsletter so enquiries land where your team already works.',
  },
  {
    icon: CalendarClock,
    title: 'Priority support',
    copy: 'Business accounts jump the queue: replies inside one working day, with a named person on the thread.',
  },
  {
    icon: LifeBuoy,
    title: 'Early access',
    copy: 'New tools — campaigns, team roles, deeper reporting — open on Business first, with a direct line to the team building them.',
  },
]

const USE_CASES = [
  {
    title: 'Studios with several clients',
    copy: 'Run one page per client from the same login, with a shared preset for anything that should look like the studio.',
  },
  {
    title: 'Shops with a catalogue',
    copy: 'Point visitors at the products that are actually in stock this week, and keep the long tail on the links shelf.',
  },
  {
    title: 'Teams selling services',
    copy: 'Replace the “contact us” form with a page that shows the work, the price range and a booking link that works.',
  },
]

export default function Business() {
  usePageTitle('Leenkr for Business · Leenkr')

  return (
    <MarketingLayout>
      <div className="mk-page">
        <PageHero
          kicker="Leenkr for Business"
          title={
            <>
              Run the business
              <br />
              from <span className="mk-hl">one link</span>.
            </>
          }
          lede="Tools and integrations for the people who sell as a company rather than as a person: several pages, shared branding, exported leads and a support line that answers."
        >
          <div className="mk-cta-row">
            <a className="btn" href="mailto:business@leenkr.app?subject=Leenkr%20for%20Business">
              Talk to us
              <ArrowRight size={16} />
            </a>
            <Link className="btn ghost" to="/#pricing">
              See the Creator plan
            </Link>
          </div>
        </PageHero>

        <PageSection kicker="What is included" title="Built for more than one page">
          <div className="mk-grid">
            {TOOLS.map((item) => {
              const Icon = item.icon
              return (
                <article className="mk-card" key={item.title}>
                  <span className="mk-card-icon">
                    <Icon size={17} />
                  </span>
                  <h3>{item.title}</h3>
                  <p className="mk-copy">{item.copy}</p>
                </article>
              )
            })}
          </div>
        </PageSection>

        <PageSection kicker="Who it fits" title="Three ways teams use it">
          <div className="mk-grid">
            {USE_CASES.map((item) => (
              <article className="mk-card" key={item.title}>
                <span className="mk-card-icon">
                  <Building2 size={17} />
                </span>
                <h3>{item.title}</h3>
                <p className="mk-copy">{item.copy}</p>
              </article>
            ))}
          </div>
        </PageSection>

        <PageSection kicker="Integrations" title="Bring your own everything">
          <div className="mk-prose">
            <p>
              Business pages do not trap your data. Leads export as CSV, the connect section takes your own
              email, booking provider and newsletter URL, and product buttons point at whichever checkout you
              already run.
            </p>
            <p>
              Need something specific in your stack? Tell us what it is — integrations are chosen by how many
              accounts ask for them, not by what looks good on a logo wall.
            </p>
            <p>
              <a className="mk-card-link" href="mailto:business@leenkr.app?subject=Integration%20request">
                Request an integration →
              </a>
            </p>
          </div>
        </PageSection>
      </div>

      <section className="mk-close">
        <div className="mk-close-inner">
          <h2 className="mk-h2">Give every page the same good address</h2>
          <p className="mk-lede">
            Start on Creator, or write to us if you need more pages than that. We answer both.
          </p>
          <Link className="btn dark" to="/signup">
            Create your page — free
          </Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
