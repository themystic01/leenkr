import { ArrowUpRight, MapPin } from 'lucide-react'
import { CloseBand, MarketingLayout, PageHero, PageSection } from '../../components/marketing/SiteChrome'
import { usePageTitle } from '../../lib/title'

const ROLES = [
  {
    title: 'Product designer',
    team: 'Design',
    type: 'Contract · Remote',
    copy: 'Own the studio and the public page end to end: flows, themes, the empty states nobody remembers to design.',
  },
  {
    title: 'Frontend engineer',
    team: 'Engineering',
    type: 'Full-time · Remote',
    copy: 'React, TypeScript and a design system that is written by hand. You will care about how fast the public page opens on a 3G phone.',
  },
  {
    title: 'Creator support lead',
    team: 'Support',
    type: 'Full-time · Remote (EU / Africa hours)',
    copy: 'Answer the people using the product, then turn the patterns into fixes. Half support, half product feedback loop.',
  },
  {
    title: 'Writer, VibeUniversity',
    team: 'Content',
    type: 'Part-time · Remote',
    copy: 'Tutorials, release notes and the blog. You can explain a pricing change without a marketing deck.',
  },
]

const VALUES = [
  {
    title: 'Ship weekly',
    copy: 'Small releases, every week, in public changelog form. Nothing sits in a branch for a quarter.',
  },
  {
    title: 'Write it down',
    copy: 'Decisions live in docs, not in a call. The next person should be able to pick the work up on Monday.',
  },
  {
    title: 'Read the support inbox',
    copy: 'Everyone does, founders included. The fastest way to know what to build next is what people ask for twice.',
  },
]

export default function Career() {
  usePageTitle('Career · Leenkr')

  return (
    <MarketingLayout>
      <div className="mk-page">
        <PageHero
          kicker="Career"
          title={
            <>
              Build the page
              <br />
              that <span className="mk-hl">sells the thing</span>.
            </>
          }
          lede="Leenkr is a small, remote team making one product properly. Four roles are open right now — all of them remote, all of them with the work described in the listing."
        />

        <PageSection kicker="Open positions" title="Four roles, no mystery boxes">
          <div className="mk-roles">
            {ROLES.map((role) => (
              <article className="mk-role" key={role.title}>
                <div className="mk-role-main">
                  <h3>{role.title}</h3>
                  <p className="mk-copy">{role.copy}</p>
                </div>
                <div className="mk-role-side">
                  <span className="mk-role-meta">
                    <MapPin size={12} />
                    {role.type}
                  </span>
                  <span className="mk-role-tag">{role.team}</span>
                  <a
                    className="btn ghost sm"
                    href={`mailto:careers@leenkr.com?subject=${encodeURIComponent(role.title)}`}
                  >
                    Apply
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </PageSection>

        <PageSection kicker="How we work" title="Three things that are not negotiable">
          <div className="mk-grid">
            {VALUES.map((item) => (
              <article className="mk-card" key={item.title}>
                <h3>{item.title}</h3>
                <p className="mk-copy">{item.copy}</p>
              </article>
            ))}
          </div>
          <p className="mk-note">
            Applications go to{' '}
            <a className="mk-card-link" href="mailto:careers@leenkr.com">
              careers@leenkr.com
            </a>
            . Send the work you are proudest of and one line on why this product. No take-home longer than an
            hour.
          </p>
        </PageSection>
      </div>

      <CloseBand />
    </MarketingLayout>
  )
}
