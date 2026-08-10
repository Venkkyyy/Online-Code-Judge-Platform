import { Link } from 'react-router-dom'
import { useEffect, useRef, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'

// ── Problem data (30 realistic problems) ─────────────────────────────────────
interface Problem {
  id: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  tags: string[]
  acceptance: number
  solved?: boolean // will be driven by auth later
}

const ALL_PROBLEMS: Problem[] = [
  { id: 1,  title: 'Two Sum',                                     difficulty: 'Easy',   tags: ['Array', 'Hash Table'],             acceptance: 52.1 },
  { id: 2,  title: 'Add Two Numbers',                              difficulty: 'Medium', tags: ['Linked List', 'Math'],             acceptance: 41.3 },
  { id: 3,  title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', tags: ['Sliding Window', 'String'],    acceptance: 35.8 },
  { id: 4,  title: 'Median of Two Sorted Arrays',                  difficulty: 'Hard',   tags: ['Binary Search', 'Array'],          acceptance: 38.4 },
  { id: 5,  title: 'Longest Palindromic Substring',                difficulty: 'Medium', tags: ['DP', 'String'],                    acceptance: 33.2 },
  { id: 6,  title: 'Valid Parentheses',                            difficulty: 'Easy',   tags: ['Stack', 'String'],                 acceptance: 67.4 },
  { id: 7,  title: 'Merge Two Sorted Lists',                       difficulty: 'Easy',   tags: ['Linked List', 'Recursion'],        acceptance: 63.8 },
  { id: 8,  title: 'Maximum Subarray',                             difficulty: 'Medium', tags: ['Array', 'DP'],                     acceptance: 50.1 },
  { id: 9,  title: 'Climbing Stairs',                              difficulty: 'Easy',   tags: ['Math', 'DP'],                      acceptance: 71.2 },
  { id: 10, title: 'Binary Search',                                difficulty: 'Easy',   tags: ['Array', 'Binary Search'],          acceptance: 59.3 },
  { id: 11, title: 'Reverse Linked List',                          difficulty: 'Easy',   tags: ['Linked List', 'Recursion'],        acceptance: 74.5 },
  { id: 12, title: 'Container With Most Water',                    difficulty: 'Medium', tags: ['Array', 'Two Pointers'],           acceptance: 54.2 },
  { id: 13, title: 'Three Sum',                                    difficulty: 'Medium', tags: ['Array', 'Two Pointers'],           acceptance: 32.7 },
  { id: 14, title: 'Letter Combinations of a Phone Number',        difficulty: 'Medium', tags: ['Backtracking', 'String'],          acceptance: 57.8 },
  { id: 15, title: 'Remove Nth Node From End of List',             difficulty: 'Medium', tags: ['Linked List', 'Two Pointers'],     acceptance: 43.1 },
  { id: 16, title: 'Trapping Rain Water',                          difficulty: 'Hard',   tags: ['Array', 'Two Pointers', 'Stack'],  acceptance: 60.5 },
  { id: 17, title: 'Word Search',                                  difficulty: 'Medium', tags: ['Backtracking', 'Graph'],           acceptance: 40.2 },
  { id: 18, title: 'Maximum Depth of Binary Tree',                 difficulty: 'Easy',   tags: ['Tree', 'DFS', 'BFS'],              acceptance: 74.9 },
  { id: 19, title: 'Validate Binary Search Tree',                  difficulty: 'Medium', tags: ['Tree', 'DFS'],                    acceptance: 31.8 },
  { id: 20, title: 'Number of Islands',                            difficulty: 'Medium', tags: ['Graph', 'BFS', 'DFS'],             acceptance: 56.7 },
  { id: 21, title: 'Course Schedule',                              difficulty: 'Medium', tags: ['Graph', 'Topological Sort'],       acceptance: 45.3 },
  { id: 22, title: 'Coin Change',                                  difficulty: 'Medium', tags: ['DP', 'BFS'],                      acceptance: 43.6 },
  { id: 23, title: 'Longest Common Subsequence',                   difficulty: 'Medium', tags: ['DP', 'String'],                   acceptance: 57.1 },
  { id: 24, title: 'Find Minimum in Rotated Sorted Array',         difficulty: 'Medium', tags: ['Array', 'Binary Search'],         acceptance: 49.8 },
  { id: 25, title: 'Merge k Sorted Lists',                         difficulty: 'Hard',   tags: ['Linked List', 'Heap'],             acceptance: 49.1 },
  { id: 26, title: 'Serialize and Deserialize Binary Tree',        difficulty: 'Hard',   tags: ['Tree', 'Design'],                 acceptance: 55.3 },
  { id: 27, title: 'Sliding Window Maximum',                       difficulty: 'Hard',   tags: ['Sliding Window', 'Heap'],          acceptance: 46.2 },
  { id: 28, title: 'Regular Expression Matching',                  difficulty: 'Hard',   tags: ['DP', 'String', 'Recursion'],       acceptance: 28.3 },
  { id: 29, title: 'Palindrome Partitioning',                      difficulty: 'Medium', tags: ['DP', 'Backtracking'],              acceptance: 65.4 },
  { id: 30, title: 'Decode Ways',                                  difficulty: 'Medium', tags: ['DP', 'String'],                   acceptance: 31.1 },
]

const ALL_TAGS = Array.from(new Set(ALL_PROBLEMS.flatMap(p => p.tags))).sort()
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

// ── CursorGlow (same as landing page) ────────────────────────────────────────
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
  const { user, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', background: scrolled ? 'rgba(11,16,32,0.97)' : 'rgba(11,16,32,0.8)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: `1px solid ${scrolled ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)'}`, transition: 'all 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 var(--space-6)', gap: 16 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '1.125rem', color: 'white', textDecoration: 'none', letterSpacing: '-0.03em', flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(20,184,166,0.2))', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M4 9l3-3 3 3 3-3" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 13l3-3 3 3 3-3" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            </svg>
          </div>
          Code<span style={{ color: '#60A5FA' }}>Judge</span>
        </Link>

        {/* Search bar — center */}
        <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Search problems..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-md)', padding: '8px 12px 8px 36px',
              color: 'white', fontSize: '0.875rem', fontFamily: 'var(--font-ui)',
              outline: 'none', transition: 'all 0.2s ease',
            }}
            onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.09)'; e.target.style.borderColor = 'rgba(59,130,246,0.5)' }}
            onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 2 }}>×</button>
          )}
        </div>

        {/* Nav links + auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {['Problems', 'Leaderboard', 'Discuss'].map(item => (
            <Link key={item} to={`/${item.toLowerCase()}`} className="btn-nav-link" style={{ color: item === 'Problems' ? '#60A5FA' : undefined }}>{item}</Link>
          ))}
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />
          {user ? (
            <>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginRight: 4 }}>
                {user.displayName || user.email}
              </div>
              <button onClick={() => signOut()} className="btn-nav-signin" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn-nav-signin">Sign In</Link>
              <Link to="/register" className="btn-nav-getstarted">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

// ── Tag pill ──────────────────────────────────────────────────────────────────
function TagPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '4px 12px', borderRadius: 'var(--radius-full)',
        border: `1px solid ${active ? 'rgba(59,130,246,0.6)' : hov ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.09)'}`,
        background: active ? 'rgba(59,130,246,0.15)' : hov ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: active ? '#60A5FA' : hov ? 'white' : 'var(--color-text-secondary)',
        fontSize: '0.78rem', fontWeight: active ? 600 : 500, cursor: 'pointer',
        transition: 'all 0.18s ease', fontFamily: 'var(--font-ui)',
        whiteSpace: 'nowrap',
      }}
    >{label}</button>
  )
}

// ── Problem row ───────────────────────────────────────────────────────────────
function ProblemRow({ problem, index }: { problem: Problem; index: number }) {
  const [hov, setHov] = useState(false)
  const dc = DIFF_COLOR[problem.difficulty]
  const color = acceptColor(problem.acceptance)

  return (
    <Link
      to={`/problems/${problem.id}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '52px 1fr auto auto auto',
        gap: 0,
        alignItems: 'center',
        padding: '0 var(--space-5)',
        height: 58,
        background: hov ? 'rgba(59,130,246,0.04)' : index % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer', textDecoration: 'none',
        transition: 'all 0.15s ease',
        transform: hov ? 'translateX(3px)' : 'none',
        borderLeft: `2px solid ${hov ? dc : 'transparent'}`,
      }}
    >
      {/* # */}
      <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
        {problem.id}.
      </span>

      {/* Title + Tags */}
      <div style={{ minWidth: 0, paddingRight: 24 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: hov ? 'white' : 'var(--color-text-primary)', transition: 'color 0.15s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
          {problem.title}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {problem.tags.map(t => (
            <span key={t} style={{ padding: '1px 8px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', fontSize: '0.68rem', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div style={{ paddingRight: 40, minWidth: 90, textAlign: 'center' }}>
        <span style={{ display: 'inline-block', padding: '3px 11px', borderRadius: 'var(--radius-full)', background: DIFF_BG[problem.difficulty], border: `1px solid ${DIFF_BORDER[problem.difficulty]}`, fontSize: '0.72rem', fontWeight: 700, color: dc, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {problem.difficulty}
        </span>
      </div>

      {/* Acceptance */}
      <div style={{ paddingRight: 32, minWidth: 110, textAlign: 'right' }}>
        <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-code)', fontWeight: 600, color, marginBottom: 4 }}>
          {problem.acceptance.toFixed(1)}%
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${problem.acceptance}%`, background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Status icon */}
      <div style={{ minWidth: 28, textAlign: 'center' }}>
        {problem.solved ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        ) : (
          <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', margin: '0 auto' }} />
        )}
      </div>
    </Link>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProblemsPage() {
  const [query, setQuery]       = useState('')
  const [diff, setDiff]         = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sort, setSort]         = useState<'default' | 'acc-asc' | 'acc-desc' | 'diff-easy' | 'diff-hard'>('default')
  const [page, setPage]         = useState(1)
  const [showTagMenu, setShowTagMenu] = useState(false)

  // Reset page on filter change
  useEffect(() => setPage(1), [query, diff, activeTags, sort])

  const filtered = useMemo(() => {
    let list = ALL_PROBLEMS
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)))
    }
    if (diff !== 'All') list = list.filter(p => p.difficulty === diff)
    if (activeTags.length > 0) list = list.filter(p => activeTags.every(t => p.tags.includes(t)))
    if (sort === 'acc-asc')  list = [...list].sort((a, b) => a.acceptance - b.acceptance)
    if (sort === 'acc-desc') list = [...list].sort((a, b) => b.acceptance - a.acceptance)
    if (sort === 'diff-easy') list = [...list].sort((a, b) => { const o = { Easy:0, Medium:1, Hard:2 }; return o[a.difficulty] - o[b.difficulty] })
    if (sort === 'diff-hard') list = [...list].sort((a, b) => { const o = { Easy:0, Medium:1, Hard:2 }; return o[b.difficulty] - o[a.difficulty] })
    return list
  }, [query, diff, activeTags, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = {
    Easy:   ALL_PROBLEMS.filter(p => p.difficulty === 'Easy').length,
    Medium: ALL_PROBLEMS.filter(p => p.difficulty === 'Medium').length,
    Hard:   ALL_PROBLEMS.filter(p => p.difficulty === 'Hard').length,
  }

  const toggleTag = (t: string) => setActiveTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-ink)', position: 'relative' }}>
      {/* Cursor glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <CursorGlow />
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
                <div key={d} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', background: DIFF_BG[d], border: `1px solid ${DIFF_BORDER[d]}`, fontSize: '0.8rem', fontWeight: 700, color: DIFF_COLOR[d] }}>
                  {counts[d]} {d}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Filter bar ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
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
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50, background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-xl)', padding: 16, width: 300, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)' }}>
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
        <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto auto auto', gap: 0, alignItems: 'center', padding: '0 var(--space-5)', height: 44, background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>#</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Title</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', paddingRight: 40, minWidth: 90, textAlign: 'center' }}>Difficulty</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', paddingRight: 32, minWidth: 110, textAlign: 'right' }}>Acceptance</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', minWidth: 28, textAlign: 'center' }}>Status</span>
          </div>

          {/* Rows */}
          {paginated.length === 0 ? (
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
