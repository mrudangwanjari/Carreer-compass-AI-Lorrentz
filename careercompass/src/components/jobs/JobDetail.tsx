/**
 * JobDetail
 * ─────────
 * Right-panel detail view for the selected job.
 * Shows: full description, matched vs missing skills, salary,
 * company info, apply button, and skill-gap analysis.
 */
import {
  X, MapPin, Briefcase, DollarSign, Wifi, Users,
  CheckCircle2, XCircle, ExternalLink, Calendar,
  BarChart3, ChevronDown, Building2,
} from 'lucide-react'
import clsx from 'clsx'
import { useJobs } from '../../context/JobsContext'
import { useResume } from '../../context/ResumeContext'
import { MatchRing } from './MatchRing'
import { Button, Badge } from '../ui'
import { type Job, formatSalary } from '../../data/jobsData'

export function JobDetail() {
  const { selectedJob, selectJob } = useJobs()
  const { resume } = useResume()

  if (!selectedJob) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Briefcase size={24} className="text-slate-600" />
        </div>
        <div>
          <p className="text-slate-400 font-medium">Select a job</p>
          <p className="text-slate-600 text-sm mt-0.5">Click any job to see full details and skill analysis</p>
        </div>
      </div>
    )
  }

  const job = selectedJob

  /* Skill gap analysis */
  const userSkills    = new Set((resume?.tech_skills ?? []).map(s => s.toLowerCase()))
  const jobSkills     = job.skills_desc
  const matchedSkills = jobSkills.filter(s => userSkills.has(s.toLowerCase()))
  const missingSkills = jobSkills.filter(s => !userSkills.has(s.toLowerCase()))
  const matchPct      = Math.round((matchedSkills.length / Math.max(jobSkills.length, 1)) * 100)

  const DOMAIN_COLORS: Record<string, string> = {
    'ML/AI':               'brand',
    'Data Science':        'accent',
    'Data Engineering':    'success',
    'Cloud/DevOps':        'warning',
    'Software Engineering':'neutral',
    'Research':            'accent',
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sticky header */}
      <div className="shrink-0 p-5 border-b border-white/8 flex items-start gap-4">
        {/* Company avatar */}
        <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {job.company_name.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-base leading-tight">{job.title}</h2>
          <p className="text-brand-400 text-sm font-medium">{job.company_name}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
            <span className="flex items-center gap-1"><Briefcase size={10} />{job.work_type}</span>
            {job.remote_allowed && (
              <span className="flex items-center gap-1 text-emerald-400/80"><Wifi size={10} />Remote</span>
            )}
          </div>
        </div>

        {/* Close */}
        <button
          onClick={() => selectJob(null)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Match score + salary row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/4 border border-white/8 p-3">
            <MatchRing score={job.match_score} size={48} />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">LorentzFM Score</p>
              <p className="text-white font-bold">{job.match_score}% match</p>
              <p className="text-[10px] text-slate-500">Rank #{job.match_score >= 85 ? 'Top' : ''} result</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/4 border border-white/8 p-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
              <DollarSign size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Salary</p>
              <p className="text-white font-bold text-sm">{formatSalary(job)}</p>
              {job.pay_period && (
                <p className="text-[10px] text-slate-500">{job.pay_period.toLowerCase()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick info chips */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={(DOMAIN_COLORS[job.domain] ?? 'neutral') as any}>{job.domain}</Badge>
          <Badge variant="neutral">{job.experience_level}</Badge>
          <Badge variant="neutral" dot>
            <Calendar size={9} className="mr-0.5" />
            {job.posted_days_ago}d ago
          </Badge>
          <Badge variant="neutral">
            <Users size={9} className="mr-0.5" />
            {job.applies} applied
          </Badge>
          <Badge variant="neutral">{job.company_size}</Badge>
        </div>

        {/* Skill gap analysis */}
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/4 border-b border-white/8">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-brand-400" />
              <span className="text-sm font-semibold text-white">Skill Match Analysis</span>
            </div>
            <span className={clsx(
              'text-xs font-bold',
              matchPct >= 70 ? 'text-emerald-400'
              : matchPct >= 50 ? 'text-amber-400' : 'text-red-400',
            )}>
              {matchPct}% match
            </span>
          </div>

          {/* Progress bar */}
          <div className="px-4 py-3 border-b border-white/8">
            <div className="w-full h-1.5 rounded-full bg-white/8">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-700',
                  matchPct >= 70 ? 'bg-emerald-500'
                  : matchPct >= 50 ? 'bg-amber-500' : 'bg-red-500',
                )}
                style={{ width: `${matchPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
              <span>{matchedSkills.length} / {jobSkills.length} required skills</span>
              <span>{missingSkills.length} to develop</span>
            </div>
          </div>

          {/* Matched skills */}
          {matchedSkills.length > 0 && (
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-2">
                ✓ You have ({matchedSkills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <CheckCircle2 size={9} />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {missingSkills.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide mb-2">
                ⚡ Skill gap ({missingSkills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/8 text-amber-300/80 border border-amber-500/15">
                    <XCircle size={9} />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <h3 className="text-white font-semibold text-sm mb-2.5 flex items-center gap-2">
            <Building2 size={14} className="text-brand-400" />
            Job Description
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">{job.description}</p>
        </div>

        {/* Company info */}
        <div className="rounded-xl bg-white/4 border border-white/8 p-4 space-y-2">
          <h3 className="text-white font-semibold text-sm">{job.company_name}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Users size={10} />{job.company_size}</span>
            <span className="flex items-center gap-1">
              <Building2 size={10} />{job.industry}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky footer — CTA */}
      <div className="shrink-0 p-4 border-t border-white/8 flex gap-3">
        <Button
          variant="primary"
          fullWidth
          leftIcon={<ExternalLink size={15} />}
          onClick={() => window.open(job.url, '_blank')}
        >
          Apply Now
        </Button>
        <Button
          variant="secondary"
          onClick={() => selectJob(null)}
          className="shrink-0 px-3"
        >
          <X size={15} />
        </Button>
      </div>
    </div>
  )
}
