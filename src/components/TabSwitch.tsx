import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Package, Link2, Send } from 'lucide-react'

export type ContentTab = 'products' | 'links' | 'connect'

type Props = {
  value: ContentTab
  onChange: (tab: ContentTab) => void
  label?: string
}

const ORDER: ContentTab[] = ['products', 'links', 'connect']

// One id stem shared by the tab list and the panel it controls.
export const SECTION_ID = 'page-section'

const ICONS = {
  products: Package,
  links: Link2,
  connect: Send,
} as const

const LABELS: Record<ContentTab, string> = {
  products: 'Products',
  links: 'Links',
  connect: 'Connect',
}

export function ContentPanel({ tab, children }: { tab: ContentTab; children: ReactNode }) {
  return (
    <div
      className="panel"
      role="tabpanel"
      id={`${SECTION_ID}-panel-${tab}`}
      aria-labelledby={`${SECTION_ID}-tab-${tab}`}
      tabIndex={0}
      key={tab}
    >
      {children}
    </div>
  )
}

export default function TabSwitch({ value, onChange, label = 'Page sections' }: Props) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  const [announcement, setAnnouncement] = useState('')

  const select = (next: ContentTab, moveFocus = true) => {
    setAnnouncement(`${LABELS[next]} section`)
    if (moveFocus) buttons.current[ORDER.indexOf(next)]?.focus()
    if (next !== value) onChange(next)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = ORDER.length - 1
    let nextIndex: number

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = index === last ? 0 : index + 1
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = index === 0 ? last : index - 1
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = last
        break
      default:
        return
    }

    event.preventDefault()
    select(ORDER[nextIndex])
  }

  return (
    <div className="switch" role="tablist" aria-label={label}>
      {ORDER.map((key, index) => {
        const Icon = ICONS[key]
        const selected = value === key
        return (
          <button
            key={key}
            ref={(node) => {
              buttons.current[index] = node
            }}
            role="tab"
            type="button"
            id={`${SECTION_ID}-tab-${key}`}
            aria-selected={selected}
            aria-controls={`${SECTION_ID}-panel-${key}`}
            tabIndex={selected ? 0 : -1}
            className="switch-item"
            onClick={() => select(key, false)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <Icon size={15} strokeWidth={1.9} />
            <span>{LABELS[key]}</span>
          </button>
        )
      })}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </div>
  )
}
