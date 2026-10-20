/**
 * SkillChart
 * ──────────
 * Renders a horizontal bar chart of skill categories derived from
 * the parsed tech_skills list, plus a tag cloud for individual skills.
 */
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

interface SkillChartProps {
  skills: string[]
}

/* Very simple keyword → category mapping */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Languages':     ['Python','TypeScript','JavaScript','Java','Go','Rust','C++','C#','Ruby','Swift','Kotlin','R','Scala','SQL','Bash','Shell'],
  'Frontend':      ['React','Angular','Vue','HTML','CSS','Tailwind','Redux','Next.js','Svelte','Webpack','Vite','jQuery'],
  'Backend':       ['Node.js','FastAPI','Django','Flask','Express','Spring','Rails','GraphQL','REST','gRPC','Kafka','RabbitMQ'],
  'ML / AI':       ['PyTorch','TensorFlow','scikit-learn','BERT','Transformers','LangChain','MLflow','Hugging Face','Keras','XGBoost','FAISS'],
  'Cloud / DevOps':['AWS','GCP','Azure','Docker','Kubernetes','Terraform','Helm','CI/CD','Airflow','Spark','Databricks','Jenkins','GitHub Actions'],
  'Data':          ['PostgreSQL','MySQL','MongoDB','Redis','Kafka','Cassandra','DynamoDB','BigQuery','Snowflake','dbt','Pandas','NumPy'],
}

function categoriseSkills(skills: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    counts[cat] = skills.filter(s =>
      keywords.some(k => s.toLowerCase().includes(k.toLowerCase())),
    ).length
  }
  return counts
}

const TOOLTIP_STYLE = {
  background: '#1e293b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
}

const CATEGORY_COLORS: Record<string, string> = {
  'Languages':      'bg-brand-500/15 text-brand-300 border-brand-500/25',
  'Frontend':       'bg-sky-500/15 text-sky-300 border-sky-500/25',
  'Backend':        'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  'ML / AI':        'bg-accent-500/15 text-accent-300 border-accent-500/25',
  'Cloud / DevOps': 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  'Data':           'bg-rose-500/15 text-rose-300 border-rose-500/25',
}

function categoryOf(skill: string): string {
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => skill.toLowerCase().includes(k.toLowerCase()))) return cat
  }
  return 'Other'
}

export function SkillChart({ skills }: SkillChartProps) {
  const counts = categoriseSkills(skills)
  const radarData = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([cat, count]) => ({ cat: cat.split(' /')[0], count }))

  return (
    <div className="space-y-6">
      {/* Radar */}
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="cat"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <Radar
              dataKey="count"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => [`${v} skills`, 'Count']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Category bars */}
      <div className="space-y-2.5">
        {Object.entries(counts)
          .filter(([, v]) => v > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([cat, count]) => {
            const max = Math.max(...Object.values(counts))
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-28 shrink-0">{cat}</span>
                <div className="flex-1 h-2 rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-700"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-6 text-right shrink-0">{count}</span>
              </div>
            )
          })}
      </div>
    </div>
  )
}

/* ── Skill tag cloud ─────────────────────────────────────────────────────────── */
export function SkillTagCloud({ skills }: { skills: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map(skill => {
        const cat = categoryOf(skill)
        const color = CATEGORY_COLORS[cat] ?? 'bg-white/8 text-slate-300 border-white/15'
        return (
          <span
            key={skill}
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${color}`}
          >
            {skill}
          </span>
        )
      })}
    </div>
  )
}
