/**
 * RoadmapPage  (Milestone 4)
 * ───────────────────────────
 * AI-generated career roadmap:
 * – Vertical timeline with phase markers
 * – Per-milestone role, skill requirements, recommended courses
 * – Salary range estimates
 * – Current skill status vs skills to develop
 * – Linked course recommendations
 */
import { useNavigate } from 'react-router-dom'
import {
  Map, CheckCircle2, Circle, ChevronRight,
  DollarSign, Zap, BookOpen, TrendingUp, Clock,
  ArrowRight, Sparkles,
} from 'lucide-react'
import clsx from 'clsx'
import { Badge, Button, Card } from '../../components/ui'
import { useRecs } from '../../context/RecommendationsContext'
import { useResume } from '../../context/ResumeContext'
import { COURSES } from '../../data/coursesData'

export default function RoadmapPage() {
  const navigate  = useNavigate()
  const { roadmap, loading } = useRecs()
  const { resume, status }   = useResume()
  const hasParsed = status === 'done'

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Map size={20} className="text-brand-400" />
            <h2 className="text-2xl font-bold text-white">Career Roadmap</h2>
            <Badge variant="brand">AI Generated</Badge>
          </div>
          <p className="text-slate-400 text-sm">
            {hasParsed
              ? `Personalised path from ${resume?.current_role ?? 'current role'} to Staff-level AI engineering`
              : 'Your AI-generated progression path based on profile analysis'}
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          leftIcon={<BookOpen size={15} />}
          onClick={() => navigate('/dashboard/courses')}
        >
          View All Courses
        </Button>
      </div>

      {/* Timeline summary chips */}
      <div className="flex items-center gap-3 flex-wrap">
        {roadmap.map((m, i) => (
          <div key={m.id} className="flex items-center gap-2">
            <div
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium border',
                m.done
                  ? 'bg-brand-500/15 text-brand-300 border-brand-500/30'
                  : 'bg-white/5 text-slate-400 border-white/12',
              )}
            >
              {m.phase}
            </div>
            {i < roadmap.length - 1 && (
              <ArrowRight size={12} className="text-slate-600 shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Salary progression bar */}
      <Card className="bg-gradient-to-r from-brand-600/8 to-accent-600/5 border-brand-500/20">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} className="text-brand-400" />
          <span className="text-white font-semibold text-sm">Salary Progression</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {roadmap.map((m, i) => (
            <div key={m.id} className={clsx('text-center', m.done && 'opacity-100')}>
              <div className={clsx(
                'text-base font-bold font-display mb-0.5',
                m.done ? 'text-brand-400' : 'text-slate-400',
              )}>
                {m.salary.split('–')[0]}
              </div>
              <div className="text-[10px] text-slate-500">{m.phase}</div>
              <div className={clsx('w-full h-1 rounded-full mt-1.5', m.done ? 'bg-brand-500' : 'bg-white/10')} />
            </div>
          ))}
        </div>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-8 bottom-8 w-px bg-gradient-to-b from-brand-500/60 via-brand-500/20 to-transparent" />

        <div className="space-y-0">
          {roadmap.map((milestone, i) => {
            const linkedCourses = COURSES.filter(c => milestone.courses.includes(c.id))
            const isLast = i === roadmap.length - 1

            return (
              <div key={milestone.id} className="flex gap-5">
                {/* Timeline node */}
                <div className="flex flex-col items-center shrink-0 relative z-10">
                  <div className={clsx(
                    'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all',
                    milestone.done
                      ? 'bg-brand-600 border-brand-500 shadow-glow-sm'
                      : 'bg-[#0c0c18] border-white/20',
                  )}>
                    {milestone.done
                      ? <CheckCircle2 size={20} className="text-white" />
                      : <Circle size={16} className="text-slate-600" />
                    }
                  </div>
                </div>

                {/* Milestone card */}
                <div className={clsx('flex-1 pb-8', isLast && 'pb-0')}>
                  <Card className={clsx(
                    'transition-all',
                    milestone.done
                      ? 'border-brand-500/30 bg-brand-500/5'
                      : 'hover:border-white/15',
                  )}>
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant={milestone.done ? 'brand' : 'neutral'}>{milestone.phase}</Badge>
                          {milestone.done && <Badge variant="success" dot>Current</Badge>}
                          <span className="text-[10px] text-slate-500">· {milestone.timeline}</span>
                        </div>
                        <h3 className="text-white font-bold text-lg">{milestone.role}</h3>
                        <p className="text-slate-500 text-xs">{milestone.level}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
                          <DollarSign size={13} />
                          {milestone.salary}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">estimated</div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      {milestone.description}
                    </p>

                    {/* Skills you'll need */}
                    {milestone.skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                          Key skills at this level
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {milestone.skills.map(s => (
                            <span key={s} className="px-2 py-0.5 rounded-md text-xs bg-white/6 text-slate-300 border border-white/10">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills to gain */}
                    {milestone.skills_to_gain.length > 0 && (
                      <div className="mb-4 p-3 rounded-xl bg-amber-500/6 border border-amber-500/15">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Zap size={12} className="text-amber-400" />
                          <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">
                            Gap to close
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {milestone.skills_to_gain.map(s => (
                            <span key={s} className="px-2 py-0.5 rounded-md text-xs bg-amber-500/10 text-amber-300/80 border border-amber-500/15">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Linked courses */}
                    {linkedCourses.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wide mb-2">
                          Recommended courses
                        </p>
                        <div className="space-y-2">
                          {linkedCourses.map(c => (
                            <div
                              key={c.id}
                              onClick={() => navigate('/dashboard/courses')}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-500/8 border border-brand-500/15 hover:border-brand-500/30 hover:bg-brand-500/12 transition-all cursor-pointer group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0">
                                <BookOpen size={13} className="text-brand-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">{c.title}</p>
                                <p className="text-slate-500 text-[10px]">{c.platform} · {c.hours}h</p>
                              </div>
                              <ChevronRight size={13} className="text-slate-600 group-hover:text-brand-400 transition-colors shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA for future milestones */}
                    {!milestone.done && milestone.skills_to_gain.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/8">
                        <Button
                          variant="outline"
                          size="sm"
                          rightIcon={<ChevronRight size={14} />}
                          onClick={() => navigate('/dashboard/courses')}
                        >
                          Find courses for this milestone
                        </Button>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-r from-brand-600/8 to-transparent p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-brand-400" />
          </div>
          <div>
            <p className="text-white font-semibold">Explore job opportunities at each stage</p>
            <p className="text-slate-400 text-sm">See which companies are hiring for your next role right now.</p>
          </div>
        </div>
        <Button
          variant="primary"
          rightIcon={<ChevronRight size={16} />}
          onClick={() => navigate('/dashboard/jobs')}
        >
          View Job Matches
        </Button>
      </div>
    </div>
  )
}
