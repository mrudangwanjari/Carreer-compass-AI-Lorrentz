/**
 * ProfileSections
 * ───────────────
 * Modular cards for Education, Work Experience, Certifications,
 * and Industries extracted from the parsed resume.
 */
import {
  GraduationCap, Briefcase, Award, BarChart3,
  Building2, CheckCircle2, BookOpen, Globe,
} from 'lucide-react'
import { Card } from '../ui'
import type { ParsedResume } from '../../context/ResumeContext'

interface SectionProps { resume: ParsedResume }

/* ── Education ──────────────────────────────────────────────────────────────── */
export function EducationSection({ resume }: SectionProps) {
  const stars = resume.education_score          // 1–4
  return (
    <Card>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <GraduationCap size={16} className="text-amber-400" />
        </div>
        <h3 className="text-white font-semibold">Education</h3>
        {/* Edu score dots */}
        <div className="flex gap-1 ml-auto">
          {[1,2,3,4].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i <= stars ? 'bg-amber-400' : 'bg-white/12'}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {resume.degrees.length > 0 ? (
          resume.degrees.map((deg, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen size={13} className="text-amber-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{deg}</p>
                {resume.universities[i] && (
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                    <Building2 size={11} />
                    {resume.universities[i]}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-sm">No degree information extracted.</p>
        )}
      </div>
    </Card>
  )
}

/* ── Experience ─────────────────────────────────────────────────────────────── */
export function ExperienceSection({ resume }: SectionProps) {
  return (
    <Card>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
          <Briefcase size={16} className="text-brand-400" />
        </div>
        <h3 className="text-white font-semibold">Work Experience</h3>
        <span className="ml-auto text-xs text-brand-400 font-medium bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
          {resume.years_experience} years
        </span>
      </div>

      <div className="space-y-3">
        {resume.companies.map((company, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Building2 size={13} className="text-brand-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">{company}</p>
              {resume.job_titles_found[i] && (
                <p className="text-slate-500 text-xs mt-0.5">{resume.job_titles_found[i]}</p>
              )}
            </div>
          </div>
        ))}

        {resume.companies.length === 0 && (
          <p className="text-slate-500 text-sm">No company history extracted.</p>
        )}
      </div>
    </Card>
  )
}

/* ── Certifications ─────────────────────────────────────────────────────────── */
export function CertificationsSection({ resume }: SectionProps) {
  return (
    <Card>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-accent-500/15 flex items-center justify-center">
          <Award size={16} className="text-accent-400" />
        </div>
        <h3 className="text-white font-semibold">Certifications</h3>
        <span className="ml-auto text-xs text-accent-400 font-medium bg-accent-500/10 px-2 py-0.5 rounded-full border border-accent-500/20">
          {resume.cert_count}
        </span>
      </div>

      {resume.certifications.length > 0 ? (
        <div className="space-y-2.5">
          {resume.certifications.map((cert, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <CheckCircle2 size={15} className="text-accent-400 shrink-0" />
              <span className="text-slate-300 text-sm">{cert}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm">No certifications found.</p>
      )}
    </Card>
  )
}

/* ── Industries ─────────────────────────────────────────────────────────────── */
export function IndustriesSection({ resume }: SectionProps) {
  const colors = [
    'bg-brand-500/15 text-brand-300 border-brand-500/25',
    'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    'bg-amber-500/15 text-amber-300 border-amber-500/25',
    'bg-rose-500/15 text-rose-300 border-rose-500/25',
    'bg-sky-500/15 text-sky-300 border-sky-500/25',
    'bg-accent-500/15 text-accent-300 border-accent-500/25',
  ]

  return (
    <Card>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
          <Globe size={16} className="text-emerald-400" />
        </div>
        <h3 className="text-white font-semibold">Industries</h3>
      </div>

      {resume.industries_mentioned.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {resume.industries_mentioned.map((ind, i) => (
            <span
              key={i}
              className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium border ${colors[i % colors.length]}`}
            >
              {ind}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm">No industries extracted.</p>
      )}
    </Card>
  )
}

/* ── Summary stats bar ──────────────────────────────────────────────────────── */
export function ProfileStatsBar({ resume }: SectionProps) {
  const stats = [
    { icon: BarChart3,   label: 'Skills',        value: resume.skill_count,        color: 'text-brand-400'   },
    { icon: Award,       label: 'Certifications', value: resume.cert_count,         color: 'text-accent-400'  },
    { icon: Briefcase,   label: 'Companies',      value: resume.companies.length,   color: 'text-emerald-400' },
    { icon: BookOpen,    label: 'Degrees',        value: resume.degrees.length,     color: 'text-amber-400'   },
    { icon: Globe,       label: 'Industries',     value: resume.industries_mentioned.length, color: 'text-sky-400' },
  ]

  return (
    <div className="grid grid-cols-5 gap-3">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/4 border border-white/8"
        >
          <Icon size={16} className={color} />
          <span className={`text-xl font-bold font-display ${color}`}>{value}</span>
          <span className="text-slate-600 text-[10px] text-center leading-tight">{label}</span>
        </div>
      ))}
    </div>
  )
}
