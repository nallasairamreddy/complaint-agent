import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchComplaints, resolveComplaint } from '../api'
import PriorityBadge from '../components/PriorityBadge'
import StatCard from '../components/StatCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { RefreshCw, CheckCircle, Eye } from 'lucide-react'

const BAR_COLORS = { Critical: '#FF3B3B', High: '#FF9500', Medium: '#FFD60A', Low: '#30D158' }

export default function Dashboard() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await fetchComplaints()
      setComplaints(data)
    } catch {
      // backend not reachable
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const counts = ['Critical','High','Medium','Low'].map(p => ({
    priority: p,
    count: complaints.filter(c => c.priority === p).length,
  }))

  const total    = complaints.length
  const pending  = complaints.filter(c => c.status === 'Pending').length
  const resolved = complaints.filter(c => c.status === 'Resolved').length
  const critical = complaints.filter(c => c.priority === 'Critical').length

  const handleResolve = async (e, id) => {
    e.stopPropagation()
    await resolveComplaint(id)
    load()
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-xs font-mono">
        <span className="text-slate-400">{payload[0].payload.priority}: </span>
        <span className="text-white font-bold">{payload[0].value}</span>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="font-display text-2xl font-800 text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time complaint monitoring</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-ink-800 hover:bg-ink-700 border border-ink-600 rounded-lg text-sm text-slate-300 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total"    value={total}    sub="all time"         accent="blue"  delay={0}   />
        <StatCard label="Pending"  value={pending}  sub="awaiting action"  accent="amber" delay={100} />
        <StatCard label="Critical" value={critical} sub="need attention"   accent="red"   delay={200} />
        <StatCard label="Resolved" value={resolved} sub="closed"           accent="green" delay={300} />
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="col-span-1 bg-ink-900 border border-ink-700 rounded-xl p-5 animate-fade-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Priority Distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={counts} barSize={28}>
              <XAxis dataKey="priority" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {counts.map((entry) => (
                  <Cell key={entry.priority} fill={BAR_COLORS[entry.priority]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Complaints Table */}
        <div className="col-span-2 bg-ink-900 border border-ink-700 rounded-xl overflow-hidden animate-fade-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <div className="px-5 py-4 border-b border-ink-700 flex items-center justify-between">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Recent Complaints</p>
            <span className="text-xs text-slate-600 font-mono">{total} total</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">Loading...</div>
          ) : complaints.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">No complaints yet</div>
          ) : (
            <div className="divide-y divide-ink-700 max-h-80 overflow-y-auto">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/complaints/${c.id}`)}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-ink-800 cursor-pointer transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{c.text}</p>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">{c.customer_id} · {c.department}</p>
                  </div>
                  <PriorityBadge priority={c.priority} />
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                    c.status === 'Resolved'  ? 'text-signal-green  border-signal-green/30  bg-signal-green/10'  :
                    c.status === 'Escalated' ? 'text-signal-amber  border-signal-amber/30  bg-signal-amber/10'  :
                    'text-slate-500 border-ink-600 bg-ink-700'
                  }`}>{c.status}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleResolve(e, c.id)} title="Resolve"
                      className="p-1.5 rounded-lg hover:bg-signal-green/20 text-slate-500 hover:text-signal-green transition-colors">
                      <CheckCircle size={14} />
                    </button>
                    <button title="View" className="p-1.5 rounded-lg hover:bg-signal-blue/20 text-slate-500 hover:text-signal-blue transition-colors">
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
