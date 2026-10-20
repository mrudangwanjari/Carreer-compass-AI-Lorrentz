/**
 * CoursesPage  (Milestone 4)
 * ──────────────────────────
 * Personalised course / certification recommendations.
 * – Filter by domain, free, sort by relevance / rating / hours
 * – Gap-score badge shows how many skill gaps each course closes
 * – Featured courses pinned to top
 * – Resume-reactive: re-ranks when resume is uploaded
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Clock, Star, ExternalLink, Filter,
  ChevronDown, Zap, Award, Upload, Info, RefreshCw,
  CheckCircle2, TrendingUp,
} from 'lucide-react'
import clsx from 'clsx'
import { Badge, Button, Card } from '../../components/ui'
import { useRecs } from '../../context/RecommendationsContext'
import { useResume } from '../../context/ResumeContext'
import type { CourseFilter, CourseSort } from '../../context/RecommendationsContext'
import type { Course } from '../../data/coursesData'

/* ── Filter tab pills ──────────────────────────────────────────────────────── */
const FILTERS: { value: CourseFilter; label: string }[] = [
  { value: 'all',      label: 'All'              },
  { value: 'ml-ai',   label: 'ML / AI'           },
  { value: 'cloud',   label: 'Cloud & DevOps'    },
  { value: 'data',    label: 'Data Science'      },
  { value: 'software',label: 'Software Eng'      },
  { value: 'free',    label: '🎁 Free'           },
]

const SORTS: { value: CourseSort; label: string }[] = [
  { value: 'relevance', label: 'Best for you'   },
  { value: 'rating',    label: 'Highest rated'  },
  { value: 'hours',     label: 'Shortest first' },
]

