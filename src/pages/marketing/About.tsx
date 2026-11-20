import { CircleCheck, Hand, Tag } from 'lucide-react'
import { CloseBand, MarketingLayout, PageHero, PageSection } from '../../components/marketing/SiteChrome'
import { usePageTitle } from '../../lib/title'

const PRINCIPLES = [
  {
    icon: Tag,
    title: 'Prices in the open',
    copy: 'Every product carries its price on the page. Nobody should have to tap through to find out what something costs, and you should not have to answer that question in a DM for the fifth time.',
  },
  {
    icon: Hand,
    title: 'The work comes first',
    copy: 'A link page that is only links asks your audience to leave. Leenkr keeps the products, the writing and the way to reach you on the page, so the first visit can turn into a sale.',
  },
  {
    icon: CircleCheck,
    title: 'Your handle is yours',
    copy: 'One person, one page, one address you can put on a business card. No sub-brand, no upsell to a different domain, no lock-in on the things you made.',
  },
]

export default function About() {
  usePageTitle('About · Leenkr')

  return (
    <MarketingLayout>
      <div className="mk-page">
        <PageHero
          kicker="About"
          title={
            <>
              Leenkr exists because a link page
              <br />
              should <span className="mk-hl">sell</span>.
            </>
          }
          lede="We built the page we kept looking for: a single link that holds the products, the writing, the videos and the inbox — priced, sorted and readable — without sending anyone to a second app."
        />

        <PageSection kicker="Where it started" title="Four tabs and a comment thread">
          <div className="mk-prose">
            <p>
              Every creator we spoke to had the same four tabs open: a link page, a storefront, an inbox and the
              platform where the audience actually lives. The link page sent people to the storefront, the
              storefront sent them to a checkout, and the questions came back through comments because there was
              nowhere else for them to land.
            </p>
            <p>
              Leenkr collapses that into one page. Products get an image, a price and a button. Links keep their
              own shelf so they do not push the shop off the screen. Email, bookings, newsletter and collab
              requests sit next to the work instead of three clicks away.
            </p>
            <p>
              It is a small product on purpose. One page per person, a studio to edit it in, and a public page
              fast enough to open on a bad connection.
            </p>
          </div>
        </PageSection>

        <PageSection kicker="What we believe" title="Three rules we build by">
          <div className="mk-grid">
            {PRINCIPLES.map((item) => {
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

        <PageSection kicker="Who builds it" title="A small team, shipping weekly">
          <div className="mk-grid">
            <article className="mk-card">
              <h3>The studio</h3>
              <p className="mk-copy">
                Designers and builders. We made the page you are reading, the studio behind it and the themes
                that come with it.
              </p>
              <a className="mk-card-link" href="mailto:hey@leenkr.app">
                hey@leenkr.app
              </a>
            </article>
            <article className="mk-card">
              <h3>Work with us</h3>
              <p className="mk-copy">
                We hire slowly and in the open. If you want to build this with us, tell us what you do.
              </p>
              <a className="mk-card-link" href="mailto:hey@leenkr.app?subject=Working%20with%20Leenkr">
                Write to us
              </a>
            </article>
          </div>
        </PageSection>
      </div>

      <CloseBand />
    </MarketingLayout>
  )
}
