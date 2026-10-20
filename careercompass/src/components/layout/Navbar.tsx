import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Compass, ChevronRight, Zap } from 'lucide-react'
import { Button } from '../ui'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const navLinks = [
  { label: 'Features',     href: '/#features'    },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'About',        href: '/#about'        },
]

export function Navbar() {
  const [open, setOpen]         = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { demoLogin } = useAuth()
  const isDashboard = location.pathname.startsWith('/dashboard')

  const handleDemo = async () => {
    await demoLogin()
    navigate('/dashboard')
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [location])

  if (isDashboard) return null

  return (
    <header
      className={clsx(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-surface-950/90 backdrop-blur-xl border-b border-white/8 shadow-lg'
          : 'bg-transparent',
      )}
    >
      <div className="container-xl">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow">
              <Compass size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white">
              Career<span className="text-brand-400">Compass</span>
              <span className="ml-1 text-xs font-sans font-medium text-brand-400/70 align-super">AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/6 transition-all duration-150"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="md"
              leftIcon={<Zap size={15} className="text-amber-400" />}
              onClick={handleDemo}
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/8 border border-amber-500/20 hover:border-amber-500/40"
            >
              Demo
            </Button>
            <Button variant="ghost" size="md" onClick={() => navigate('/login')}>
              Sign in
            </Button>
            <Button
              variant="primary"
              size="md"
              rightIcon={<ChevronRight size={16} />}
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={clsx(
          'md:hidden overflow-hidden transition-all duration-300',
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="bg-surface-950/95 backdrop-blur-xl border-t border-white/8 px-4 py-4 flex flex-col gap-1">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/6 rounded-xl transition-all"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3 pt-3 border-t border-white/8 flex flex-col gap-2">
            <Button
              variant="ghost"
              fullWidth
              leftIcon={<Zap size={15} className="text-amber-400" />}
              onClick={handleDemo}
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/8 border border-amber-500/20"
            >
              Demo — try instantly
            </Button>
            <Button variant="secondary" fullWidth onClick={() => navigate('/login')}>
              Sign in
            </Button>
            <Button variant="primary" fullWidth onClick={() => navigate('/register')}>
              Get Started Free
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
