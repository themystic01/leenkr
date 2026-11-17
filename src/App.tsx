import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowUpRight,
  BarChart3,
  LayoutDashboard,
  Link2,
  LogOut,
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
import InstallButton from './components/InstallButton'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Insight from './pages/Insight'
import Overview from './pages/Overview'
import ProfileEditor from './pages/ProfileEditor'
import PublicProfile from './pages/PublicProfile'
import Products from './pages/Products'
import Links from './pages/Links'
import Connect from './pages/Connect'
import Tools from './pages/Tools'
import Verify from './pages/Verify'
import SettingsPage from './pages/Settings'
import Signup from './pages/Signup'
import { useSession } from './auth'
import { usePageTitle } from './lib/title'
import { useProfile } from './store'

type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  badge?: number
}

// The marketing page carries the animated hero and pricing components, so it
// loads on demand and leaves the studio bundle alone.
const Marketing = lazy(() => import('./pages/Marketing'))
const About = lazy(() => import('./pages/marketing/About'))
const Features = lazy(() => import('./pages/marketing/Features'))
const VibeUniversity = lazy(() => import('./pages/marketing/VibeUniversity'))
const Earn = lazy(() => import('./pages/marketing/Earn'))
const Career = lazy(() => import('./pages/marketing/Career'))
const Business = lazy(() => import('./pages/marketing/Business'))

function MarketingRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="mk-boot" aria-hidden="true" />}>{children}</Suspense>
}

const STUDIO = '/dashboard'

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
  const { signOut } = useSession()
  const location = useLocation()
  const navigate = useNavigate()

  const primary: NavItem[] = [
    { label: 'Overview', to: STUDIO, icon: LayoutDashboard },
    { label: 'Insight', to: `${STUDIO}/insight`, icon: BarChart3 },
    { label: 'Profile', to: `${STUDIO}/profile`, icon: User },
    { label: 'Products', to: `${STUDIO}/products`, icon: Package, badge: profile.products.length },
    { label: 'Links', to: `${STUDIO}/links`, icon: Link2, badge: profile.links.length },
    { label: 'Connect', to: `${STUDIO}/connect`, icon: Send, badge: profile.connects.length },
    { label: 'Tools', to: `${STUDIO}/tools`, icon: Wrench },
    { label: 'Verify', to: `${STUDIO}/verify`, icon: ShieldCheck },
  ]

  const secondary: NavItem[] = [{ label: 'Settings', to: `${STUDIO}/settings`, icon: Settings }]

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
      <Link to={STUDIO} className="brand" onClick={onNavigate} title={collapsed ? 'Leenkr' : undefined}>
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
        <InstallButton collapsed={collapsed} />
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
        <button
          type="button"
          className="signout-btn"
          onClick={() => {
            signOut()
            navigate('/login')
          }}
          aria-label="Sign out"
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut size={17} />
          <span className="signout-label">Sign out</span>
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
  usePageTitle('Creator Studio · Leenkr')
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => (isNarrowWindow() ? true : savedSidebarPreference()))
  const { profile } = useProfile()
  const { session } = useSession()
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
        <Link to={STUDIO} className="brand compact">
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
        <div className="topbar">
          <span className="topbar-plan">
            {session?.plan === 'pro' ? 'Pro plan' : session?.plan === 'creator' ? 'Creator plan' : 'Free plan'}
          </span>
          {viewPage}
        </div>

        <Outlet />
      </main>
    </div>
  )
}

function DashboardFallback() {
  return (
    <div className="page">
      <h1 className="page-title">Nothing here</h1>
      <p className="page-sub">That page doesn’t exist. Head back to your overview.</p>
      <Link className="btn" to={STUDIO}>
        Back to overview
      </Link>
    </div>
  )
}

function RequireSession({ children }: { children: ReactNode }) {
  const { session, ready } = useSession()
  // A stored Supabase session takes a beat to restore; don't bounce to /login.
  if (!ready) return <div className="mk-boot" aria-hidden="true" />
  if (!session) return <Navigate to="/login" replace />
  if (!session.onboarded) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

// Older /p/handle links keep working.
function LegacyProfileRedirect() {
  const { username } = useParams()
  return <Navigate to={`/${username ?? ''}`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <MarketingRoute>
            <Marketing />
          </MarketingRoute>
        }
      />
      <Route
        path="/about"
        element={
          <MarketingRoute>
            <About />
          </MarketingRoute>
        }
      />
      <Route
        path="/features"
        element={
          <MarketingRoute>
            <Features />
          </MarketingRoute>
        }
      />
      <Route
        path="/vibe-university"
        element={
          <MarketingRoute>
            <VibeUniversity />
          </MarketingRoute>
        }
      />
      <Route
        path="/earn"
        element={
          <MarketingRoute>
            <Earn />
          </MarketingRoute>
        }
      />
      <Route
        path="/career"
        element={
          <MarketingRoute>
            <Career />
          </MarketingRoute>
        }
      />
      <Route
        path="/business"
        element={
          <MarketingRoute>
            <Business />
          </MarketingRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route
        path={STUDIO}
        element={
          <RequireSession>
            <Shell />
          </RequireSession>
        }
      >
        <Route index element={<Overview />} />
        <Route path="profile" element={<ProfileEditor />} />
        <Route path="products" element={<Products />} />
        <Route path="links" element={<Links />} />
        <Route path="connect" element={<Connect />} />
        <Route path="tools" element={<Tools />} />
        <Route path="insight" element={<Insight />} />
        <Route path="verify" element={<Verify />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<DashboardFallback />} />
      </Route>

      <Route path="/p/:username" element={<LegacyProfileRedirect />} />
      <Route path="/:username" element={<PublicProfile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
