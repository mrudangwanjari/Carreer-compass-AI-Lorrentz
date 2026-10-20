/**
 * JobCard
 * ───────
 * A single row in the ranked job list.
 * Shows: company logo placeholder, title, company, location, type,
 * salary, matched skills, domain badge, and the SBERT match ring.
 */
import { MapPin, Clock, DollarSign, Wifi, ChevronRight, Calendar } from 'lucide-react'
import clsx from 'clsx'
import { Badge } from '../ui'
import { MatchRing } from './MatchRing'
import { type Job, formatSalary, scoreBg } from '../../data/jobsData'

interface JobCardProps {
  job:      Job
  rank:     number
  selected: boolean
  onClick:  () => void
}

const DOMAIN_COLORS: Record<string, string> = {
  'ML/AI':               'brand',
  'Data Science':        'accent',
  'Data Engineering':    'success',
  'Cloud/DevOps':        'warning',
  'Software Engineering':'neutral',
  'Research':            'accent',
}

/* Deterministic colour for company initials avatar */
const AVATAR_COLORS = [
  'bg-brand-600', 'bg-emerald-600', 'bg-amber-600',
  'bg-rose-600',  'bg-sky-600',     'bg-accent-600',
]
function avatarColor(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export function JobCard({ job, rank, selected, onClick }: JobCardProps) {
  const domainVariant = (DOMAIN_COLORS[job.domain] ?? 'neutral') as any

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left rounded-2xl border p-4 transition-all duration-200',
        'flex items-start gap-4 group',
        selected
          ? 'border-brand-500/50 bg-brand-500/8 shadow-glow-sm'
          : 'border-white/10 bg-white/4 hover:border-brand-500/30 hover:bg-white/6 hover:-translate-y-px hover:shadow-card',
      )}
    >
      {/* Company avatar */}
      <div
        className={clsx(
          'w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0',
          avatarColor(job.company_name),
        )}
      >
        {job.company_name.slice(0, 2).toUpperCase()}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white leading-tight">{job.title}</span>
              {rank <= 3 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  #{rank}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-0.5">{job.company_name}</p>
          </div>
          <MatchRing score={job.match_score} size={46} />
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mb-2.5">
          <span className="flex items-center gap-1">
            <MapPin size={10} className="shrink-0" />
            {job.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} className="shrink-0" />
            {job.work_type}
          </span>
          {job.remote_allowed && (
            <span className="flex items-center gap-1 text-emerald-400/80">
              <Wifi size={10} className="shrink-0" />
              Remote
            </span>
          )}
          {(job.min_salary || job.max_salary) && (
            <span className="flex items-center gap-1 text-slate-400">
              <DollarSign size={10} className="shrink-0" />
              {formatSalary(job)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={10} className="shrink-0" />
            {job.posted_days_ago}d ago
          </span>
        </div>

        {/* Domain + matched skills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={domainVariant} className="text-[10px]">{job.domain}</Badge>
          {job.matched_skills.slice(0, 4).map(skill => (
            <span
              key={skill}
              className="inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-brand-500/10 text-brand-300 border border-brand-500/15"
            >
              {skill}
            </span>
          ))}
          {job.matched_skills.length > 4 && (
            <span className="text-[10px] text-slate-500">+{job.matched_skills.length - 4} more</span>
          )}
        </div>
      </div>

      {/* Arrow indicator */}
      <ChevronRight
        size={16}
        className={clsx(
          'shrink-0 mt-1 transition-all',
          selected
            ? 'text-brand-400 translate-x-0'
            : 'text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5',
        )}
      />
    </button>
  )
}
