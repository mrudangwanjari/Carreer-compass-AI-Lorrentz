import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { Card } from '../../components/ui'

const matchData = [
  { name: 'P@10', LorentzFM: 93.77, SBERT: 80.78, BERT: 0 },
  { name: 'MRR',  LorentzFM: 95.54, SBERT: 84.78, BERT: 0 },
  { name: 'NDCG', LorentzFM: 94.0,  SBERT: 88.57, BERT: 0 },
  { name: 'Hit@10',LorentzFM:96.05, SBERT: 96.80, BERT: 0 },
]

const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Analytics</h2>
        <p className="text-slate-400 text-sm">Model performance metrics from the CareerCompass AI research baselines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-white font-semibold mb-4">Ranking Metrics Comparison</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={matchData} barGap={4}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
              <Bar dataKey="SBERT"     fill="#818cf8" radius={[4,4,0,0]} />
              <Bar dataKey="LorentzFM" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-end text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-brand-400 inline-block"/></span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-brand-600 inline-block"/> LorentzFM</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-400 inline-block"/> SBERT</span>
          </div>
        </Card>

        <Card>
          <h3 className="text-white font-semibold mb-1">LorentzFM Training Loss</h3>
          <p className="text-slate-500 text-xs mb-4">BPR loss over 26 epochs — early stopping at epoch 16</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={[
              {e:1,loss:0.157},{e:2,loss:0.095},{e:3,loss:0.085},{e:4,loss:0.081},
              {e:5,loss:0.071},{e:6,loss:0.068},{e:7,loss:0.062},{e:8,loss:0.060},
              {e:9,loss:0.055},{e:10,loss:0.057},{e:11,loss:0.055},{e:12,loss:0.052},
              {e:13,loss:0.054},{e:14,loss:0.055},{e:15,loss:0.053},{e:16,loss:0.053},
            ]}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="e" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Epoch', fill:'#64748b', fontSize:11, position:'insideBottom', offset:-2}} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0.04, 0.17]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toFixed(4), 'Loss']} />
              <Line dataKey="loss" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
