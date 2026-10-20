import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Compass, ArrowRight, Zap } from 'lucide-react'
import { Button, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, demoLogin, loading: authLoading, error: authError, clearError } = useAuth()
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [localError, setLocalError] = useState('')

  const error = authError ?? localError

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError()
    setLocalError('')
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (!form.email || !form.password) { setLocalError('Please fill in all fields.'); return }
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch { /* error already set in context */ }
  }

  const handleDemo = async () => {
    await demoLogin()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#08080f] flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-950 via-[#1a1040] to-surface-950 items-center justify-center p-12">
        {/* Orbs */}
        <div className="absolute w-80 h-80 bg-brand-600/30 rounded-full blur-3xl -top-20 -left-20" />
        <div className="absolute w-64 h-64 bg-accent-600/20 rounded-full blur-3xl bottom-10 right-10" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative z-10 max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 mx-auto mb-6 flex items-center justify-center shadow-glow">
            <Compass size={32} className="text-white" />
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Welcome back to<br />
            <span className="gradient-text">CareerCompass AI</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your personalized job matches, course recommendations, and career roadmap are waiting for you.
          </p>
          {/* Mini stats */}
          <div className="mt-10 grid grid-cols-2 gap-4 text-left">
            {[
              { value: '47', label: 'Job matches ready' },
              { value: '94%', label: 'Match accuracy' },
              { value: '23', label: 'Courses queued' },
              { value: '5', label: 'Research domains' },
            ].map(({ value, label }) => (
              <div key={label} className="glass rounded-xl p-4">
                <div className="font-display text-2xl font-bold text-brand-400">{value}</div>
                <div className="text-slate-500 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Logo (mobile only) */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Compass size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-white">
              Career<span className="text-brand-400">Compass</span>
              <span className="text-brand-400/70 text-xs ml-1 align-super">AI</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold text-white mb-2">Sign in</h1>
          <p className="text-slate-400 text-sm mb-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>

          {/* ── Demo sign-in banner ─────────────────────────────────────── */}
          <button
            onClick={handleDemo}
            disabled={authLoading}
            className="w-full mb-6 flex items-center gap-3 px-4 py-3.5 rounded-xl border border-amber-500/30 bg-amber-500/8 hover:bg-amber-500/14 hover:border-amber-400/50 transition-all group text-left disabled:opacity-60"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-300 text-sm font-semibold leading-none mb-0.5">Try the Demo</p>
              <p className="text-amber-500/70 text-xs">Skip sign-in — jump straight to the dashboard</p>
            </div>
            <ArrowRight size={16} className="text-amber-400/60 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Social sign-in */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Google', icon: '🔵' },
              { label: 'GitHub', icon: '⚫' },
            ].map(({ label, icon }) => (
              <button
                key={label}
                className="flex items-center justify-center gap-2 h-11 rounded-xl border border-white/12 bg-white/5 hover:bg-white/10 text-sm text-slate-300 font-medium transition-all"
              >
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-500">
              <span className="bg-[#08080f] px-3">or continue with email</span>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handle}
              leftIcon={<Mail size={16} />}
              autoComplete="email"
            />
            <Input
              label="Password"
              name="password"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={handle}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPass(s => !s)} className="hover:text-white transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 rounded accent-brand-500" />
                Remember me
              </label>
              <a href="#" className="text-brand-400 hover:text-brand-300 transition-colors">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={authLoading}
              rightIcon={!authLoading ? <ArrowRight size={18} /> : undefined}
              className="mt-2"
            >
              {authLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-600">
            By signing in you agree to our{' '}
            <a href="#" className="underline hover:text-slate-400">Terms</a> and{' '}
            <a href="#" className="underline hover:text-slate-400">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
