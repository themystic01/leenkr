import { useEffect, useState } from 'react'

// Chromium fires this before the native install prompt; TypeScript's DOM lib
// has no type for it yet.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallPlatform = 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'other'

function platformOf(): InstallPlatform {
  const ua = navigator.userAgent
  // iPadOS reports itself as a Mac, distinguishable by the touch points.
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  if (/iPad|iPhone|iPod/i.test(ua) || iPadOs) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macos'
  if (/Windows/i.test(ua)) return 'windows'
  if (/Linux/i.test(ua)) return 'linux'
  return 'other'
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

// Safari on iOS has no install event, so those visitors get told where to tap.
export function installSteps(platform: InstallPlatform): { title: string; steps: string[] } {
  switch (platform) {
    case 'ios':
      return {
        title: 'Add Leenkr to your Home Screen',
        steps: [
          'Open this page in Safari — other browsers on iOS cannot install apps.',
          'Tap the Share button in the toolbar.',
          'Scroll the sheet and choose “Add to Home Screen”.',
          'Tap “Add”. Leenkr then opens full screen from your Home Screen.',
        ],
      }
    case 'android':
      return {
        title: 'Install Leenkr on your phone',
        steps: [
          'Open the browser menu.',
          'Tap “Install app” or “Add to Home screen”.',
          'Confirm, and Leenkr gets its own icon on your Home Screen.',
        ],
      }
    case 'macos':
      return {
        title: 'Add Leenkr to your Dock',
        steps: [
          'In Safari, choose File → Add to Dock.',
          'In Chrome or Edge, click the install icon at the right of the address bar.',
          'Confirm — Leenkr then opens in its own window.',
        ],
      }
    default:
      return {
        title: 'Install Leenkr on this computer',
        steps: [
          'In Chrome or Edge, click the install icon at the right of the address bar.',
          'Or open the browser menu and choose “Install Leenkr”.',
          'Confirm — Leenkr then opens in its own window.',
        ],
      }
  }
}

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandalone())
  const [platform] = useState<InstallPlatform>(() => platformOf())

  useEffect(() => {
    const onPrompt = (event: Event) => {
      // Without this the browser shows its own mini-infobar instead of our button.
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
    }
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const onDisplayMode = (event: MediaQueryListEvent) => setInstalled(event.matches)

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    displayMode.addEventListener('change', onDisplayMode)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      displayMode.removeEventListener('change', onDisplayMode)
    }
  }, [])

  const promptInstall = async () => {
    if (!promptEvent) return 'unavailable' as const
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    // A prompt can only be used once.
    setPromptEvent(null)
    if (choice.outcome === 'accepted') setInstalled(true)
    return choice.outcome
  }

  return { installed, canPrompt: promptEvent !== null, platform, promptInstall }
}
