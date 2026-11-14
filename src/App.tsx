import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowUpRight,
  BarChart3,
  LayoutDashboard,
  Link2,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Settings,
  ShieldCheck,
  User,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import Overview from './pages/Overview'
import ProfileEditor from './pages/ProfileEditor'
import PublicProfile from './pages/PublicProfile'
import Products from './pages/Products'
import Links from './pages/Links'
import Connect from './pages/Connect'
import Tools from './pages/Tools'
import Verify from './pages/Verify'
import SettingsPage from './pages/Settings'
import { useProfile } from './store'

type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  badge?: number
}

const SIDEBAR_KEY = 'leenkr.sidebar.v1'
// Below this width the 272px sidebar eats too much of the canvas, so it starts
// folded down to the icon rail. The user can still open it by hand.
const NARROW_QUERY = '(max-width: 1099px)'

function savedSidebarPreference() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'collapsed'
  } catch {
    return false
  }
}

function isNarrowWindow() {
  return typeof window !== 'undefined' && window.matchMedia(NARROW_QUERY).matches
}

function Sidebar({
  onNavigate,
  collapsed,
  onToggleCollapse,
}: {
  onNavigate?: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { profile } = useProfile()
  const location = useLocation()

  const primary: NavItem[] = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    { label: 'Profile', to: '/profile', icon: User },
    { label: 'Products', to: '/products', icon: Package, badge: profile.products.length },
    { label: 'Links', to: '/links', icon: Link2, badge: profile.links.length },
    { label: 'Connect', to: '/connect', icon: Send, badge: profile.connects.length },
    { label: 'Tools', to: '/tools', icon: Wrench },
    { label: 'Verify', to: '/verify', icon: ShieldCheck },
  ]

  const secondary: NavItem[] = [{ label: 'Settings', to: '/settings', icon: Settings }]

  const renderItem = (item: NavItem) => {
    const active = location.pathname === item.to
    const Icon = item.icon
    return (
      <Link
        key={item.label}
        to={item.to}
        onClick={onNavigate}
        className={active ? 'nav-item active' : 'nav-item'}
        aria-current={active ? 'page' : undefined}
        aria-label={item.label}
        title={collapsed ? item.label : undefined}
      >
        <Icon size={19} strokeWidth={1.7} />
        <span className="nav-label">{item.label}</span>
        {typeof item.badge === 'number' && item.badge > 0 ? (
          <span className="badge">{item.badge}</span>
        ) : null}
      </Link>
    )
  }

  return (
    <aside className="sidebar">
      <Link to="/" className="brand" onClick={onNavigate} title={collapsed ? 'Leenkr' : undefined}>
        <span className="brand-mark">L</span>
        <span className="brand-text">
          <span className="brand-name">Leenkr</span>
          <span className="brand-sub">Creator Studio</span>
        </span>
      </Link>

      <nav className="nav" id="studio-nav" aria-label="Dashboard">
        {primary.map(renderItem)}
        <div className="sidebar-divider" />
        {secondary.map(renderItem)}
      </nav>

      <div className="sidebar-foot">
        <button
          type="button"
          className="collapse-btn"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-controls="studio-nav"
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
          title={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          <span className="collapse-label">Collapse menu</span>
        </button>
        <div className="status-card">
          <span className={profile.published ? 'dot live' : 'dot'} />
          <div className="status-text">
            <p className="status-title">{profile.published ? 'Page is live' : 'Still a draft'}</p>
            <p className="status-sub">leenkr.com/{profile.username}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Shell() {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => (isNarrowWindow() ? true : savedSidebarPreference()))
  const { profile } = useProfile()
  const publicPath = `/${profile.username}`

  useEffect(() => {
    const query = window.matchMedia(NARROW_QUERY)
    const onChange = (event: MediaQueryListEvent) => {
      // Entering the narrow range folds the rail; widening restores the choice.
      setCollapsed(event.matches ? true : savedSidebarPreference())
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(SIDEBAR_KEY, next ? 'collapsed' : 'open')
    } catch {
      // Storage blocked — the choice still holds for this session.
    }
  }

  const viewPage = (
    <Link className="btn ghost sm" to={publicPath}>
      View page
      <ArrowUpRight size={15} />
    </Link>
  )

  return (
    <div className={collapsed ? 'shell collapsed' : 'shell'}>
      <div className="mobile-bar">
        <Link to="/" className="brand compact">
          <span className="brand-mark">L</span>
          <span className="brand-name">Leenkr</span>
        </Link>
        <div className="mobile-actions">
          {viewPage}
          <button className="icon-btn dark" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </div>

      <div className={open ? 'sidebar-wrap open' : 'sidebar-wrap'}>
        <button className="icon-btn close-btn" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={18} />
        </button>
        <Sidebar
          onNavigate={() => setOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </div>

      {open ? <div className="scrim" onClick={() => setOpen(false)} /> : null}

      <main className="main">
        <div className="topbar">{viewPage}</div>

        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/profile" element={<ProfileEditor />} />
          <Route path="/products" element={<Products />} />
          <Route path="/links" element={<Links />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/analytics" element={<Stub title="Analytics" />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="*"
            element={
              <div className="page">
                <h1 className="page-title">Nothing here</h1>
                <p className="page-sub">That page doesn’t exist. Head back to your overview.</p>
                <Link className="btn" to="/">
                  Back to overview
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

const STUB_COPY: Record<string, string> = {
  Analytics: 'Profile views, link clicks and product taps will land here. Your page needs a week of traffic before the numbers mean anything.',
}

function Stub({ title }: { title: string }) {
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-sub">Not built yet — this round covers your dashboard, page setup and the live page.</p>
        </div>
      </header>
      <div className="card empty-card">
        <span className="empty-mark">L</span>
        <p>{STUB_COPY[title]}</p>
        <Link className="btn ghost" to="/profile">
          Work on your page
        </Link>
      </div>
    </div>
  )
}

// One-segment paths are public profile handles, except the studio's own routes.
const STUDIO_ROUTES = new Set([
  'profile',
  'analytics',
  'tools',
  'verify',
  'settings',
  'products',
  'links',
  'connect',
])

export default function App() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  // Older /p/handle links keep working.
  if (segments[0] === 'p' && segments.length > 1) {
    return <Navigate to={`/${segments.slice(1).join('/')}`} replace />
  }

  const isPublicPage = segments.length === 1 && !STUDIO_ROUTES.has(segments[0])

  if (isPublicPage) {
    return (
      <Routes>
        <Route path="/:username" element={<PublicProfile />} />
      </Routes>
    )
  }

  return <Shell />
}
