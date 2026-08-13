import { Link } from 'react-router-dom'
import { useEffect, useRef, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

interface Problem {
  id: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  tags: string[]
  acceptance: number
  solved?: boolean
}

type ApiProblem = Partial<Problem> & {
  id: number
  title?: string
  question?: string
}

const PAGE_SIZE = 15

// ── Difficulty helpers ────────────────────────────────────────────────────────
const DIFF_COLOR = { Easy: '#10B981', Medium: '#F59E0B', Hard: '#F43F5E' }
const DIFF_BG    = { Easy: 'rgba(16,185,129,0.1)', Medium: 'rgba(245,158,11,0.1)', Hard: 'rgba(244,63,94,0.1)' }
const DIFF_BORDER = { Easy: 'rgba(16,185,129,0.25)', Medium: 'rgba(245,158,11,0.25)', Hard: 'rgba(244,63,94,0.25)' }

// ── Acceptance bar color ──────────────────────────────────────────────────────
function acceptColor(rate: number) {
  if (rate >= 60) return '#10B981'
  if (rate >= 40) return '#F59E0B'
  return '#F43F5E'
}

// ── CursorGlow ────────────────────────────────────────────────────────────────
function CursorGlow() {
  const coreRef = useRef<HTMLDivElement>(null)
  const haloRef = useRef<HTMLDivElement>(null)
  const mouse  = useRef({ x: -1000, y: -1000 })
  const smooth = useRef({ x: -1000, y: -1000 })
  const raf    = useRef(0)
  const hue    = useRef(220)

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove)
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const tick = () => {
      smooth.current.x = lerp(smooth.current.x, mouse.current.x, 0.12)
      smooth.current.y = lerp(smooth.current.y, mouse.current.y, 0.12)
      const scroll = window.scrollY
      const cx = smooth.current.x, cy = smooth.current.y + scroll
      hue.current = (hue.current + 0.15) % 360
      const h = hue.current
      if (coreRef.current) {
        coreRef.current.style.transform = `translate(${cx - 200}px, ${cy - 200}px)`
        coreRef.current.style.background = `radial-gradient(circle at center, hsla(${(h+20)%360},90%,70%,0.16) 0%, transparent 70%)`
      }
      if (haloRef.current) {
        haloRef.current.style.transform = `translate(${cx - 400}px, ${cy - 400}px)`
        haloRef.current.style.background = `radial-gradient(circle at center, hsla(${h},80%,65%,0.08) 0%, hsla(${(h+40)%360},80%,60%,0.03) 40%, transparent 70%)`
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf.current) }
  }, [])

  return (
    <>
      <div ref={coreRef} style={{ position: 'absolute', top: 0, left: 0, width: 400, height: 400, borderRadius: '50%', pointerEvents: 'none', zIndex: 0, willChange: 'transform', filter: 'blur(24px)', mixBlendMode: 'screen' }} />
      <div ref={haloRef} style={{ position: 'absolute', top: 0, left: 0, width: 800, height: 800, borderRadius: '50%', pointerEvents: 'none', zIndex: 0, willChange: 'transform', filter: 'blur(60px)' }} />
    </>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav className="liquid-nav" style={{ position: 'sticky', top: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 var(--space-6)', gap: 16 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '1.125rem', color: 'white', textDecoration: 'none', letterSpacing: '-0.03em', flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(20,184,166,0.2))', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M4 9l3-3 3 3 3-3" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 13l3-3 3 3 3-3" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            </svg>
          </div>
          Code<span style={{ color: '#60A5FA' }}>Judge</span>
        </Link>
        <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Search problems..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="liquid-input"
            style={{
              width: '100%', borderRadius: 'var(--radius-md)', padding: '8px 12px 8px 36px',
              fontSize: '0.875rem', fontFamily: 'var(--font-ui)',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {user ? (
            <>
              <Link to="/admin" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textDecoration: 'none' }}>Admin</Link>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>
                  {user.email?.[0].toUpperCase()}
                </div>
                <span style={{ fontSize: '0.85rem' }}>Profile</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/signin" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Sign In</Link>
              <Link to="/register" style={{ background: 'white', color: 'black', padding: '6px 16px', borderRadius: 20, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

// ── Tag pill ──────────────────────────────────────────────────────────────────
function TagPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px', borderRadius: 'var(--radius-full)',
        border: `1px solid ${active ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.09)'}`,
        background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
        color: active ? '#60A5FA' : 'var(--color-text-secondary)',
        fontSize: '0.78rem', cursor: 'pointer',
      }}
    >{label}</button>
  )
}

// ── Problem row ───────────────────────────────────────────────────────────────
function ProblemRow({ problem, index }: { problem: Problem; index: number }) {
  const dc = DIFF_COLOR[problem.difficulty]
  const diffClass = { Easy: 'liquid-glass-green', Medium: 'liquid-glass-amber', Hard: 'liquid-glass-rose' }[problem.difficulty]
  const color = acceptColor(problem.acceptance)

  return (
    <Link
      to={`/problems/${problem.id}`}
      className="liquid-glass-hover"
      style={{
        display: 'grid',
        gridTemplateColumns: '52px 1fr auto auto auto',
        gap: 0,
        alignItems: 'center',
        padding: '0 var(--space-5)',
        height: 64,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        textDecoration: 'none',
        borderLeft: `3px solid ${dc}`,
        position: 'relative',
      }}
    >
      <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', paddingLeft: 4 }}>{problem.id}.</span>
      <div style={{ minWidth: 0, paddingRight: 24 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'white', marginBottom: 4 }}>{problem.title}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {problem.tags.map(t => <span key={t} className="liquid-pill" style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', padding: '2px 8px' }}>{t}</span>)}
        </div>
      </div>
      <div style={{ paddingRight: 40, minWidth: 90, textAlign: 'center' }}>
        <span className={`liquid-pill ${diffClass}`} style={{ color: dc, fontSize: '0.72rem', fontWeight: 700, padding: '3px 11px' }}>{problem.difficulty}</span>
      </div>
      <div style={{ paddingRight: 32, minWidth: 110, textAlign: 'right' }}>
        <div style={{ color, fontWeight: 600, fontFamily: 'var(--font-code)' }}>{problem.acceptance.toFixed(1)}%</div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${problem.acceptance}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
        </div>
      </div>
      <div style={{ minWidth: 28, textAlign: 'center' }}>
        {problem.solved
          ? <span style={{ color: '#10B981', fontSize: '1rem' }}>✓</span>
          : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', margin: '0 auto' }} />}
      </div>
    </Link>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [diff, setDiff] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [showTagMenu, setShowTagMenu] = useState(false)
  const [sort, setSort] = useState('default')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProblems() {
      try {
        setLoading(true)
        setError('')
        const res = await fetch(`${API_URL}/problems`, { signal: controller.signal })

        if (!res.ok) {
          throw new Error('Problem catalogue could not be loaded.')
        }

        const data = await res.json()
        if (!Array.isArray(data)) {
          throw new Error('Problem catalogue returned an invalid response.')
        }

        setProblems(data.map((problem: ApiProblem) => ({
          id: problem.id,
          title: problem.title || problem.question || `Problem ${problem.id}`,
          difficulty: problem.difficulty || 'Easy',
          tags: Array.isArray(problem.tags) ? problem.tags : [],
          acceptance: typeof problem.acceptance === 'number' ? problem.acceptance : 0,
          solved: problem.solved,
        })))
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error(err)
          setError(err instanceof Error ? err.message : 'Problem catalogue could not be loaded.')
          setProblems([])
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadProblems()
    return () => controller.abort()
  }, [])

  // Reset page on filter change
  useEffect(() => setPage(1), [query, diff, activeTags, sort])

  const filtered = useMemo(() => {
    let list = [...problems]
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(p => String(p.id) === q || p.title.toLowerCase().includes(q))
    }
    if (diff !== 'All') list = list.filter(p => p.difficulty === diff)
    if (activeTags.length > 0) list = list.filter(p => activeTags.every(t => p.tags.includes(t)))
    if (sort === 'acc-asc')  list = [...list].sort((a, b) => a.acceptance - b.acceptance)
    if (sort === 'acc-desc') list = [...list].sort((a, b) => b.acceptance - a.acceptance)
    if (sort === 'diff-easy') list = [...list].sort((a, b) => { const o: Record<string, number> = { Easy:0, Medium:1, Hard:2 }; return o[a.difficulty] - o[b.difficulty] })
    if (sort === 'diff-hard') list = [...list].sort((a, b) => { const o: Record<string, number> = { Easy:0, Medium:1, Hard:2 }; return o[b.difficulty] - o[a.difficulty] })
    return list
  }, [problems, query, diff, activeTags, sort])

  const ALL_TAGS = useMemo(() => Array.from(new Set(problems.flatMap(p => p.tags))).sort(), [problems])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = {
    Easy:   problems.filter(p => p.difficulty === 'Easy').length,
    Medium: problems.filter(p => p.difficulty === 'Medium').length,
    Hard:   problems.filter(p => p.difficulty === 'Hard').length,
  }

  const toggleTag = (t: string) => setActiveTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-ink)', position: 'relative' }}>
      {/* Ambient orbs for liquid glass refraction */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <CursorGlow />
        <div className="liquid-orb liquid-orb-lg" style={{ width: 600, height: 600, background: 'rgba(59,130,246,0.12)', top: '10%', left: '-10%', animationDelay: '0s' }} />
        <div className="liquid-orb" style={{ width: 400, height: 400, background: 'rgba(20,184,166,0.10)', top: '50%', right: '-5%', animationDelay: '-5s' }} />
        <div className="liquid-orb liquid-orb-sm" style={{ width: 300, height: 300, background: 'rgba(139,92,246,0.08)', bottom: '10%', left: '30%', animationDelay: '-9s' }} />
      </div>

      <Navbar query={query} setQuery={setQuery} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '40px var(--space-6) 80px' }}>

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.75rem,3vw,2.25rem)', marginBottom: 8, letterSpacing: '-0.03em' }}>
                Problems
                <span style={{ background: 'linear-gradient(135deg,#60A5FA,#34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}> Catalogue</span>
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', margin: 0 }}>
                {filtered.length} problem{filtered.length !== 1 ? 's' : ''} found
                {(query || diff !== 'All' || activeTags.length > 0) ? ' (filtered)' : ` across all difficulty levels`}
              </p>
            </div>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: 10 }}>
              {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                <div key={d} className={`liquid-pill liquid-glass-${d === 'Easy' ? 'green' : d === 'Medium' ? 'amber' : 'rose'}`} style={{ color: DIFF_COLOR[d], fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }} onClick={() => setDiff(d)}>
                  {counts[d]} {d}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Filter bar ────────────────────────────────────────────────── */}
        <div className="liquid-glass" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap', padding: '12px', borderRadius: 'var(--radius-lg)' }}>
          {/* Difficulty pills */}
          <div style={{ display: 'flex', gap: 6, padding: '6px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-lg)' }}>
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map(d => {
              const active = diff === d
              const color  = d === 'All' ? '#60A5FA' : DIFF_COLOR[d]
              return (
                <button
                  key={d}
                  onClick={() => setDiff(d)}
                  style={{
                    padding: '4px 14px', borderRadius: 'var(--radius-full)', border: `1px solid ${active ? (d === 'All' ? 'rgba(59,130,246,0.5)' : DIFF_BORDER[d]) : 'transparent'}`,
                    background: active ? (d === 'All' ? 'rgba(59,130,246,0.12)' : DIFF_BG[d]) : 'transparent',
                    color: active ? color : 'var(--color-text-tertiary)',
                    fontSize: '0.8rem', fontWeight: active ? 700 : 500, cursor: 'pointer',
                    transition: 'all 0.18s ease', fontFamily: 'var(--font-ui)',
                  }}
                >{d}</button>
              )
            })}
          </div>

          {/* Tags dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTagMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 'var(--radius-lg)',
                background: activeTags.length > 0 ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeTags.length > 0 ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.09)'}`,
                color: activeTags.length > 0 ? '#60A5FA' : 'var(--color-text-secondary)',
                fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                transition: 'all 0.18s ease',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              Tags {activeTags.length > 0 ? `(${activeTags.length})` : ''}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: showTagMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {showTagMenu && (
              <div className="liquid-modal" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50, borderRadius: 'var(--radius-xl)', padding: 16, width: 300 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Filter by Topic</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ALL_TAGS.map(t => <TagPill key={t} label={t} active={activeTags.includes(t)} onClick={() => toggleTag(t)} />)}
                </div>
                {activeTags.length > 0 && (
                  <button onClick={() => setActiveTags([])} style={{ marginTop: 12, width: '100%', padding: '6px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-tertiary)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', transition: 'all 0.15s' }}>
                    Clear all tags
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as typeof sort)}
            style={{ padding: '8px 32px 8px 12px', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'var(--color-text-secondary)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', outline: 'none', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748B\' stroke-width=\'2.5\' stroke-linecap=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            <option value="default">Sort: Default</option>
            <option value="acc-desc">Acceptance: High → Low</option>
            <option value="acc-asc">Acceptance: Low → High</option>
            <option value="diff-easy">Difficulty: Easy first</option>
            <option value="diff-hard">Difficulty: Hard first</option>
          </select>

          {/* Active tag chips */}
          {activeTags.map(t => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.35)', fontSize: '0.76rem', color: '#60A5FA', fontWeight: 600 }}>
              {t}
              <button onClick={() => toggleTag(t)} style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1, opacity: 0.7 }}>×</button>
            </span>
          ))}

          {(query || diff !== 'All' || activeTags.length > 0) && (
            <button onClick={() => { setQuery(''); setDiff('All'); setActiveTags([]) }} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-tertiary)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', transition: 'all 0.15s' }}>
              Reset filters
            </button>
          )}
        </div>

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <div className="liquid-glass" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto auto auto', gap: 0, alignItems: 'center', padding: '0 var(--space-5)', height: 44, background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>#</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Title</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', paddingRight: 40, minWidth: 90, textAlign: 'center' }}>Difficulty</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', paddingRight: 32, minWidth: 110, textAlign: 'right' }}>Acceptance</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', minWidth: 28, textAlign: 'center' }}>Status</span>
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="liquid-shimmer" style={{ height: 56, borderRadius: 8, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Problem catalogue unavailable</div>
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>{error}</div>
            </div>
          ) : paginated.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No problems found</div>
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>Try adjusting your search or filters</div>
            </div>
          ) : (
            paginated.map((p, i) => <ProblemRow key={p.id} problem={p} index={i} />)
          )}
        </div>

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '7px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: page === 1 ? 'var(--color-text-tertiary)' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-ui)', opacity: page === 1 ? 0.4 : 1, transition: 'all 0.15s' }}
              >← Prev</button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
                const near = Math.abs(n - page) <= 1 || n === 1 || n === totalPages
                if (!near) {
                  if (n === 2 || n === totalPages - 1) return <span key={n} style={{ padding: '7px 4px', color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>…</span>
                  return null
                }
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: n === page ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${n === page ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.09)'}`, color: n === page ? '#60A5FA' : 'white', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-ui)', fontWeight: n === page ? 700 : 400, transition: 'all 0.15s' }}
                  >{n}</button>
                )
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '7px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: page === totalPages ? 'var(--color-text-tertiary)' : 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-ui)', opacity: page === totalPages ? 0.4 : 1, transition: 'all 0.15s' }}
              >Next →</button>
            </div>
          </div>
        )}
      </main>

      {/* Click outside to close tag menu */}
      {showTagMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowTagMenu(false)} />}
    </div>
  )
}
