import { useEffect, useRef } from 'react'
import { Download, X } from 'lucide-react'
import { installSteps, type InstallPlatform } from '../lib/install'

// Browsers without an install event get told where to tap instead.
export default function InstallHelp({
  open,
  platform,
  onClose,
}: {
  open: boolean
  platform: InstallPlatform
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const steps = installSteps(platform)

  return (
    <div
      className="dialog-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="install-dialog-title">
        <header className="dialog-head">
          <span className="dialog-mark">
            <Download size={18} />
          </span>
          <div>
            <h2 id="install-dialog-title">{steps.title}</h2>
            <p className="dialog-sub">
              Runs in its own window, with an offline shell and its own icon on your device.
            </p>
          </div>
          <button type="button" className="icon-btn" ref={closeRef} onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </header>

        <div className="dialog-body">
          <ol className="install-steps">
            {steps.steps.map((step, index) => (
              <li key={step}>
                <span className="install-step-num">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <footer className="dialog-foot">
          <button type="button" className="btn ghost" onClick={onClose}>
            Got it
          </button>
        </footer>
      </div>
    </div>
  )
}
