import { useNavigate } from 'react-router-dom'
import {
  Briefcase, BookOpen, FlaskConical, TrendingUp,
  Upload, ChevronRight, ArrowUpRight, CheckCircle2,
} from 'lucide-react'
import { Card, Badge, Button } from '../../components/ui'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { useResume } from '../../context/ResumeContext'
import { useJobs } from '../../context/JobsContext'
import { MatchRing } from '../../components/jobs/MatchRing'

const domainData = [
  { domain: 'Software Eng', score: 92 },
  { domain: 'Cloud/DevOps', score: 78 },
  { domain: 'Data Science', score: 65 },
  { domain: 'ML/AI',        score: 71 },
  { domain: 'Cybersecurity',score: 40 },
  { domain: 'Product Mgmt', score: 55 },
]

export default function Overview() {
  const navigate  = useNavigate()
  const { status, resume } = useResume()
  const { jobs, loading }  = useJobs()
  const hasParsed = status === 'done' && resume !== null

  const topJobs       = jobs.slice(0, 4)
  const excellentCount = jobs.filter(j => j.match_score >= 85).length

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome banner — adapts to resume state */}
      {hasParsed ? (
        <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-emerald-500/20 bg-gradient-to-r from-emerald-600/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <CheckCircle2 size={22} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Welcome back, {resume.full_name.split(' ')[0]}! 👋</h2>
              <p className="text-slate-400 text-sm">
                Resume parsed · <span className="text-emerald-400 font-medium">{resume.skill_count} skills</span> detected ·{' '}
                <span className="text-emerald-400 font-medium">Profile {resume.parse_quality_score}% quality</span>
              </p>
            </div>
          </div>
          <Button variant="primary" rightIcon={<ChevronRight size={16} />} onClick={() => navigate('/dashboard/jobs')}>
            See Job Matches
          </Button>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-brand-500/20 bg-gradient-to-r from-brand-600/10 to-transparent">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Welcome back! 👋</h2>
            <p className="text-slate-400 text-sm">
              Your profile is <span className="text-amber-400 font-medium">60% complete</span>.
              Upload your resume to unlock all recommendations.
            </p>
          </div>
          <Button variant="primary" leftIcon={<Upload size={16} />} onClick={() => navigate('/dashboard/resume')}>
            Upload Resume
          </Button>
        </div>
      )}

      {/* Stats row — live from JobsContext */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Briefcase,    label: 'Job Matches',      value: String(jobs.length),       sub: `${excellentCount} excellent`,  color: 'text-brand-400',   bg: 'bg-brand-500/10', href: '/dashboard/jobs'      },
          { icon: BookOpen,     label: 'Courses Found',    value: '23',                       sub: '8 recommended',                color: 'text-emerald-400', bg: 'bg-emerald-500/10', href: '/dashboard/courses'   },
          { icon: FlaskConical, label: 'Research Domains', value: '5',                        sub: 'Active matches',               color: 'text-accent-400',  bg: 'bg-accent-500/10', href: '/dashboard/research'  },
          { icon: TrendingUp,   label: 'Best Match',       value: jobs[0] ? `${jobs[0].match_score}%` : '—', sub: jobs[0]?.company_name ?? 'Upload resume', color: 'text-amber-400', bg: 'bg-amber-500/10', href: '/dashboard/analytics' },
        ].map(({ icon: Icon, label, value, sub, color, bg, href }) => (
          <Card key={label} hover onClick={() => navigate(href)} className="flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <div className={`text-2xl font-bold font-display ${color}`}>{value}</div>
              <div className="text-white text-sm font-medium">{label}</div>
              <div className="text-slate-500 text-xs mt-0.5">{sub}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top job matches — live */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Top Job Matches</h3>
            <button
              onClick={() => navigate('/dashboard/jobs')}
              className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/4 border border-white/8 animate-pulse" />
                ))
              : topJobs.map((job) => (
                  <Card
                    key={job.job_id}
                    hover
                    padding="sm"
                    onClick={() => navigate('/dashboard/jobs')}
                    className="flex items-center gap-4"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs shrink-0">
                      {job.company_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{job.title}</div>
                      <div className="text-slate-500 text-xs">{job.company_name} · {job.location}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <MatchRing score={job.match_score} size={38} stroke={3} />
                      <ArrowUpRight size={14} className="text-slate-500" />
                    </div>
                  </Card>
                ))
            }
          </div>
        </div>

        {/* Domain radar */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold">Domain Alignment</h3>
          <Card className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={domainData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="domain" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Upload Resume',   icon: Upload,      color: 'text-brand-400',   href: '/dashboard/resume'   },
            { label: 'Browse Jobs',     icon: Briefcase,   color: 'text-emerald-400', href: '/dashboard/jobs'     },
            { label: 'Explore Courses', icon: BookOpen,    color: 'text-amber-400',   href: '/dashboard/courses'  },
            { label: 'Research Areas',  icon: FlaskConical,color: 'text-accent-400',  href: '/dashboard/research' },
          ].map(({ label, icon: Icon, color, href }) => (
            <Card key={label} hover padding="sm" onClick={() => navigate(href)} className="flex items-center gap-3">
              <Icon size={18} className={color} />
              <span className="text-sm text-slate-300 font-medium">{label}</span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}