import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, tint }: { label: string; value: string | number; tint: string }) {
  return (
    <div className={`liquid-glass ${tint}`} style={{ borderRadius: 14, padding: '20px 24px', flex: 1 }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', fontFamily: 'var(--font-code)' }}>{value}</div>
    </div>
  )
}

// ── Real heatmap from /users/activity ─────────────────────────────────────────
function ActivityHeatmap({ activity }: { activity: Record<string, number> }) {
  const today = new Date()
  const days: { date: Date; count: number }[] = []

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({ date: d, count: activity[key] || 0 })
  }

  const maxCount = Math.max(...days.map(d => d.count), 1)

  function cellColor(count: number) {
    if (count === 0) return 'rgba(255,255,255,0.04)'
    const t = count / maxCount
    if (t < 0.25) return 'rgba(16,185,129,0.25)'
    if (t < 0.5)  return 'rgba(16,185,129,0.5)'
    if (t < 0.75) return 'rgba(16,185,129,0.75)'
    return '#10B981'
  }

  const totalThisYear = days.reduce((s, d) => s + d.count, 0)

  return (
    <div className="liquid-glass" style={{ borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Activity</h3>
        <span className="liquid-pill liquid-glass-green" style={{ color: '#10B981', fontSize: '0.75rem' }}>
          {totalThisYear} submissions this year
        </span>
      </div>

      {/* Weeks grid — 53 columns × 7 rows */}
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto' }}>
        {Array.from({ length: 53 }, (_, w) => (
          <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {Array.from({ length: 7 }, (_, d) => {
              const idx = w * 7 + d
              if (idx >= days.length) return <div key={d} style={{ width: 11, height: 11 }} />
              const cell = days[idx]
              return (
                <div
                  key={d}
                  title={`${cell.date.toDateString()}: ${cell.count} submission${cell.count !== 1 ? 's' : ''}`}
                  style={{
                    width: 11, height: 11, borderRadius: 2,
                    background: cellColor(cell.count),
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    cursor: cell.count > 0 ? 'pointer' : 'default',
                  }}
                  onMouseEnter={e => {
                    if (cell.count > 0) {
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1.5)'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 6px rgba(16,185,129,0.6)'
                    }
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLElement).style.transform = ''
                    ;(e.currentTarget as HTMLElement).style.boxShadow = ''
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 12, fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>
        Less
        {['rgba(255,255,255,0.04)', 'rgba(16,185,129,0.25)', 'rgba(16,185,129,0.5)', 'rgba(16,185,129,0.75)', '#10B981'].map((bg, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: bg }} />
        ))}
        More
      </div>
    </div>
  )
}

// ── Submissions table ─────────────────────────────────────────────────────────
function SubmissionsTable({ submissions }: { submissions: any[] }) {
  const statusStyle: Record<string, { color: string; tint: string }> = {
    ACCEPTED:             { color: '#10B981', tint: 'liquid-glass-green' },
    WRONG_ANSWER:         { color: '#F43F5E', tint: 'liquid-glass-rose'  },
    TIME_LIMIT_EXCEEDED:  { color: '#F59E0B', tint: 'liquid-glass-amber' },
    RUNTIME_ERROR:        { color: '#F87171', tint: 'liquid-glass-rose'  },
    COMPILATION_ERROR:    { color: '#94A3B8', tint: ''                   },
  }

  return (
    <div className="liquid-glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Recent Submissions
        </h3>
      </div>
      {submissions.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
          No submissions yet. Start solving problems!
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--color-text-tertiary)', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 24px', fontWeight: 600 }}>Time</th>
              <th style={{ padding: '10px 24px', fontWeight: 600 }}>Problem</th>
              <th style={{ padding: '10px 24px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '10px 24px', fontWeight: 600 }}>Language</th>
              <th style={{ padding: '10px 24px', fontWeight: 600 }}>Time (ms)</th>
            </tr>
          </thead>
          <tbody>
            {submissions.slice(0, 15).map((sub, i) => {
              const s = statusStyle[sub.status] || { color: '#94A3B8', tint: '' }
              return (
                <tr
                  key={sub.id}
                  className="liquid-glass-hover"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)', color: 'white', fontSize: '0.85rem', animation: `fadeInUp 0.4s ease both`, animationDelay: `${i * 0.04}s` }}
                >
                  <td style={{ padding: '14px 24px', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-code)', fontSize: '0.78rem' }}>
                    {new Date(sub.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 24px', fontWeight: 600 }}>
                    <Link to={`/problems/${sub.problemId}`} style={{ color: '#60A5FA', textDecoration: 'none' }}>
                      {sub.problem?.title || `Problem #${sub.problemId}`}
                    </Link>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <span className={`liquid-pill ${s.tint}`} style={{ color: s.color, fontSize: '0.7rem' }}>
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <span className="liquid-pill" style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem' }}>{sub.language}</span>
                  </td>
                  <td style={{ padding: '14px 24px', fontFamily: 'var(--font-code)', color: 'var(--color-text-tertiary)', fontSize: '0.78rem' }}>
                    {sub.executionTime ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [activity, setActivity] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!user) return
    user.getIdToken().then(token => {
      const headers = { Authorization: `Bearer ${token}` }

      fetch(`${API_URL}/users/profile`, { headers })
        .then(r => r.json()).then(setStats).catch(console.error)

      fetch(`${API_URL}/users/submissions`, { headers })
        .then(r => r.json()).then(data => { if (Array.isArray(data)) setSubmissions(data) }).catch(console.error)

      fetch(`${API_URL}/users/activity`, { headers })
        .then(r => r.json()).then(setActivity).catch(console.error)
    })
  }, [user])

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="liquid-glass" style={{ borderRadius: 16, padding: '40px 48px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>🔐</div>
          <h2 style={{ marginBottom: 8 }}>Sign in Required</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>Please sign in to view your profile.</p>
          <Link to="/signin" style={{ display: 'inline-flex', padding: '10px 28px', background: 'linear-gradient(135deg,#3B82F6,#14B8A6)', borderRadius: 10, color: 'white', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    )
  }

  const totalSolved = stats?.problemsSolved || 0
  const totalProblems = (stats?.totalByDifficulty?.Easy || 0) + (stats?.totalByDifficulty?.Medium || 0) + (stats?.totalByDifficulty?.Hard || 0) || 100
  const solvePercent = (totalSolved / totalProblems) * 100
  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference - (solvePercent / 100) * circumference

  const diffRows = [
    { label: 'Easy',   color: '#10B981', count: stats?.difficultyBreakdown?.Easy   || 0, total: stats?.totalByDifficulty?.Easy   || 1 },
    { label: 'Medium', color: '#F59E0B', count: stats?.difficultyBreakdown?.Medium || 0, total: stats?.totalByDifficulty?.Medium || 1 },
    { label: 'Hard',   color: '#EF4444', count: stats?.difficultyBreakdown?.Hard   || 0, total: stats?.totalByDifficulty?.Hard   || 1 },
  ]

  const displayName = user.displayName || user.email?.split('@')[0] || 'Coder'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-ink)', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient orbs */}
      <div className="liquid-orb liquid-orb-lg" style={{ width: 700, height: 700, background: 'rgba(59,130,246,0.10)', top: '-20%', right: '-5%', position: 'fixed', pointerEvents: 'none' }} />
      <div className="liquid-orb" style={{ width: 450, height: 450, background: 'rgba(16,185,129,0.08)', bottom: '-10%', left: '-5%', position: 'fixed', pointerEvents: 'none', animationDelay: '-6s' }} />

      {/* Navbar */}
      <nav className="liquid-nav" style={{ height: 60, display: 'flex', alignItems: 'center', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link to="/problems" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Problems
        </Link>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px', display: 'flex', gap: 28, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>

        {/* LEFT PANE — Profile card */}
        <div className="liquid-glass" style={{ width: 290, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 80, flexShrink: 0 }}>

          {/* Avatar with spinning conic gradient ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', width: 96, height: 96 }}>
              {/* Outer glow ring */}
              <div style={{
                position: 'absolute', inset: -4, borderRadius: '50%',
                background: 'conic-gradient(from 0deg, #3B82F6, #14B8A6, #8B5CF6, #F43F5E, #3B82F6)',
                animation: 'spin 4s linear infinite',
                opacity: 0.8,
              }} />
              <div style={{
                position: 'absolute', inset: -1,
                background: 'var(--color-ink)',
                borderRadius: '50%',
              }} />
              <div style={{
                position: 'relative', zIndex: 1,
                width: 96, height: 96, borderRadius: '50%',
                background: 'linear-gradient(135deg, #3B82F6 0%, #14B8A6 50%, #8B5CF6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 800, color: 'white',
                boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
              }}>
                {initials}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>{displayName}</h1>
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>{user.email}</div>
            </div>
          </div>

          {/* Quick rank */}
          {stats?.rank && (
            <div className="liquid-glass-blue" style={{ borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Rank</span>
              <span style={{ color: '#60A5FA', fontWeight: 700, fontFamily: 'var(--font-code)' }}>#{stats.rank.toLocaleString()}</span>
            </div>
          )}

          {/* Solved ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="url(#solvedGrad)" strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <defs>
                  <linearGradient id="solvedGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#14B8A6" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{totalSolved}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>/ {totalProblems}</span>
              </div>
            </div>

            {/* Difficulty bars */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {diffRows.map(d => (
                <div key={d.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.82rem' }}>
                    <span style={{ color: d.color, fontWeight: 600 }}>{d.label}</span>
                    <span style={{ color: 'white', fontWeight: 700 }}>{d.count} <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>/ {d.total}</span></span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: d.color, width: `${Math.min(100, (d.count / d.total) * 100)}%`, borderRadius: 3, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="liquid-btn liquid-glass-blue liquid-glass-hover" style={{ color: '#60A5FA', padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, width: '100%', border: 'none' }}>
              Edit Profile
            </button>
            <button onClick={() => signOut()} className="liquid-btn liquid-glass-hover" style={{ color: 'var(--color-text-secondary)', padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, width: '100%', border: 'none' }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* RIGHT PANE */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>

          {/* Stat row */}
          <div style={{ display: 'flex', gap: 16 }}>
            <StatCard label="Acceptance Rate" value={`${stats?.acceptanceRate || 0}%`} tint="liquid-glass-blue" />
            <StatCard label="Total Submissions" value={stats?.totalSubmissions || 0} tint="liquid-glass-purple" />
            <StatCard label="Problems Solved" value={totalSolved} tint="liquid-glass-green" />
          </div>

          {/* Activity heatmap */}
          <ActivityHeatmap activity={activity} />

          {/* Recent submissions */}
          <SubmissionsTable submissions={submissions} />
        </div>

      </main>
    </div>
  )
}
