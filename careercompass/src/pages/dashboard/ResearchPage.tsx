/**
 * ResearchPage  (Milestone 4)
 * ────────────────────────────
 * Research domain predictions using 15-dim domain classification.
 * – Bar chart of domain alignment scores
 * – Radar chart across all domains
 * – Per-domain detail cards with trend indicators
 * – Skills you already have vs skills to develop per domain
 */
import { FlaskConical, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react'
import clsx from 'clsx'
import { Card, Badge } from '../../components/ui'
import { useRecs } from '../../context/RecommendationsContext'
import { useResume } from '../../context/ResumeContext'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis,
  YAxis, CartesianGrid, Cell,
} from 'recharts'
import type { ResearchDomain } from '../../data/coursesData'

const TOOLTIP_STYLE = {
  background: '#1e293b',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
}

function TrendIcon({ trend }: { trend: ResearchDomain['trend'] }) {
  if (trend === 'rising')   return <TrendingUp  size={13} className="text-emerald-400" />
  if (trend === 'declining') return <TrendingDown size={13} className="text-red-400" />
  return <Minus size={13} className="text-slate-400" />
}

function DomainCard({ domain, rank }: { domain: ResearchDomain; rank: number }) {
  const { resume } = useResume()
  const userSkills = new Set((resume?.tech_skills ?? []).map(s => s.toLowerCase()))

  const matched = domain.top_skills.filter(s => userSkills.has(s.toLowerCase()))
  const missing = domain.top_skills.filter(s => !userSkills.has(s.toLowerCase()))

  return (
    <Card hover className="relative overflow-hidden">
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${domain.color}`} />

      <div className="flex items-start gap-3 mb-4">
        {/* Rank badge */}
        <div className={clsx(
          'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0',
          rank === 1 ? 'bg-amber-500' : rank === 2 ? 'bg-slate-400' : rank === 3 ? 'bg-amber-700' : 'bg-white/10',
        )}>
          #{rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-sm">{domain.name}</h3>
            <div className="flex items-center gap-1">
              <TrendIcon trend={domain.trend} />
              <span className={clsx('text-[10px] font-medium',
                domain.trend === 'rising' ? 'text-emerald-400' : domain.trend === 'declining' ? 'text-red-400' : 'text-slate-400',
              )}>
                {domain.trend.charAt(0).toUpperCase() + domain.trend.slice(1)}
              </span>
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">{domain.papers.toLocaleString()} active research papers</p>
        </div>

        {/* Score */}
        <div className="shrink-0 text-right">
          <div className={`text-2xl font-bold font-display ${domain.text_color}`}>{domain.score}%</div>
          <div className="text-[10px] text-slate-600">alignment</div>
        </div>
      </div>

      {/* Alignment bar */}
      <div className="mb-4">
        <div className="w-full h-2 rounded-full bg-white/8">
          <div
            className={`h-full rounded-full ${domain.color} transition-all duration-700`}
            style={{ width: `${domain.score}%` }}
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-xs leading-relaxed mb-4">{domain.description}</p>

      {/* Skills */}
      <div className="space-y-2">
        {matched.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-1.5">You have</p>
            <div className="flex flex-wrap gap-1">
              {matched.map(s => (
                <span key={s} className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
        {missing.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide mb-1.5">To develop</p>
            <div className="flex flex-wrap gap-1">
              {missing.map(s => (
                <span key={s} className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/8 text-amber-300/80 border border-amber-500/15">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function ResearchPage() {
  const { domains, loading } = useRecs()

  const radarData = domains.map(d => ({
    domain: d.name.split(' ')[0],  // short label
    score: d.score,
  }))

  const barColors = ['#6366f1', '#38bdf8', '#a855f7', '#22c55e', '#f43f5e', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical size={20} className="text-brand-400" />
          <h2 className="text-2xl font-bold text-white">Research Domains</h2>
          <Badge variant="brand">15-dim classifier</Badge>
        </div>
        <p className="text-slate-400 text-sm">
          Domain alignment predicted from your profile using the CareerCompass AI domain classification model.
          Based on {domains.length} specialisation areas.
        </p>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <Card>
          <h3 className="text-white font-semibold mb-4 text-sm">Domain Alignment Scores</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={domains} layout="vertical" margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, 'Alignment']} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {domains.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Radar chart */}
        <Card>
          <h3 className="text-white font-semibold mb-4 text-sm">Domain Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="domain" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Domain cards grid */}
      <div>
        <h3 className="text-white font-semibold mb-4">All Research Domains</h3>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/4 border border-white/8 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((domain, i) => (
              <DomainCard key={domain.id} domain={domain} rank={i + 1} />
            ))}
          </div>
        )}
      </div>

      {/* Note */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl border border-brand-500/15 bg-brand-500/5 text-xs text-slate-400">
        <Star size={13} className="text-brand-400 mt-0.5 shrink-0" />
        <p>
          Domain scores are predicted using the 15-dimensional domain vector from the CareerCompass AI research pipeline
          (dot-product relevance: <code className="text-brand-400 bg-brand-500/10 px-1 rounded">dot(resume_domain, job_domain) &gt; 0</code>).
          Scores reflect skill overlap with each domain's top research topics — not your seniority.
        </p>
      </div>
    </div>
  )
}
