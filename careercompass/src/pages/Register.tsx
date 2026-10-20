import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, Compass, ArrowRight, CheckCircle } from 'lucide-react'
import { Button, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const perks = [
  'Instant job recommendations from 123K+ roles',
  'Personalized course & certification suggestions',
  'Research domain classification across 15 areas',
  'AI career roadmap tailored to your profile',
]

export default function Register() {
  const navigate = useNavigate()
  const { register, loading: authLoading, error: authError, clearError } = useAuth()
  const [showPass,  setShowPass]  = useState(false)
  const [localError, setLocalError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })

  const error = authError ?? localError

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError(); setLocalError('')
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (!form.name || !form.email || !form.password)  { setLocalError('All fields are required.'); return }
    if (form.password.length < 8)                     { setLocalError('Password must be at least 8 characters.'); return }
    if (form.password !== form.confirm)               { setLocalError('Passwords do not match.'); return }
    try {
      await register(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch { /* error in context */ }
  }

  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8)      s++
    if (/[A-Z]/.test(p))    s++
    if (/[0-9]/.test(p))    s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-400', 'bg-emerald-500'][strength]

  return (
    <div className="min-h-screen bg-[#08080f] flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1a1040] via-brand-950 to-surface-950 flex-col items-center justify-center p-12">
        <div className="absolute w-96 h-96 bg-brand-600/25 rounded-full blur-3xl top-0 -right-20" />
        <div className="absolute w-72 h-72 bg-accent-600/15 rounded-full blur-3xl bottom-0 left-0" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative z-10 max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-glow-sm">
              <Compass size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">
              Career<span className="text-brand-400">Compass</span>
              <span className="text-brand-400/70 text-xs ml-1 align-super">AI</span>
            </span>
          </Link>

          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Start your AI-powered<br />
            <span className="gradient-text">career journey</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Create a free account and get your personalized career intelligence report in minutes.
          </p>

          <ul className="space-y-4">
            {perks.map(perk => (
              <li key={perk} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={11} className="text-emerald-400" />
                </div>
                <span className="text-slate-300 text-sm">{perk}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 p-4 glass rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex -space-x-2">
                {['SC','RP','AO'].map(av => (
                  <div key={av} className="w-7 h-7 rounded-full bg-brand-600 border-2 border-surface-900 flex items-center justify-center text-[9px] font-bold text-white">{av}</div>
                ))}
              </div>
              <span className="text-slate-300 text-xs font-medium">10,000+ professionals</span>
            </div>
            <p className="text-slate-500 text-xs">already advancing their careers with CareerCompass AI</p>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-md py-6">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Compass size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-white">
              Career<span className="text-brand-400">Compass</span>
            </span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-white mb-2">Create account</h1>
          <p className="text-slate-400 text-sm mb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[{ label: 'Google', icon: '🔵' }, { label: 'GitHub', icon: '⚫' }].map(({ label, icon }) => (
              <button key={label} className="flex items-center justify-center gap-2 h-11 rounded-xl border border-white/12 bg-white/5 hover:bg-white/10 text-sm text-slate-300 font-medium transition-all">
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-500">
              <span className="bg-[#08080f] px-3">or register with email</span>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Full name"
              name="name"
              type="text"
              placeholder="Jane Doe"
              value={form.name}
              onChange={handle}
              leftIcon={<User size={16} />}
              autoComplete="name"
            />
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
            <div className="space-y-1.5">
              <Input
                label="Password"
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handle}
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button type="button" onClick={() => setShowPass(s => !s)} className="hover:text-white transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                autoComplete="new-password"
              />
              {form.password && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${['','text-red-400','text-amber-400','text-emerald-400','text-emerald-400'][strength]}`}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>
            <Input
              label="Confirm password"
              name="confirm"
              type="password"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={handle}
              leftIcon={<Lock size={16} />}
              autoComplete="new-password"
            />

            <label className="flex items-start gap-2.5 text-sm text-slate-400 cursor-pointer select-none pt-1">
              <input type="checkbox" required className="mt-0.5 w-4 h-4 rounded accent-brand-500 shrink-0" />
              <span>
                I agree to the{' '}
                <a href="#" className="text-brand-400 hover:text-brand-300">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-brand-400 hover:text-brand-300">Privacy Policy</a>
              </span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={authLoading}
              rightIcon={!authLoading ? <ArrowRight size={18} /> : undefined}
            >
              {authLoading ? 'Creating account…' : 'Create free account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
