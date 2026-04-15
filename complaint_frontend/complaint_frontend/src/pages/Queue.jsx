import { useEffect, useState } from 'react'
import { fetchQueue, fetchNextItem } from '../api'
import PriorityBadge from '../components/PriorityBadge'
import { RefreshCw, ArrowRight, Inbox } from 'lucide-react'

const RANK_LABELS = { 0: 'Critical', 1: 'High', 2: 'Medium', 3: 'Low' }

export default function Queue() {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [popped, setPopped]   = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await fetchQueue()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    const { data } = await fetchNextItem()
    setPopped(data)
    load()
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="font-display text-2xl font-800 text-white">Priority Queue</h1>
          <p className="text-slate-500 text-sm mt-1">Complaints ordered by urgency — Critical first</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-ink-800 hover:bg-ink-700 border border-ink-600 rounded-lg text-sm text-slate-300 transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 bg-signal-blue hover:bg-signal-blue/90 rounded-lg text-sm text-white font-display font-600 transition-all">
            <ArrowRight size={14} />
            Pop Next
          </button>
        </div>
      </div>

      {/* Popped result */}
      {popped && (
        <div className="mb-6 bg-signal-green/10 border border-signal-green/30 rounded-xl px-5 py-4 animate-slide-in opacity-0" style={{ animationFillMode: 'forwards' }}>
          {popped.message
            ? <p className="text-slate-400 text-sm font-mono">{popped.message}</p>
            : <p className="text-signal-green text-sm font-mono">
                ✓ Popped complaint <span className="text-white font-bold">#{popped.complaint_id}</span>
                {' '}— {popped.data?.customer_id} → {popped.data?.department}
              </p>
          }
        </div>
      )}

      {/* Queue list */}
      <div className="bg-ink-900 border border-ink-700 rounded-xl overflow-hidden animate-fade-up opacity-0"
        style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
        <div className="px-5 py-4 border-b border-ink-700 flex items-center justify-between">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Queue Items</p>
          <span className="text-xs text-slate-600 font-mono">{items.length} pending</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-600 text-sm">Loading...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600 gap-2">
            <Inbox size={24} />
            <p className="text-sm">Queue is empty</p>
          </div>
        ) : (
          <div className="divide-y divide-ink-700">
            {items.map((item, idx) => (
              <div key={item.complaint_id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-ink-800 transition-colors animate-fade-up opacity-0"
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'forwards' }}>
                {/* Position */}
                <span className="w-7 h-7 rounded-full bg-ink-700 border border-ink-600 flex items-center justify-center text-xs font-mono text-slate-400">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-white font-mono">Complaint #{item.complaint_id}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{item.data?.customer_id} · {item.data?.department}</p>
                </div>
                <PriorityBadge priority={RANK_LABELS[item.rank] || 'Low'} />
                <span className="text-xs font-mono text-slate-600">rank {item.rank}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
