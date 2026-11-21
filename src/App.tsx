import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Banknote,
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
  Shield,
  ShieldCheck,
  User,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import InstallButton from './components/InstallButton'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Onboarding from './pages/Onboarding'
import Insight from './pages/Insight'
import Overview from './pages/Overview'
import ProfileEditor from './pages/ProfileEditor'
import PublicProfile from './pages/PublicProfile'
import ProductDetail from './pages/ProductDetail'
import EarningsPage from './pages/Earnings'
import Products from './pages/Products'
import Links from './pages/Links'
import Connect from './pages/Connect'
import Verify from './pages/Verify'
import SettingsPage from './pages/Settings'
import Signup from './pages/Signup'
import AdminOverview from './pages/admin/AdminOverview'
import AdminCreators from './pages/admin/AdminCreators'
import AdminOrders from './pages/admin/AdminOrders'
import AdminPayouts from './pages/admin/AdminPayouts'
import AdminVerifications from './pages/admin/AdminVerifications'
import { useSession } from './auth'
import { useIsAdmin } from './lib/admin'
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
const Earn = lazy(() => import('./pages/marketing/Earn'))

function MarketingRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="mk-boot" aria-hidden="true" />}>{children}</Suspense>
}

const STUDIO = '/dashboard'
const ADMIN = '/admin'

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

/**
 * The studio and the operator console share this chrome: brand, rail, mobile
 * drawer, topbar and sign-out. Only the nav items and labels differ.
 */
function AppShell({
  nav,
  secondary = [],
  home = STUDIO,
  brandSub,
  badge,
  action,
  footnote,
  install = true,
  adminLink = false,
}: {
  nav: NavItem[]
  secondary?: NavItem[]
  home?: string
  brandSub: string
  badge: ReactNode
  action?: ReactNode
  footnote?: ReactNode
  install?: boolean
  adminLink?: boolean
}) {
  const { signOut } = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() =>
    isNarrowWindow() ? true : savedSidebarPreference(),
  )

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

  const renderItem = (item: NavItem) => {
    const active = location.pathname === item.to
    const Icon = item.icon
    return (
      <Link
        key={item.label}
        to={item.to}
        onClick={() => setOpen(false)}
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
    <div className={collapsed ? 'shell collapsed' : 'shell'}>
      <div className="mobile-bar">
        <Link to={home} className="brand compact">
          <span className="brand-mark">L</span>
          <span className="brand-name">Leenkr</span>
        </Link>
        <div className="mobile-actions">
          {action}
          <button className="icon-btn dark" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </div>

      <div className={open ? 'sidebar-wrap open' : 'sidebar-wrap'}>
        <button className="icon-btn close-btn" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={18} />
        </button>
        <aside className="sidebar">
          <Link to={home} className="brand" onClick={() => setOpen(false)} title={collapsed ? 'Leenkr' : undefined}>
            <span className="brand-mark">L</span>
            <span className="brand-text">
              <span className="brand-name">Leenkr</span>
              <span className="brand-sub">{brandSub}</span>
            </span>
          </Link>

          <nav className="nav" id="studio-nav" aria-label="Dashboard">
            {nav.map(renderItem)}
            {secondary.length > 0 ? <div className="sidebar-divider" /> : null}
            {secondary.map(renderItem)}
            {adminLink ? (
              <>
                <div className="sidebar-divider" />
                {renderItem({ label: 'Admin', to: ADMIN, icon: Shield })}
              </>
            ) : null}
          </nav>

          <div className="sidebar-foot">
            {install ? <InstallButton collapsed={collapsed} /> : null}
            <button
              type="button"
              className="collapse-btn"
              onClick={toggleCollapse}
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
            {footnote}
          </div>
        </aside>
      </div>

      {open ? <div className="scrim" onClick={() => setOpen(false)} /> : null}

      <main className="main">
        <div className="topbar">
          <span className="topbar-plan">{badge}</span>
          {action}
        </div>

        <Outlet />
      </main>
    </div>
  )
}

