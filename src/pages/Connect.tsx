import {
  CalendarDays,
  Mail,
  MessageSquare,
  Plus,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { uid, useProfile, type ToolEntry, type ToolKind } from '../store'

type Field = { key: string; label: string; placeholder: string }

type ToolMeta = {
  kind: ToolKind
  title: string
  copy: string
  icon: LucideIcon
  fields: Field[]
  note?: string
}

const CARDS: ToolMeta[] = [
  {
    kind: 'event',
    title: 'Event',
    copy: 'One date, one place, one link to tickets.',
    icon: CalendarDays,
    fields: [
      { key: 'name', label: 'Event name', placeholder: 'Design meetup #4' },
      { key: 'date', label: 'Date and time', placeholder: 'Fri 12 Dec, 6:00pm' },
      { key: 'location', label: 'Location', placeholder: 'Lagos, Nigeria' },
      { key: 'url', label: 'Tickets or details URL', placeholder: 'https://' },
    ],
  },
  {
    kind: 'contact',
    title: 'Contact form',
    copy: 'Let people ask you something without leaving the page.',
    icon: MessageSquare,
    fields: [
      { key: 'heading', label: 'Form heading', placeholder: 'Work with me' },
      { key: 'email', label: 'Send replies to', placeholder: 'you@example.com' },
    ],
    note: 'Messages open in the sender’s mail app.',
  },
  {
    kind: 'newsletter',
    title: 'Newsletter',
    copy: 'Point people at your list with one clear signup.',
    icon: Mail,
    fields: [
      { key: 'heading', label: 'Signup heading', placeholder: 'Weekly craft notes' },
      { key: 'url', label: 'Signup URL', placeholder: 'https://' },
    ],
  },
]

function ToolCard({
  meta,
  entry,
  onCreate,
  onChange,
  onRemove,
}: {
  meta: ToolMeta
  entry: ToolEntry | undefined
  onCreate: () => void
  onChange: (key: string, value: string) => void
  onRemove: () => void
}) {
  const Icon = meta.icon

  return (
    <section className="card tool-card">
      <div className="tool-head">
        <span className="tool-icon">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="card-title">{meta.title}</h2>
          <p className="tool-copy">{meta.copy}</p>
        </div>
      </div>

      {entry ? (
        <>
          <div className="tool-fields">
            {meta.fields.map((field) => (
              <div className="field" key={field.key}>
                <label htmlFor={`${meta.kind}-${field.key}`}>{field.label}</label>
                <input
                  id={`${meta.kind}-${field.key}`}
                  className="input"
                  placeholder={field.placeholder}
                  value={entry.values[field.key] ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              </div>
            ))}
          </div>
          {meta.note ? <p className="tool-note">{meta.note}</p> : null}
          <div className="tool-foot">
            <span className="pill live">Added</span>
            <button type="button" className="btn ghost sm" onClick={onRemove}>
              Remove
              <Trash2 size={14} />
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="empty-panel">Not set up yet.</p>
          <button type="button" className="btn sm" onClick={onCreate}>
            <Plus size={15} />
            Add {meta.title.toLowerCase()}
          </button>
        </>
      )}
    </section>
  )
}

export default function Connect() {
  const { profile, save } = useProfile()

  const setTools = (tools: ToolEntry[]) => save({ ...profile, tools })

  const create = (kind: ToolKind) =>
    setTools([...profile.tools, { id: uid('t'), kind, values: {} }])

  const update = (id: string, key: string, value: string) =>
    setTools(
      profile.tools.map((tool) =>
        tool.id === id ? { ...tool, values: { ...tool.values, [key]: value } } : tool,
      ),
    )

  const remove = (id: string) => setTools(profile.tools.filter((tool) => tool.id !== id))

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Your page · section three</p>
          <h1 className="page-title">Connect</h1>
          <p className="page-sub">
            Three blocks for your page: an event, a contact form and a newsletter signup. Each one stands on
            its own.
          </p>
        </div>
      </header>

      <div className="tools-grid">
        {CARDS.map((meta) => {
          const entry = profile.tools.find((tool) => tool.kind === meta.kind)
          return (
            <ToolCard
              key={meta.kind}
              meta={meta}
              entry={entry}
              onCreate={() => create(meta.kind)}
              onChange={(key, value) => {
                if (entry) update(entry.id, key, value)
              }}
              onRemove={() => {
                if (entry) remove(entry.id)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
