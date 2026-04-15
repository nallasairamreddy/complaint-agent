export default function StatCard({ label, value, sub, accent = 'blue', delay = 0 }) {
  const accents = {
    blue:   'from-signal-blue/20 to-transparent border-signal-blue/20   text-signal-blue',
    red:    'from-signal-red/20  to-transparent border-signal-red/20    text-signal-red',
    amber:  'from-signal-amber/20 to-transparent border-signal-amber/20 text-signal-amber',
    green:  'from-signal-green/20 to-transparent border-signal-green/20 text-signal-green',
  }
  const cls = accents[accent] || accents.blue
  return (
    <div
      className={`bg-gradient-to-br ${cls} border rounded-xl p-5 animate-fade-up opacity-0`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-display font-800 ${cls.split(' ').at(-1)}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}
