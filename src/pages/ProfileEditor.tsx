import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, ImagePlus, Trash2 } from 'lucide-react'
import Avatar from '../components/Avatar'
import PlatformIcon from '../components/PlatformIcon'
import { downscaleImage } from '../lib/image'
import { PLATFORMS, uid, useProfile, type PlatformKey, type Profile } from '../store'

type StepKey = 'identity' | 'bio' | 'socials'

const STEPS: { key: StepKey; label: string; note: string }[] = [
  { key: 'identity', label: 'Identity', note: 'Photo, name, handle' },
  { key: 'bio', label: 'Bio', note: 'The one paragraph' },
  { key: 'socials', label: 'Socials', note: 'Where else you live' },
]

// Studio routes take priority over a handle at the same path.
const RESERVED_HANDLES = new Set([
  'profile',
  'analytics',
  'tools',
  'verify',
  'settings',
  'products',
  'links',
  'connect',
])

export default function ProfileEditor() {
  const { profile, save } = useProfile()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [draft, setDraft] = useState<Profile>(profile)
  const [saved, setSaved] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<StepKey>(() => {
    const requested = params.get('step')
    return STEPS.some((s) => s.key === requested) ? (requested as StepKey) : 'identity'
  })

  useEffect(() => {
    const requestedStep = params.get('step')
    if (requestedStep && STEPS.some((s) => s.key === requestedStep)) setStep(requestedStep as StepKey)
  }, [params])

  const index = STEPS.findIndex((s) => s.key === step)
  const canPublish =
    draft.name.trim().length > 0 &&
    /^[a-z0-9-_]{3,24}$/.test(draft.username) &&
    !RESERVED_HANDLES.has(draft.username)

  const patch = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const saveDraft = () => {
    save(draft)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const publish = () => {
    if (!canPublish) {
      setStep('identity')
      return
    }
    save({ ...draft, published: true })
    navigate(`/${draft.username}`)
  }

  const onPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoError('')
    if (!file.type.startsWith('image/')) {
      setPhotoError('That file is not an image.')
      return
    }
    try {
      const photo = await downscaleImage(file)
      setDraft((current) => ({ ...current, photo }))
    } catch {
      setPhotoError('Could not read that image. Try another one.')
    }
  }

  const activePlatforms = draft.socials.map((social) => social.platform)
  const availablePlatforms = PLATFORMS.filter((p) => !activePlatforms.includes(p.key))

  const addSocial = (platform: PlatformKey) =>
    setDraft((current) => ({
      ...current,
      socials: [...current.socials, { id: uid('s'), platform, handle: '' }],
    }))

  const setSocialHandle = (id: string, handle: string) =>
    setDraft((current) => ({
      ...current,
      socials: current.socials.map((social) => (social.id === id ? { ...social, handle } : social)),
    }))

  const removeSocial = (id: string) =>
    setDraft((current) => ({ ...current, socials: current.socials.filter((s) => s.id !== id) }))

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Public page</p>
          <h1 className="page-title">Build your page</h1>
          <p className="page-sub">
            Photo, bio and socials. Products, links and connect each have their own tab in the sidebar.
          </p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn dark" onClick={saveDraft}>
            {draft.published ? 'Save changes' : 'Save draft'}
          </button>
        </div>
      </header>

      <div className="editor-grid">
        <ol className="steps" aria-label="Page setup steps">
          {STEPS.map((item, i) => {
            const state = item.key === step ? 'active' : i < index ? 'done' : ''
            return (
              <li key={item.key}>
                <button type="button" className={`step-btn ${state}`} onClick={() => setStep(item.key)}>
                  <span className="step-num">{i < index ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
                  <span>
                    <span className="step-label">{item.label}</span>
                    <span className="step-note">{item.note}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <form className="card editor-card" onSubmit={(e) => e.preventDefault()}>
          {step === 'identity' ? (
            <div className="panel">
              <h2 className="card-title">Who’s behind the page</h2>
              <p className="card-note block-note">A clear photo and a short handle do most of the work.</p>

              <div className="photo-row">
                <Avatar name={draft.name} photo={draft.photo} size={78} />
                <div className="photo-actions">
                  <button type="button" className="btn ghost sm" onClick={() => fileRef.current?.click()}>
                    <ImagePlus size={15} />
                    {draft.photo ? 'Replace photo' : 'Upload photo'}
                  </button>
                  {draft.photo ? (
                    <button type="button" className="btn ghost sm" onClick={() => patch('photo', null)}>
                      Remove
                    </button>
                  ) : null}
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
                </div>
              </div>
              {photoError ? <p className="field-error">{photoError}</p> : null}

              <div className="field">
                <label htmlFor="display-name">Display name</label>
                <input
                  id="display-name"
                  className="input"
                  value={draft.name}
                  placeholder="Your name or studio"
                  onChange={(e) => patch('name', e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="username">Page handle</label>
                <div className="field-row">
                  <span className="prefix">leenkr.com/</span>
                  <input
                    id="username"
                    className="input"
                    value={draft.username}
                    placeholder="yourname"
                    onChange={(e) =>
                      patch('username', e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(0, 24))
                    }
                  />
                </div>
                <span className="hint">
                  {canPublish
                    ? 'Lowercase letters, numbers, dashes. This is your URL, straight after leenkr.com.'
                    : 'Use 3–24 lowercase characters, and avoid studio words like profile or settings.'}
                </span>
              </div>
            </div>
          ) : null}

          {step === 'bio' ? (
            <div className="panel">
              <h2 className="card-title">Say it once, say it well</h2>
              <p className="card-note block-note">
                Two sentences beat a list of adjectives. What you build, who it’s for.
              </p>
              <div className="field">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  className="input"
                  maxLength={240}
                  value={draft.bio}
                  placeholder="Independent designer building calm tools for loud ideas…"
                  onChange={(e) => patch('bio', e.target.value)}
                />
                <span className="counter">{draft.bio.length}/240</span>
              </div>
            </div>
          ) : null}

          {step === 'socials' ? (
            <div className="panel">
              <h2 className="card-title">Where else you live</h2>
              <p className="card-note block-note">Add a platform, drop your handle. The @ is optional.</p>

              <div className="social-edit">
                {draft.socials.map((social) => (
                  <div className="social-edit-row" key={social.id}>
                    <span className="platform-tag">
                      <PlatformIcon platform={social.platform} size={14} />
                      {PLATFORMS.find((p) => p.key === social.platform)?.label}
                    </span>
                    <input
                      className="input"
                      placeholder="handle"
                      value={social.handle}
                      onChange={(e) => setSocialHandle(social.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="trash"
                      onClick={() => removeSocial(social.id)}
                      aria-label="Remove platform"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {availablePlatforms.length > 0 ? (
                <div className="field add-platforms">
                  <label>Add a platform</label>
                  <div className="chip-row">
                    {availablePlatforms.map((platform) => (
                      <button
                        key={platform.key}
                        type="button"
                        className="chip"
                        onClick={() => addSocial(platform.key)}
                      >
                        <PlatformIcon platform={platform.key} size={13} />
                        {platform.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="editor-foot">
            <button
              type="button"
              className="btn ghost"
              disabled={index === 0}
              onClick={() => setStep(STEPS[Math.max(index - 1, 0)].key)}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="foot-right">
              {saved ? (
                <span className="saved-pill">
                  <Check size={13} strokeWidth={3} />
                  Saved
                </span>
              ) : null}
              {index < STEPS.length - 1 ? (
                <button
                  type="button"
                  className="btn dark"
                  onClick={() => setStep(STEPS[Math.min(index + 1, STEPS.length - 1)].key)}
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button type="button" className="btn" onClick={publish} disabled={!canPublish}>
                  {draft.published ? 'Save and view' : 'Publish page'}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
