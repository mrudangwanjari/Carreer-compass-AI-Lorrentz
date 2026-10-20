import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, Upload, Brain, Target, BookOpen, Award, TrendingUp,
  Star, ArrowRight, Zap, Shield, BarChart3, Users, CheckCircle,
  Compass, Twitter, Github, Linkedin, Mail
} from 'lucide-react'
import { Button, Badge, Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'

/* ─── tiny helpers ─────────────────────────────────────────────────────────── */
function GradientOrb({ className }: { className?: string }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl pointer-events-none opacity-30 ${className}`}
    />
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════════════════════ */
function Hero() {
  const navigate  = useNavigate()
  const { demoLogin } = useAuth()

  const handleDemo = async () => {
    await demoLogin()
    navigate('/dashboard')
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#08080f]">
      {/* Background orbs */}
      <GradientOrb className="w-[600px] h-[600px] bg-brand-600 -top-40 -left-40" />
      <GradientOrb className="w-[500px] h-[500px] bg-accent-600 top-1/3 -right-32" />
      <GradientOrb className="w-[400px] h-[400px] bg-brand-800 bottom-0 left-1/3" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="container-xl section-pad relative z-10 pt-32 lg:pt-40">
        <div className="max-w-4xl mx-auto text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-medium mb-8 animate-fade-in">
            <Zap size={14} className="text-brand-400" />
            Powered by LorentzFM · Hyperbolic Embeddings · Structured Features
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] mb-6 animate-fade-up">
            Your AI Career{' '}
            <span className="gradient-text">Compass</span>
            <br />
            Pointing True North
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up animate-delay-100">
            Upload your resume and instantly receive personalized job recommendations,
            course suggestions, and research domain insights — all powered by
            state-of-the-art deep learning models.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up animate-delay-200">
            <Button
              size="xl"
              variant="primary"
              rightIcon={<ChevronRight size={20} />}
              onClick={() => navigate('/register')}
              className="btn-glow"
            >
              Start for Free
            </Button>
            {/* Demo — one-click direct dashboard access */}
            <Button
              size="xl"
              variant="ghost"
              leftIcon={<Zap size={20} className="text-amber-400" />}
              onClick={handleDemo}
              className="border border-amber-500/30 text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 hover:border-amber-400/50"
            >
              Live Demo
            </Button>
            <Button
              size="xl"
              variant="secondary"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              How it works
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 animate-fade-up animate-delay-300">
            {[
              { icon: Users, text: '10,000+ careers guided' },
              { icon: BarChart3, text: '94% match accuracy' },
              { icon: Shield, text: 'Privacy-first design' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={16} className="text-brand-400" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero card preview */}
        <div className="mt-20 max-w-3xl mx-auto animate-fade-up animate-delay-400">
          <div className="glass rounded-3xl p-1 shadow-glow">
            <div className="rounded-2xl bg-surface-900 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs text-slate-500 font-mono">careercompass.ai/dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Job Matches', value: '47', color: 'text-brand-400', bg: 'bg-brand-500/10' },
                  { label: 'Match Score', value: '94%', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Courses Found', value: '23', color: 'text-accent-400', bg: 'bg-accent-500/10' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                    <div className={`text-2xl font-bold ${color} font-display`}>{value}</div>
                    <div className="text-xs text-slate-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {['Senior ML Engineer @ Google — 96% match', 'Data Scientist @ Meta — 91% match', 'AI Research Lead @ OpenAI — 88% match'].map((job, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/4 hover:bg-white/7 transition-colors">
                    <span className="text-sm text-slate-300">{job}</span>
                    <ChevronRight size={14} className="text-brand-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   FEATURES
══════════════════════════════════════════════════════════════════════════════ */
const features = [
  {
    icon: Brain,
    title: 'LorentzFM Hyperbolic Matching',
    desc: 'Lorentz/hyperbolic embeddings capture hierarchical relationships between skills and roles — delivering richer, geometry-aware job matches than flat vector spaces.',
    badge: 'Core AI',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    icon: Target,
    title: 'Precision Job Ranking',
    desc: 'FAISS-powered vector search ranks 123,000+ jobs by relevance in milliseconds. See match scores, skill alignment, and fit rationale.',
    badge: 'Retrieval',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: BookOpen,
    title: 'Course Recommendations',
    desc: 'Identifies skill gaps between your profile and target roles, then recommends courses and certifications to bridge them.',
    badge: 'Learning',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Award,
    title: 'Research Domain Insights',
    desc: 'Predicts which research domains align with your background using domain-label classification across 15 specializations.',
    badge: 'Research',
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Career Roadmap',
    desc: 'Visual career progression analysis showing your current trajectory, ideal roles, and the learning path to get there.',
    badge: 'Roadmap',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    icon: BarChart3,
    title: 'Skill Gap Analysis',
    desc: 'Side-by-side comparison of your skill set against the top-matching roles, with actionable improvement suggestions.',
    badge: 'Analytics',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
]

function Features() {
  return (
    <section id="features" className="section-pad bg-[#08080f] relative overflow-hidden">
      <GradientOrb className="w-[500px] h-[500px] bg-brand-700 top-1/2 -translate-y-1/2 -right-64" />
      <div className="container-xl relative z-10">
        <div className="text-center mb-16">
          <Badge variant="brand" className="mb-4">Features</Badge>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
            Everything you need to{' '}
            <span className="gradient-text">navigate your career</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            A complete AI-powered career intelligence platform — from resume parsing to
            personalized roadmaps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, badge, color, bg }) => (
            <Card key={title} hover glow className="group relative overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-brand-600/5 to-transparent rounded-2xl" />
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon size={22} className={color} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-white font-semibold">{title}</h3>
                <Badge variant="neutral" className="text-[10px]">{badge}</Badge>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════════════════════════════════════════════ */
const steps = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload Your Resume',
    desc: 'Drop your PDF or DOCX. Our parser extracts skills, experience, education, certifications, and role history automatically.',
    color: 'bg-brand-600',
  },
  {
    step: '02',
    icon: Brain,
    title: 'AI Analysis',
    desc: 'LorentzFM encodes your profile into hyperbolic space. Cross-field Lorentz inner products identify the domains and roles that best match your background.',
    color: 'bg-accent-600',
  },
  {
    step: '03',
    icon: Target,
    title: 'Get Recommendations',
    desc: 'FAISS retrieves top-ranked jobs. The system surfaces courses, certifications, and research domains tailored to you.',
    color: 'bg-emerald-600',
  },
  {
    step: '04',
    icon: TrendingUp,
    title: 'Chart Your Path',
    desc: 'Explore your career roadmap, track skill progression, and take action with curated resources — all in one dashboard.',
    color: 'bg-amber-600',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="section-pad bg-[#0a0a16] relative overflow-hidden">
      <GradientOrb className="w-[600px] h-[600px] bg-brand-800 top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="container-xl relative z-10">
        <div className="text-center mb-16">
          <Badge variant="accent" className="mb-4">How It Works</Badge>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
            From resume to roadmap{' '}
            <span className="gradient-text">in minutes</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Four simple steps — one comprehensive career intelligence report.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-[52px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

          {steps.map(({ step, icon: Icon, title, desc, color }) => (
            <div key={step} className="flex flex-col items-center text-center group">
              <div className="relative mb-6">
                <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow`}>
                  <Icon size={28} className="text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface-900 border border-brand-500/40 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-brand-400">{step}</span>
                </div>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   STATS
══════════════════════════════════════════════════════════════════════════════ */
const stats = [
  { value: '123K+', label: 'Jobs in Database',      sub: 'LinkedIn dataset' },
  { value: '94%',   label: 'Recommendation Accuracy', sub: 'P@10 metric' },
  { value: '228',   label: 'Resume Profiles',         sub: 'Tested & validated' },
  { value: '<1s',   label: 'Retrieval Speed',          sub: 'FAISS vector search' },
]

function Stats() {
  return (
    <section className="section-pad bg-[#08080f] border-y border-white/6">
      <div className="container-xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(({ value, label, sub }) => (
            <div key={label} className="text-center">
              <div className="font-display text-4xl lg:text-5xl font-bold gradient-text mb-1">
                {value}
              </div>
              <div className="text-white font-semibold mb-1">{label}</div>
              <div className="text-slate-500 text-sm">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════════════════════════════════════ */
const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'ML Engineer → Senior AI Researcher',
    avatar: 'SC',
    stars: 5,
    text: "CareerCompass identified research domains I hadn't even considered. Within 3 months I landed a role in NLP research that perfectly matched my background.",
  },
  {
    name: 'Rohan Patel',
    role: 'Software Developer → Data Scientist',
    avatar: 'RP',
    stars: 5,
    text: 'The skill gap analysis was eye-opening. It pinpointed exactly which certifications would make me competitive for DS roles. Landed my first DS offer in 6 weeks.',
  },
  {
    name: 'Amara Osei',
    role: 'Business Analyst → Product Manager',
    avatar: 'AO',
    stars: 5,
    text: 'The course recommendations were spot-on. It suggested a PM certification I got, and the job recommendations shifted to PM roles immediately. Incredibly accurate.',
  },
]

function Testimonials() {
  return (
    <section id="about" className="section-pad bg-[#0a0a16] relative overflow-hidden">
      <GradientOrb className="w-[400px] h-[400px] bg-accent-700 bottom-0 -left-32" />
      <div className="container-xl relative z-10">
        <div className="text-center mb-14">
          <Badge variant="success" className="mb-4">Success Stories</Badge>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
            Careers transformed by{' '}
            <span className="gradient-text">intelligent guidance</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, avatar, stars, text }) => (
            <Card key={name} className="flex flex-col gap-4">
              <div className="flex gap-0.5">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed flex-1">"{text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/8">
                <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white">
                  {avatar}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{name}</div>
                  <div className="text-slate-500 text-xs">{role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   CTA
══════════════════════════════════════════════════════════════════════════════ */
function CTA() {
  const navigate = useNavigate()
  return (
    <section className="section-pad bg-[#08080f] relative overflow-hidden">
      <GradientOrb className="w-[700px] h-[700px] bg-brand-700 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="container-xl relative z-10">
        <div className="glass rounded-3xl p-10 lg:p-16 text-center max-w-3xl mx-auto border border-brand-500/20">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 mx-auto mb-6 flex items-center justify-center shadow-glow">
            <Compass size={32} className="text-white" />
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to find your{' '}
            <span className="gradient-text">true north?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of professionals who've accelerated their careers with
            AI-powered personalized guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="xl"
              variant="primary"
              rightIcon={<ArrowRight size={20} />}
              onClick={() => navigate('/register')}
              className="btn-glow"
            >
              Get Started — It's Free
            </Button>
            <Button size="xl" variant="secondary" onClick={() => navigate('/login')}>
              Sign in
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
            {['No credit card required', 'Privacy-first', 'Cancel anytime'].map(item => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="bg-[#060609] border-t border-white/6">
      <div className="container-xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <Compass size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-white">
                Career<span className="text-brand-400">Compass</span>
                <span className="text-brand-400/70 text-xs ml-1 align-super">AI</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              AI-powered career intelligence for the modern professional.
            </p>
            <div className="flex gap-3">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-white/6 hover:bg-white/12 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            {
              heading: 'Product',
              links: ['Features', 'Job Recommendations', 'Course Engine', 'Research Domains', 'Career Roadmap'],
            },
            {
              heading: 'Research',
              links: ['SBERT Baseline', 'LorentzFM Model', 'BERT Comparison', 'Dataset', 'Methodology'],
            },
            {
              heading: 'Company',
              links: ['About', 'Blog', 'Privacy Policy', 'Terms of Service', 'Contact'],
            },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <h4 className="text-white text-sm font-semibold mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <p>© 2026 CareerCompass AI. Built for research purposes.</p>
          <p className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE EXPORT
══════════════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  )
}
