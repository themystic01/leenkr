import { useState } from 'react'
import { Download, X } from 'lucide-react'
import InstallHelp from './InstallHelp'
import { useInstallPrompt } from '../lib/install'

const DISMISS_KEY = 'leenkr.install-banner.v1'

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'dismissed'
  } catch {
    return false
  }
}

export default function InstallBanner() {
  const { installed, canPrompt, platform, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(wasDismissed)
  const [helpOpen, setHelpOpen] = useState(false)

  if (installed || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, 'dismissed')
    } catch {
      // Storage blocked — the banner stays hidden for this visit.
    }
  }

  const install = async () => {
    if (!canPrompt) {
      setHelpOpen(true)
      return
    }
    const outcome = await promptInstall()
    if (outcome === 'unavailable') setHelpOpen(true)
  }

  return (
    <aside className="install-banner" aria-label="Install Leenkr">
      <span className="install-banner-mark">
        <Download size={16} />
      </span>

      <div className="install-banner-text">
        <p className="install-banner-title">Install Leenkr</p>
        <p className="install-banner-sub">Keep this page one tap away, even offline.</p>
      </div>

      <button type="button" className="btn sm install-banner-btn" onClick={install}>
        Install
      </button>

      <button
        type="button"
        className="icon-btn install-banner-close"
        onClick={dismiss}
        aria-label="Dismiss install banner"
      >
        <X size={15} />
      </button>

      <InstallHelp open={helpOpen} platform={platform} onClose={() => setHelpOpen(false)} />
    </aside>
  )
}
