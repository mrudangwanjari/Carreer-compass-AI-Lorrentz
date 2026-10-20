/**
 * ProfileSummary
 * ──────────────
 * The "hero" card at the top of the Resume page: avatar, name, role,
 * location, contact, parse-quality badge, and a headline summary.
 */
import {
  MapPin, Mail, Phone, Briefcase, GraduationCap,
  Clock, Award, Star, CheckCircle2,
} from 'lucide-react'
import { Badge } from '../ui'
import type { ParsedResume } from '../../context/ResumeContext'

interface ProfileSummaryProps {
  resume: ParsedResume
}

function QualityRing({ score }: { score: number }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" />
        <circle
          cx="28" cy="28" r={r}
          stroke={color} strokeWidth="4" fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
        {score}
      </span>
    </div>
  )
}

export function ProfileSummary({ resume }: ProfileSummaryProps) {
  const initials = resume.full_name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const qualityVariant = resume.parse_quality_score >= 80
    ? 'success' : resume.parse_quality_score >= 60
    ? 'warning' : 'danger'

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/6 to-white/3 backdrop-blur-sm overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-brand-500 via-accent-500 to-brand-500" />

      <div className="p-6 sm:p-8">
        {/* Top row: avatar + name + quality */}
        <div className="flex items-start gap-5 mb-6">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-600 flex items-center justify-center text-xl font-bold text-white shadow-glow-sm shrink-0">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-white leading-tight">{resume.full_name}</h2>
                <p className="text-brand-400 font-medium mt-0.5">{resume.current_role}</p>
              </div>
              {/* Parse quality */}
              <div className="flex items-center gap-2.5 shrink-0">
                <QualityRing score={resume.parse_quality_score} />
                <div>
                  <p className="text-xs text-slate-500 leading-none mb-1">Parse quality</p>
                  <Badge variant={qualityVariant} dot>
                    {resume.parse_quality_score >= 80 ? 'Excellent'
                     : resume.parse_quality_score >= 60 ? 'Good' : 'Fair'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contact row */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm text-slate-400">
              {resume.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-500 shrink-0" />
                  {resume.location}
                </span>
              )}
              {resume.email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-500 shrink-0" />
                  {resume.email}
                </span>
              )}
              {resume.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-500 shrink-0" />
                  {resume.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Clock,          label: 'Experience',  value: `${resume.years_experience} yrs`,  color: 'text-brand-400',   bg: 'bg-brand-500/10'   },
            { icon: Briefcase,      label: 'Seniority',   value: resume.seniority_level,             color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: GraduationCap,  label: 'Education',   value: resume.education_level,             color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
            { icon: Award,          label: 'Certs',       value: `${resume.cert_count} found`,       color: 'text-accent-400',  bg: 'bg-accent-500/10'  },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl px-3 py-2.5 flex items-center gap-2.5`}>
              <Icon size={16} className={`${color} shrink-0`} />
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] leading-none mb-0.5 uppercase tracking-wide">{label}</p>
                <p className={`text-sm font-semibold ${color} truncate`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {resume.summary && (
          <div className="border-t border-white/8 pt-5">
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-brand-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Professional Summary</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{resume.summary}</p>
          </div>
        )}
      </div>
    </div>
  )
}
