import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchComplaints } from '../api'
import PriorityBadge from '../components/PriorityBadge'
import StatCard from '../components/StatCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { RefreshCw, Eye } from 'lucide-react'

const BAR_COLORS = { Critical: '#FF3B3B', High: '#FF9500', Medium: '#FFD60A', Low: '#30D158' }
const STATUS_TABS  = ['All', 'Pending', 'Resolved', 'Escalated']
const DEPARTMENTS  = ['All', 'Billing', 'Technical Support', 'Security', 'General']

const DEPT_META = {
  'All':               { icon: '◈', label: 'All Departments'  },
  'Billing':           { icon: '₿', label: 'Billing'          },
  'Technical Support': { icon: '⌬', label: 'Technical Support'},
  'Security':          { icon: '◉', label: 'Security'         },
  'General':           { icon: '◎', label: 'General'          },
}

// active dept styling — maps to existing Tailwind tokens in your config
const DEPT_ACTIVE = {
  'All':               'bg-ink-700           border-ink-500          text-slate-300',
  'Billing':           'bg-signal-yellow/10  border-signal-yellow/40 text-signal-yellow',
  'Technical Support': 'bg-signal-cyan/10    border-signal-cyan/40   text-signal-cyan',
  'Security':          'bg-signal-red/10     border-signal-red/40    text-signal-red',
  'General':           'bg-signal-blue/10    border-signal-blue/40   text-signal-blue',
}

const DEPT_IDLE = 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-ink-800/60'

export default function Dashboard() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeDept, setActiveDept] = useState('All')
  const [activeTab, setActiveTab]   = useState('All')
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

  // ── filter by active department first ──────────────────────────────────
  const deptComplaints = activeDept === 'All'
    ? complaints
    : complaints.filter(c => c.department === activeDept)

  // ── then filter by status tab ──────────────────────────────────────────
  const filtered = activeTab === 'All'
    ? deptComplaints
    : deptComplaints.filter(c => c.status === activeTab)

  // ── stat counts (always relative to active dept) ───────────────────────
  const total     = deptComplaints.length
  const pending   = deptComplaints.filter(c => c.status === 'Pending').length
  const resolved  = deptComplaints.filter(c => c.status === 'Resolved').length
  const escalated = deptComplaints.filter(c => c.status === 'Escalated').length

  // ── bar chart data (relative to active dept) ───────────────────────────
  const counts = ['Critical','High','Medium','Low'].map(p => ({
    priority: p,
    count: deptComplaints.filter(c => c.priority === p).length,
  }))

  // ── per-dept pending count for the pulse dot ───────────────────────────
  function deptPending(dept) {
    const base = dept === 'All' ? complaints : complaints.filter(c => c.department === dept)
    return base.filter(c => c.status === 'Pending').length
  }

  const getPriorityChange = (log) => {
    const match = log.match(/priority[:\s]+(\w+)\s*[→\->]+\s*(\w+)/i)
    return match ? { from: match[1], to: match[2] } : null
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

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 animate-fade-up opacity-0"
        style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="font-display text-2xl font-800 text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time complaint monitoring</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-ink-800 hover:bg-ink-700 border border-ink-600 rounded-lg text-sm text-slate-300 transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Department tabs ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 mb-6 p-1.5 bg-ink-900 rounded-2xl border border-ink-700 w-fit">
        {DEPARTMENTS.map(dept => {
          const isActive = activeDept === dept
          const hasPending = deptPending(dept) > 0
          const totalForDept = dept === 'All'
            ? complaints.length
            : complaints.filter(c => c.department === dept).length
          return (
            <button
              key={dept}
              onClick={() => { setActiveDept(dept); setActiveTab('All') }}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200
                ${isActive ? DEPT_ACTIVE[dept] : DEPT_IDLE}`}
            >
              <span>{DEPT_META[dept].icon}</span>
              <span className="font-body">{dept}</span>
              {totalForDept > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono
                  ${isActive ? 'bg-black/20' : 'bg-ink-700 text-slate-500'}`}>
                  {totalForDept}
                </span>
              )}
              {/* pulse dot when dept has pending items */}
              {hasPending && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-signal-blue animate-pulse-dot" />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Stat cards (update when dept changes) ───────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total"     value={total}     sub={activeDept === 'All' ? 'all departments' : activeDept} accent="blue"  delay={0}   />
        <StatCard label="Pending"   value={pending}   sub="awaiting action"  accent="amber" delay={100} />
        <StatCard label="Resolved"  value={resolved}  sub="closed"           accent="green" delay={200} />
        <StatCard label="Escalated" value={escalated} sub="priority changed"  accent="red"   delay={300} />
      </div>

      {/* ── Chart + Table ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Bar Chart — updates per dept */}
        <div className="col-span-1 bg-ink-900 border border-ink-700 rounded-xl p-5 animate-fade-up opacity-0"
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">
            Priority Distribution
          </p>
          <p className="text-xs font-mono text-slate-600 mb-4">
            {activeDept === 'All' ? 'All departments' : activeDept}
          </p>
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
        <div className="col-span-2 bg-ink-900 border border-ink-700 rounded-xl overflow-hidden animate-fade-up opacity-0"
          style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>

          {/* Status tabs */}
          <div className="flex items-center border-b border-ink-700">
            {STATUS_TABS.map(tab => {
              const tabCount = tab === 'All' ? total
                : tab === 'Pending'   ? pending
                : tab === 'Resolved'  ? resolved
                : escalated
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3.5 text-xs font-mono uppercase tracking-widest transition-colors border-b-2 -mb-px
                    ${activeTab === tab
                      ? 'text-signal-blue border-signal-blue'
                      : 'text-slate-500 border-transparent hover:text-slate-300'
                    }`}>
                  {tab}
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab ? 'bg-signal-blue/20 text-signal-blue' : 'bg-ink-700 text-slate-500'
                  }`}>
                    {tabCount}
                  </span>
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600 text-sm gap-2">
              <span className="text-2xl">{DEPT_META[activeDept].icon}</span>
              <span>No {activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '}complaints
                {activeDept !== 'All' ? ` in ${activeDept}` : ''}
              </span>
            </div>
          ) : (
            <div className="divide-y divide-ink-700 max-h-80 overflow-y-auto">
              {filtered.map((c) => {
                const change = getPriorityChange(c.trace_log)
                return (
                  <div key={c.id} onClick={() => navigate(`/complaints/${c.id}`)}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-ink-800 cursor-pointer transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{c.text}</p>
                      <p className="text-xs text-slate-600 font-mono mt-0.5">
                        {c.customer_id} · {c.department}
                      </p>
                    </div>

                    {c.status === 'Escalated' && change ? (
                      <div className="flex items-center gap-1 text-xs font-mono">
                        <span className="text-slate-500">{change.from}</span>
                        <span className="text-signal-amber">→</span>
                        <span className="text-signal-red font-bold">{change.to}</span>
                      </div>
                    ) : (
                      <PriorityBadge priority={c.priority} />
                    )}

                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                      c.status === 'Resolved'  ? 'text-signal-green border-signal-green/30 bg-signal-green/10'  :
                      c.status === 'Escalated' ? 'text-signal-amber border-signal-amber/30 bg-signal-amber/10'  :
                      'text-slate-500 border-ink-600 bg-ink-700'
                    }`}>{c.status}</span>

                    <button title="View"
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-signal-blue/20 text-slate-500 hover:text-signal-blue transition-all">
                      <Eye size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
