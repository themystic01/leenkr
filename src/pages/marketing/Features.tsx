import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  ChartLine,
  CreditCard,
  Globe,
  Inbox,
  LayoutTemplate,
  Link2,
  Smartphone,
} from 'lucide-react'
import { CloseBand, MarketingLayout, PageHero, PageSection } from '../../components/marketing/SiteChrome'
import { usePageTitle } from '../../lib/title'

const FEATURES = [
  {
    icon: CreditCard,
    title: 'Product cards that sell',
    copy: 'Image, name, price and a button that goes wherever you already check out. Three products on Free, unlimited on Pro.',
  },
  {
    icon: Link2,
    title: 'A shelf for everything else',
    copy: 'Writing, videos, press and socials live in their own tab, so the shop stays the first thing a visitor sees.',
  },
  {
    icon: Inbox,
    title: 'An inbox on the page',
    copy: 'Email, bookings, newsletter and collab requests sit next to the work. Interest turns into a conversation instead of a comment.',
  },
  {
    icon: LayoutTemplate,
    title: 'Themes you can feel',
    copy: 'Light or dark, five accents, three motion settings. The page still looks like Leenkr the way you chose it, not a template.',
  },
  {
    icon: Globe,
    title: 'Your own domain',
    copy: 'Keep leenkr.com/yourname or point a domain you already own at the page. Either way the address is yours.',
  },
  {
    icon: ChartLine,
    title: 'Click tracking',
    copy: 'See which products and links people actually tap, not just how many arrived. Numbers per item, not one vanity total.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified badge',
    copy: 'Send the page for review and get a badge that tells visitors this is the real account and the real prices.',
  },
  {
    icon: Smartphone,
    title: 'Installs like an app',
    copy: 'Your public page is installable, so regulars can keep the shop one tap from their home screen.',
  },
]

export default function Features() {
  usePageTitle('Features · Leenkr')

  return (
    <MarketingLayout>
      <div className="mk-page">
        <PageHero
          kicker="Features"
          title={
            <>
              Everything the page does,
              <br />
              without a second app.
            </>
          }
          lede="Two tabs, not four: what you sell, and what you write. Everything below ships in the studio today — no waiting list, no add-on pricing."
        />

        <PageSection kicker="On the public page" title="What a visitor gets">
          <div className="mk-grid">
            {FEATURES.map((item) => {
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

        <PageSection kicker="In the studio" title="What you get to edit">
          <div className="mk-grid mk-grid-2">
            <article className="mk-card">
              <h3>Live editing</h3>
              <p className="mk-copy">
                Change a price, reorder products, swap the accent — the public page updates on the next load,
                and you can open it in one click from the sidebar.
              </p>
            </article>
            <article className="mk-card">
              <h3>Publish when it is ready</h3>
              <p className="mk-copy">
                Keep the page unpublished while you build it. Nothing is indexed or shareable until you flip
                publish.
              </p>
            </article>
            <article className="mk-card">
              <h3>Onboarding that sets a page up</h3>
              <p className="mk-copy">
                Name, handle, one product and an accent — the first version of the page is ready before you
                open the dashboard.
              </p>
            </article>
            <article className="mk-card">
              <h3>One login, several pages</h3>
              <p className="mk-copy">
                Creator plans run up to five pages from one account, with brand presets shared between them.
              </p>
            </article>
          </div>
        </PageSection>

        <PageSection kicker="Next up" title="On the bench">
          <div className="mk-prose">
            <p>
              Lead export to CSV, brand presets and a teams workflow are in review for the Creator plan. The
              changelog lives in VibeUniversity, where each release gets a short write-up.
            </p>
            <p>
              <Link className="mk-card-link" to="/vibe-university">
                Read the updates →
              </Link>
            </p>
          </div>
        </PageSection>
      </div>

      <CloseBand />
    </MarketingLayout>
  )
}
