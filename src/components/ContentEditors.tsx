import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { CONNECT_KINDS, hostOf, type ConnectItem, type ConnectKind, type LinkItem } from '../store'

export function LinksEditor({
  items,
  onAdd,
  onRemove,
}: {
  items: LinkItem[]
  onAdd: (item: Omit<LinkItem, 'id'>) => void
  onRemove: (id: string) => void
}) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), url: url.trim() || 'https://example.com' })
    setTitle('')
    setUrl('')
  }

  return (
    <>
      <ul className="item-list">
        {items.map((item) => (
          <li className="item-row" key={item.id}>
            <span className="item-main">
              <span className="item-title">{item.title}</span>
              <span className="item-sub">{hostOf(item.url)}</span>
            </span>
            <button type="button" className="trash" onClick={() => onRemove(item.id)} aria-label="Remove link">
              <Trash2 size={15} />
            </button>
          </li>
        ))}
        {items.length === 0 ? <li className="empty-panel">No links yet. Add one below.</li> : null}
      </ul>

      <form className="add-form" onSubmit={submit}>
        <input
          className="input"
          placeholder="Link title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="input"
          placeholder="https://"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="btn ghost sm" type="submit">
          <Plus size={15} />
          Add link
        </button>
      </form>
    </>
  )
}

export function ConnectEditor({
  items,
  onAdd,
  onRemove,
}: {
  items: ConnectItem[]
  onAdd: (item: Omit<ConnectItem, 'id'>) => void
  onRemove: (id: string) => void
}) {
  const [kind, setKind] = useState<ConnectKind>('email')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!label.trim()) return
    onAdd({ kind, label: label.trim(), value: value.trim() })
    setLabel('')
    setValue('')
  }

  return (
    <>
      <ul className="item-list">
        {items.map((item) => (
          <li className="item-row" key={item.id}>
            <span className="item-main">
              <span className="item-title">{item.label}</span>
              <span className="item-sub">
                {CONNECT_KINDS.find((k) => k.key === item.kind)?.label} · {item.value}
              </span>
            </span>
            <button type="button" className="trash" onClick={() => onRemove(item.id)} aria-label="Remove contact">
              <Trash2 size={15} />
            </button>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="empty-panel">No ways to connect yet. Email or a booking link works well.</li>
        ) : null}
      </ul>

      <form className="add-form" onSubmit={submit}>
        <div className="add-grid">
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value as ConnectKind)}>
            {CONNECT_KINDS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Label, e.g. Book a call"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <input
          className="input"
          placeholder="Email address or URL"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="btn ghost sm" type="submit">
          <Plus size={15} />
          Add contact
        </button>
      </form>
    </>
  )
}