function Shell() {
  usePageTitle('Creator Studio · Leenkr')
  const { profile } = useProfile()
  const { session } = useSession()
  const { isAdmin } = useIsAdmin()

  const primary: NavItem[] = [
    { label: 'Overview', to: STUDIO, icon: LayoutDashboard },
    { label: 'Insight', to: `${STUDIO}/insight`, icon: BarChart3 },
    { label: 'Earnings', to: `${STUDIO}/earnings`, icon: Wallet },
    { label: 'Profile', to: `${STUDIO}/profile`, icon: User },
    { label: 'Products', to: `${STUDIO}/products`, icon: Package, badge: profile.products.length },
    { label: 'Links', to: `${STUDIO}/links`, icon: Link2, badge: profile.links.length },
    { label: 'Connect', to: `${STUDIO}/connect`, icon: Send },
    { label: 'Verify', to: `${STUDIO}/verify`, icon: ShieldCheck },
  ]

  const secondary: NavItem[] = [{ label: 'Settings', to: `${STUDIO}/settings`, icon: Settings }]

  const viewPage = (
    <Link className="btn ghost sm" to={`/${profile.username}`}>
      View page
      <ArrowUpRight size={15} />
    </Link>
  )

  return (
    <AppShell
      nav={primary}
      secondary={secondary}
      brandSub="Creator Studio"
      badge={
        session?.plan === 'pro'
          ? 'Pro plan'
          : session?.plan === 'creator'
            ? 'Creator plan'
            : 'Free plan'
      }
      action={viewPage}
      adminLink={isAdmin}
      footnote={
        <div className="status-card">
          <span className={profile.published ? 'dot live' : 'dot'} />
          <div className="status-text">
            <p className="status-title">{profile.published ? 'Page is live' : 'Still a draft'}</p>
            <p className="status-sub">leenkr.app/{profile.username}</p>
          </div>
        </div>
      }
    />
  )
}

function AdminShell() {
  usePageTitle('Admin · Leenkr')
  const { session } = useSession()

  const nav: NavItem[] = [
    { label: 'Overview', to: ADMIN, icon: Shield },
    { label: 'Creators', to: `${ADMIN}/creators`, icon: User },
    { label: 'Verification', to: `${ADMIN}/verification`, icon: ShieldCheck },
    { label: 'Orders', to: `${ADMIN}/orders`, icon: Wallet },
    { label: 'Payouts', to: `${ADMIN}/payouts`, icon: Banknote },
  ]

  return (
    <AppShell
      nav={nav}
      home={ADMIN}
      brandSub="Control panel"
      badge="Operator"
      install={false}
      action={
        <Link className="btn ghost sm" to={STUDIO}>
          <ArrowLeft size={15} />
          Studio
        </Link>
      }
      footnote={
        <div className="status-card">
          <span className="dot live" />
          <div className="status-text">
            <p className="status-title">Operator access</p>
            <p className="status-sub">{session?.email || 'Signed in'}</p>
          </div>
        </div>
      }
    />
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

// The RPCs refuse non-operators anyway; this only keeps the screen out of reach.
function RequireAdmin({ children }: { children: ReactNode }) {
  const { ready, isAdmin } = useIsAdmin()
  if (!ready) return <div className="mk-boot" aria-hidden="true" />
  if (!isAdmin) return <Navigate to={STUDIO} replace />
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
        path="/earn"
        element={
          <MarketingRoute>
            <Earn />
          </MarketingRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
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
        <Route path="insight" element={<Insight />} />
        <Route path="earnings" element={<EarningsPage />} />
        <Route path="verify" element={<Verify />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<DashboardFallback />} />
      </Route>

      <Route
        path={ADMIN}
        element={
          <RequireSession>
            <RequireAdmin>
              <AdminShell />
            </RequireAdmin>
          </RequireSession>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="creators" element={<AdminCreators />} />
        <Route path="verification" element={<AdminVerifications />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="payouts" element={<AdminPayouts />} />
        <Route path="*" element={<Navigate to={ADMIN} replace />} />
      </Route>

      <Route path="/p/:username" element={<LegacyProfileRedirect />} />
      <Route path="/:username/p/:slug" element={<ProductDetail />} />
      <Route path="/:username" element={<PublicProfile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
