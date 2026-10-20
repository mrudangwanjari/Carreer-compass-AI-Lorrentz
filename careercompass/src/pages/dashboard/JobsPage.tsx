/**
 * JobsPage  (Milestone 3)
 * ────────────────────────
 * Full job recommendation engine page.
 *
 * Layout:
 *  ┌──────────┬────────────────────────────┬─────────────────────┐
 *  │ Filters  │  Ranked job list           │  Job detail panel   │
 *  │ (240px)  │  (scroll, match ring)      │  (skill gap, apply) │
 *  └──────────┴────────────────────────────┴─────────────────────┘
 *
 * Features:
 *  – SBERT match scores with animated ring gauges
 *  – Sort: match score | recency | salary
 *  – Filters: search, domain, work-type, exp-level, remote, min-score
 *  – Skill match / gap analysis in detail panel
 *  – Resume-reactive: scores update when resume is uploaded
 *  – No-resume nudge banner
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, RefreshCw, Upload, ChevronDown,
  LayoutList, SlidersHorizontal, X, Info,
} from 'lucide-react'
import clsx from 'clsx'
import { JobCard }    from '../../components/jobs/JobCard'
import { JobFilters } from '../../components/jobs/JobFilters'
import { JobDetail }  from '../../components/jobs/JobDetail'
import { Badge, Button } from '../../components/ui'
import { useJobs, type SortBy }  from '../../context/JobsContext'
import { useResume } from '../../context/ResumeContext'

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'match',  label: 'Best Match'   },
  { value: 'recent', label: 'Most Recent'  },
  { value: 'salary', label: 'Highest Salary' },
]

export default function JobsPage() {
  const navigate = useNavigate()
  const { jobs, loading, sortBy, setSortBy, selectedJob, selectJob, refreshJobs, totalCount } = useJobs()
  const { status: resumeStatus } = useResume()

  const [showFilters, setShowFilters] = useState(false)
  const hasParsed = resumeStatus === 'done'

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      {/* ── Top bar ───────────────────────────────────────────────────────────── */}
      <div className="shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase size={20} className="text-brand-400" />
              <h2 className="text-2xl font-bold text-white">Job Recommendations</h2>
              {hasParsed && (
                <Badge variant="success" dot className="ml-1">Live</Badge>
              )}
            </div>
            <p className="text-slate-400 text-sm">
              {hasParsed
                ? `Ranked by LorentzFM compatibility score · ${jobs.length} results from ${totalCount} jobs`
                : 'Upload your resume to get personalised job rankings'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortBy)}
                className={clsx(
                  'h-9 pl-3 pr-8 rounded-xl text-sm border transition-all appearance-none cursor-pointer',
                  'bg-white/5 text-slate-300 border-white/12',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
                  '[&>option]:bg-[#1e293b] [&>option]:text-white',
                )}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            {/* Mobile filter toggle */}
            <Button
              variant="secondary"
              size="md"
              leftIcon={<SlidersHorizontal size={15} />}
              onClick={() => setShowFilters(v => !v)}
              className="xl:hidden"
            >
              Filters
            </Button>

            {/* Refresh */}
            <Button
              variant="secondary"
              size="md"
              leftIcon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
              onClick={refreshJobs}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* No-resume nudge */}
        {!hasParsed && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3.5 rounded-xl border border-amber-500/25 bg-amber-500/8">
            <Info size={16} className="text-amber-400 shrink-0" />
            <p className="text-amber-300 text-sm flex-1">
              Upload your resume to get AI-powered personalised job matches with skill gap analysis.
            </p>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Upload size={14} />}
              onClick={() => navigate('/dashboard/resume')}
              className="shrink-0 text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/20"
            >
              Upload
            </Button>
          </div>
        )}

        {/* Mobile filters drawer */}
        {showFilters && (
          <div className="xl:hidden mt-4 p-4 rounded-2xl border border-white/10 bg-white/4 relative">
            <button
              onClick={() => setShowFilters(false)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/8"
            >
              <X size={15} />
            </button>
            <JobFilters />
          </div>
        )}
      </div>

      {/* ── Main 3-col layout ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">

        {/* Left — filters (desktop) */}
        <aside className="hidden xl:block w-[220px] shrink-0 overflow-y-auto rounded-2xl border border-white/10 bg-white/3 p-4">
          <JobFilters />
        </aside>

        {/* Centre — job list */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-2.5 pr-0.5">
          {loading ? (
            /* Loading skeleton */
            <div className="space-y-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-white/4 border border-white/8 animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Briefcase size={24} className="text-slate-600" />
              </div>
              <div>
                <p className="text-slate-400 font-medium">No jobs match your filters</p>
                <p className="text-slate-600 text-sm mt-0.5">Try relaxing the filter criteria</p>
              </div>
            </div>
          ) : (
            jobs.map((job, i) => (
              <JobCard
                key={job.job_id}
                job={job}
                rank={i + 1}
                selected={selectedJob?.job_id === job.job_id}
                onClick={() => selectJob(selectedJob?.job_id === job.job_id ? null : job)}
              />
            ))
          )}
        </div>

        {/* Right — job detail panel */}
        <aside
          className={clsx(
            'shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/3 transition-all duration-300',
            selectedJob ? 'w-[360px]' : 'w-0 border-0',
          )}
        >
          <JobDetail />
        </aside>
      </div>

      {/* ── Stats footer ──────────────────────────────────────────────────────── */}
      {!loading && jobs.length > 0 && (
        <div className="shrink-0 flex items-center gap-6 text-xs text-slate-600 pt-1">
          <span>Showing {jobs.length} of {totalCount} jobs</span>
          {hasParsed && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {jobs.filter(j => j.match_score >= 85).length} excellent matches (≥85%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                {jobs.filter(j => j.match_score >= 70 && j.match_score < 85).length} good matches (70–84%)
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