/* ── Single course card ────────────────────────────────────────────────────── */
function CourseCard({ course }: { course: Course }) {
  const isFree     = course.price_usd === 'Free'
  const gapPct     = course.gap_score ?? 0
  const gapVariant = gapPct >= 60 ? 'danger' : gapPct >= 30 ? 'warning' : 'success'

  const LEVEL_COLORS: Record<string, string> = {
    Beginner:     'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    Intermediate: 'text-brand-400 bg-brand-500/10 border-brand-500/25',
    Advanced:     'text-amber-400 bg-amber-500/10 border-amber-500/25',
    Expert:       'text-red-400 bg-red-500/10 border-red-500/25',
  }

  return (
    <Card hover className="flex flex-col gap-4 relative overflow-hidden">
      {/* Featured glow */}
      {course.is_featured && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/8 rounded-bl-full pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/12 border border-brand-500/20 flex items-center justify-center shrink-0">
            <BookOpen size={18} className="text-brand-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 font-medium">{course.platform}</p>
            <p className="text-[10px] text-slate-600">{course.provider}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={course.badge_color as any} className="text-[10px]">{course.domain}</Badge>
          {course.is_featured && (
            <Badge variant="warning" className="text-[9px]">
              <Star size={9} className="fill-amber-400 text-amber-400 mr-0.5" />Featured
            </Badge>
          )}
        </div>
      </div>

      {/* Title + description */}
      <div>
        <h3 className="text-white font-semibold text-sm leading-tight mb-1.5">{course.title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{course.description}</p>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1">
          <Star size={11} className="text-amber-400 fill-amber-400" />
          <span className="text-amber-400 font-medium">{course.rating}</span>
          <span>({(course.reviews / 1000).toFixed(1)}K)</span>
        </span>
        <span className="flex items-center gap-1"><Clock size={11} />{course.hours}h</span>
        <span className={clsx('px-1.5 py-0.5 rounded-md text-[10px] font-medium border', LEVEL_COLORS[course.level] ?? 'text-slate-400 bg-white/6 border-white/12')}>
          {course.level}
        </span>
        {course.certificate && (
          <span className="flex items-center gap-1 text-emerald-400/80">
            <Award size={10} />Certificate
          </span>
        )}
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1">
        {course.skills.slice(0, 5).map(s => (
          <span key={s} className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/6 text-slate-400 border border-white/10">
            {s}
          </span>
        ))}
        {course.skills.length > 5 && (
          <span className="text-[10px] text-slate-600">+{course.skills.length - 5}</span>
        )}
      </div>

      {/* Gap score bar */}
      {gapPct > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Skill gap coverage</span>
            <span className={clsx(
              'font-semibold',
              gapPct >= 60 ? 'text-red-400' : gapPct >= 30 ? 'text-amber-400' : 'text-emerald-400',
            )}>{gapPct}% gap</span>
          </div>
          <div className="w-full h-1 rounded-full bg-white/8">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-700',
                gapPct >= 60 ? 'bg-red-500' : gapPct >= 30 ? 'bg-amber-500' : 'bg-emerald-500',
              )}
              style={{ width: `${gapPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/8 mt-auto">
        <span className={clsx(
          'text-sm font-bold',
          isFree ? 'text-emerald-400' : 'text-white',
        )}>
          {isFree ? 'Free' : `$${course.price_usd}`}
        </span>
        <Button
          variant="primary"
          size="sm"
          rightIcon={<ExternalLink size={13} />}
          onClick={() => window.open(course.url, '_blank')}
        >
          Enroll
        </Button>
      </div>
    </Card>
  )
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function CoursesPage() {
  const navigate = useNavigate()
  const { courses, loading, courseFilter, courseSort, setCourseFilter, setCourseSort, refreshRecs } = useRecs()
  const { status: resumeStatus } = useResume()
  const hasParsed  = resumeStatus === 'done'

  const freeCount     = courses.filter(c => c.price_usd === 'Free').length
  const certCount     = courses.filter(c => c.certificate).length
  const highGapCount  = courses.filter(c => (c.gap_score ?? 0) >= 60).length

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={20} className="text-brand-400" />
            <h2 className="text-2xl font-bold text-white">Course Recommendations</h2>
            {hasParsed && <Badge variant="success" dot>Personalised</Badge>}
          </div>
          <p className="text-slate-400 text-sm">
            {hasParsed
              ? `Ranked by skill-gap coverage against your resume · ${courses.length} courses`
              : 'Upload your resume to get personalised course recommendations'}
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          leftIcon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
          onClick={refreshRecs}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* No-resume nudge */}
      {!hasParsed && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-amber-500/25 bg-amber-500/8">
          <Info size={16} className="text-amber-400 shrink-0" />
          <p className="text-amber-300 text-sm flex-1">
            Upload your resume to rank courses by skill gap — we'll highlight exactly what to learn next.
          </p>
          <Button variant="ghost" size="sm" leftIcon={<Upload size={14} />} onClick={() => navigate('/dashboard/resume')}
            className="shrink-0 text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/20">
            Upload
          </Button>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: BookOpen,    label: 'Total Courses',       value: courses.length,  color: 'text-brand-400',   bg: 'bg-brand-500/10'   },
          { icon: Award,       label: 'With Certificate',    value: certCount,       color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: TrendingUp,  label: 'High Gap Coverage',   value: highGapCount,    color: 'text-red-400',     bg: 'bg-red-500/10'     },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-3 flex items-center gap-3 border border-white/8`}>
            <Icon size={18} className={color} />
            <div>
              <div className={`text-xl font-bold font-display ${color}`}>{value}</div>
              <div className="text-slate-500 text-xs">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter + sort bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setCourseFilter(f.value)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                courseFilter === f.value
                  ? 'bg-brand-600/25 border-brand-500/50 text-brand-300'
                  : 'bg-white/4 border-white/10 text-slate-400 hover:text-white hover:border-white/20',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={courseSort}
            onChange={e => setCourseSort(e.target.value as CourseSort)}
            className={clsx(
              'h-8 pl-3 pr-7 rounded-xl text-xs border transition-all appearance-none cursor-pointer',
              'bg-white/5 text-slate-300 border-white/12',
              'focus:outline-none focus:ring-2 focus:ring-brand-500/50',
              '[&>option]:bg-[#1e293b]',
            )}
          >
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* ── Course grid ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/4 border border-white/8 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
            <BookOpen size={24} className="text-slate-600" />
          </div>
          <div>
            <p className="text-slate-400 font-medium">No courses match this filter</p>
            <button onClick={() => setCourseFilter('all')} className="text-brand-400 text-sm mt-1 hover:underline">Clear filters</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map(c => <CourseCard key={c.id} course={c} />)}
        </div>
      )}
    </div>
  )
}
