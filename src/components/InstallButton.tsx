import { useState } from 'react'
import { Download } from 'lucide-react'
import InstallHelp from './InstallHelp'
import { useInstallPrompt } from '../lib/install'

export default function InstallButton({ collapsed }: { collapsed: boolean }) {
  const { installed, canPrompt, platform, promptInstall } = useInstallPrompt()
  const [open, setOpen] = useState(false)

  // Already running from the home screen or dock — nothing to offer.
  if (installed) return null

  const start = async () => {
    if (!canPrompt) {
      setOpen(true)
      return
    }
    const outcome = await promptInstall()
    if (outcome === 'unavailable') setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        className="install-btn"
        onClick={start}
        aria-label="Install Leenkr"
        title={collapsed ? 'Install Leenkr' : undefined}
      >
        <Download size={16} />
        <span className="install-label">Install app</span>
      </button>

      <InstallHelp open={open} platform={platform} onClose={() => setOpen(false)} />
    </>
  )
}
