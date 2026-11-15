import { GraduationCap, Newspaper, Sparkles } from 'lucide-react'
import { CloseBand, MarketingLayout, PageHero, PageSection } from '../../components/marketing/SiteChrome'
import { usePageTitle } from '../../lib/title'

const TUTORIALS = [
  {
    category: 'Tutorial',
    title: 'Set up a page people can buy from',
    summary: 'The 10-minute version: handle, bio, three products, one link each.',
    steps: [
      'Pick the handle you want on the page — it becomes leenkr.com/yourname.',
      'Add products with a price and the URL where checkout already lives.',
      'Publish, then send the link to one person and watch where they tap.',
    ],
  },
  {
    category: 'Tutorial',
    title: 'Make product cards convert',
    summary: 'What to put in the image, the title and the one line under it.',
    steps: [
      'Use a square image with the product filling the frame.',
      'Name the artefact, not the category — "Type Pairings Vol. 1", not "ebook".',
      'Price it on the card. Hidden prices cost you taps.',
    ],
  },
  {
    category: 'Tutorial',
    title: 'An accent that matches your work',
    summary: 'Choosing a theme and accent without turning the page into a mood board.',
    steps: [
      'Start from the work: pull one colour out of your own images.',
      'Keep motion on lively only for a launch; steady reads better for a catalogue.',
      'Check the page in dark mode before you publish — most visitors open it at night.',
    ],
  },
]

const UPDATES = [
  {
    title: 'One plan at a time on phones, all three on desktop',
    copy: 'The pricing section now shows the full comparison on wide screens and a Free / Pro / Creator switch below 1024px, so pricing stays readable on a phone.',
  },
  {
    title: 'An installable public page',
    copy: 'Your page can be added to a home screen. It opens full screen, keeps the last visit cached, and still loads if the connection drops.',
  },
  {
    title: 'A sidebar that gets out of the way',
    copy: 'The studio rail collapses on its own under 1100px and remembers what you chose. The close button no longer sits behind an empty block.',
  },
]

const BLOG = [
  {
    category: 'From the blog',
    title: 'Why a link page loses the sale',
    copy: 'The three taps between "I like this" and "I bought it" — and which of them a page can remove.',
  },
  {
    category: 'From the blog',
    title: 'Pricing a digital product you made in a weekend',
    copy: 'A short guide to pricing the thing you would happily give away, without giving it away.',
  },
]

export default function VibeUniversity() {
  usePageTitle('VibeUniversity · Leenkr')

  return (
    <MarketingLayout>
      <div className="mk-page">
        <PageHero
          kicker="VibeUniversity"
          title={
            <>
              Updates, tutorials
              <br />
              and the <span className="mk-hl">blog</span>.
            </>
          }
          lede="Everything the Leenkr team writes down: how to get more out of the page, what shipped this month, and the thinking behind it."
        />

        <PageSection kicker="Tutorials" title="Start here">
          <div className="mk-grid">
            {TUTORIALS.map((item) => (
              <article className="mk-card" key={item.title}>
                <span className="mk-card-tag">
                  <GraduationCap size={13} />
                  {item.category}
                </span>
                <h3>{item.title}</h3>
                <p className="mk-copy">{item.summary}</p>
                <ol className="mk-steps-list">
                  {item.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </PageSection>

        <PageSection kicker="Updates" title="What shipped">
          <div className="mk-posts">
            {UPDATES.map((item) => (
              <article className="mk-post" key={item.title}>
                <span className="mk-card-tag">
                  <Sparkles size={13} />
                  Release
                </span>
                <h3>{item.title}</h3>
                <p className="mk-copy">{item.copy}</p>
              </article>
            ))}
          </div>
        </PageSection>

        <PageSection kicker="The blog" title="Reading for the week">
          <div className="mk-posts">
            {BLOG.map((item) => (
              <article className="mk-post" key={item.title}>
                <span className="mk-card-tag">
                  <Newspaper size={13} />
                  {item.category}
                </span>
                <h3>{item.title}</h3>
                <p className="mk-copy">{item.copy}</p>
              </article>
            ))}
          </div>
          <p className="mk-note">
            Long-form posts open up as the team writes them. Want one covered? Email{' '}
            <a className="mk-card-link" href="mailto:hey@leenkr.com">
              hey@leenkr.com
            </a>
            .
          </p>
        </PageSection>
      </div>

      <CloseBand />
    </MarketingLayout>
  )
}
