import { Link } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'

// ── 5 rotating code problems ──────────────────────────────────────────────────
const CODE_EXAMPLES: Array<{
  filename: string
  language: string
  label: string
  difficulty: string
  diffColor: string
  result: { runtime: string; memory: string; beats: string }
  lines: Array<Array<[string, string]>>
}> = [
  {
    filename: 'two_sum.py',
    language: 'Python 3.12',
    label: 'Two Sum',
    difficulty: 'Easy',
    diffColor: '#10B981',
    result: { runtime: '48ms', memory: '16.2 MB', beats: '94.2%' },
    lines: [
      [['def ', '#C792EA'], ['two_sum', '#82AAFF'], ['(nums, target):', '#E2E8F0']],
      [['    seen ', '#E2E8F0'], ['=', '#89DDFF'], [' {}', '#E2E8F0']],
      [['    ', '#E2E8F0'], ['for ', '#C792EA'], ['i, num ', '#E2E8F0'], ['in ', '#C792EA'], ['enumerate(nums):', '#E2E8F0']],
      [['        complement ', '#E2E8F0'], ['=', '#89DDFF'], [' target ', '#E2E8F0'], ['-', '#89DDFF'], [' num', '#E2E8F0']],
      [['        ', '#E2E8F0'], ['if ', '#C792EA'], ['complement ', '#E2E8F0'], ['in ', '#C792EA'], ['seen:', '#E2E8F0']],
      [['            ', '#E2E8F0'], ['return ', '#C792EA'], ['[seen[complement], i]', '#E2E8F0']],
      [['        seen[num] ', '#E2E8F0'], ['=', '#89DDFF'], [' i', '#E2E8F0']],
      [['    ', '#E2E8F0'], ['return ', '#C792EA'], ['[]', '#E2E8F0']],
    ],
  },
  {
    filename: 'valid_parens.py',
    language: 'Python 3.12',
    label: 'Valid Parentheses',
    difficulty: 'Easy',
    diffColor: '#10B981',
    result: { runtime: '32ms', memory: '13.8 MB', beats: '97.1%' },
    lines: [
      [['def ', '#C792EA'], ['isValid', '#82AAFF'], ['(s):', '#E2E8F0']],
      [['    stack ', '#E2E8F0'], ['=', '#89DDFF'], [' []', '#E2E8F0']],
      [['    pairs ', '#E2E8F0'], ['=', '#89DDFF'], [' {', '#E2E8F0'], ['")"', '#C3E88D'], [': ', '#E2E8F0'], ['"("', '#C3E88D'], [', ', '#E2E8F0'], ['"]"', '#C3E88D'], [': ', '#E2E8F0'], ['"["', '#C3E88D'], ['}', '#E2E8F0']],
      [['    ', '#E2E8F0'], ['for ', '#C792EA'], ['c ', '#E2E8F0'], ['in ', '#C792EA'], ['s:', '#E2E8F0']],
      [['        ', '#E2E8F0'], ['if ', '#C792EA'], ['c ', '#E2E8F0'], ['in ', '#C792EA'], ['pairs:', '#E2E8F0']],
      [['            ', '#E2E8F0'], ['if ', '#C792EA'], ['not ', '#C792EA'], ['stack ', '#E2E8F0'], ['or ', '#C792EA'], ['stack[-1] != pairs[c]:', '#E2E8F0']],
      [['                ', '#E2E8F0'], ['return ', '#C792EA'], ['False', '#F07178']],
      [['            stack.pop()', '#82AAFF']],
      [['        ', '#E2E8F0'], ['else', '#C792EA'], [': stack.append(c)', '#E2E8F0']],
      [['    ', '#E2E8F0'], ['return ', '#C792EA'], ['not ', '#C792EA'], ['stack', '#E2E8F0']],
    ],
  },
  {
    filename: 'binary_search.py',
    language: 'Python 3.12',
    label: 'Binary Search',
    difficulty: 'Easy',
    diffColor: '#10B981',
    result: { runtime: '28ms', memory: '14.1 MB', beats: '98.5%' },
    lines: [
      [['def ', '#C792EA'], ['search', '#82AAFF'], ['(nums, target):', '#E2E8F0']],
      [['    l, r ', '#E2E8F0'], ['=', '#89DDFF'], [' 0', '#F78C6C'], [', ', '#E2E8F0'], ['len(nums) ', '#82AAFF'], ['-', '#89DDFF'], [' 1', '#F78C6C']],
      [['    ', '#E2E8F0'], ['while ', '#C792EA'], ['l ', '#E2E8F0'], ['<=', '#89DDFF'], [' r:', '#E2E8F0']],
      [['        mid ', '#E2E8F0'], ['=', '#89DDFF'], [' (l ', '#E2E8F0'], ['+', '#89DDFF'], [' r) ', '#E2E8F0'], ['//', '#89DDFF'], [' 2', '#F78C6C']],
      [['        ', '#E2E8F0'], ['if ', '#C792EA'], ['nums[mid] ', '#E2E8F0'], ['==', '#89DDFF'], [' target:', '#E2E8F0']],
      [['            ', '#E2E8F0'], ['return ', '#C792EA'], ['mid', '#E2E8F0']],
      [['        ', '#E2E8F0'], ['elif ', '#C792EA'], ['nums[mid] ', '#E2E8F0'], ['<', '#89DDFF'], [' target:', '#E2E8F0']],
      [['            l ', '#E2E8F0'], ['=', '#89DDFF'], [' mid ', '#E2E8F0'], ['+', '#89DDFF'], [' 1', '#F78C6C']],
      [['        ', '#E2E8F0'], ['else', '#C792EA'], [': r ', '#E2E8F0'], ['=', '#89DDFF'], [' mid ', '#E2E8F0'], ['-', '#89DDFF'], [' 1', '#F78C6C']],
      [['    ', '#E2E8F0'], ['return ', '#C792EA'], ['-1', '#F78C6C']],
    ],
  },
  {
    filename: 'max_subarray.js',
    language: 'JavaScript',
    label: 'Maximum Subarray',
    difficulty: 'Medium',
    diffColor: '#F59E0B',
    result: { runtime: '72ms', memory: '52.4 MB', beats: '91.3%' },
    lines: [
      [['function ', '#C792EA'], ['maxSubArray', '#82AAFF'], ['(nums) {', '#E2E8F0']],
      [['    let ', '#C792EA'], ['max ', '#E2E8F0'], ['=', '#89DDFF'], [' nums[0],', '#E2E8F0'], [' curr ', '#E2E8F0'], ['=', '#89DDFF'], [' nums[0]', '#E2E8F0']],
      [['    ', '#E2E8F0'], ['for ', '#C792EA'], ['(let i ', '#E2E8F0'], ['=', '#89DDFF'], [' 1', '#F78C6C'], ['; i ', '#E2E8F0'], ['<', '#89DDFF'], [' nums.length; i++) {', '#E2E8F0']],
      [['        curr ', '#E2E8F0'], ['=', '#89DDFF'], [' Math.max', '#82AAFF'], ['(nums[i], curr ', '#E2E8F0'], ['+', '#89DDFF'], [' nums[i])', '#E2E8F0']],
      [['        max ', '#E2E8F0'], ['=', '#89DDFF'], [' Math.max', '#82AAFF'], ['(max, curr)', '#E2E8F0']],
      [['    }', '#E2E8F0']],
      [['    ', '#E2E8F0'], ['return ', '#C792EA'], ['max', '#E2E8F0']],
      [['}', '#E2E8F0']],
    ],
  },
  {
    filename: 'climb_stairs.py',
    language: 'Python 3.12',
    label: 'Climbing Stairs',
    difficulty: 'Easy',
    diffColor: '#10B981',
    result: { runtime: '24ms', memory: '13.5 MB', beats: '99.0%' },
    lines: [
      [['def ', '#C792EA'], ['climbStairs', '#82AAFF'], ['(n):', '#E2E8F0']],
      [['    ', '#E2E8F0'], ['if ', '#C792EA'], ['n ', '#E2E8F0'], ['<=', '#89DDFF'], [' 2', '#F78C6C'], [': ', '#E2E8F0'], ['return ', '#C792EA'], ['n', '#E2E8F0']],
      [['    a, b ', '#E2E8F0'], ['=', '#89DDFF'], [' 1', '#F78C6C'], [', ', '#E2E8F0'], ['2', '#F78C6C']],
      [['    ', '#E2E8F0'], ['for ', '#C792EA'], ['_ ', '#E2E8F0'], ['in ', '#C792EA'], ['range(2, n):', '#E2E8F0']],
      [['        a, b ', '#E2E8F0'], ['=', '#89DDFF'], [' b, a ', '#E2E8F0'], ['+', '#89DDFF'], [' b', '#E2E8F0']],
      [['    ', '#E2E8F0'], ['return ', '#C792EA'], ['b', '#E2E8F0']],
    ],
  },
]

// ── Typewriter component (cycles through examples) ─────────────────────────────
function TypewriterCode({ exampleIdx, onComplete }: { exampleIdx: number; onComplete: () => void }) {
  const example = CODE_EXAMPLES[exampleIdx]
  const lineTexts = example.lines.map(tokens => tokens.map(([t]) => t).join(''))
  const totalChars = lineTexts.reduce((sum, line) => sum + line.length + 1, 0)

  const [progress, setProgress] = useState(0)
  const [cursorOn, setCursorOn] = useState(true)
  const completeFired = useRef(false)

  useEffect(() => {
    setProgress(0)
    completeFired.current = false
  }, [exampleIdx])

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    const textAll = lineTexts.join('\n')

    const tick = (cur: number) => {
      if (cur < totalChars) {
        setProgress(cur + 1)
        const ch = textAll[cur]
        let delay = 12 + Math.random() * 20
        if (ch === ' ') delay += 20
        else if (ch === ':') delay += 160
        else if (ch === '\n') delay += 250
        if (Math.random() > 0.82) delay = 4
        timeoutId = setTimeout(() => tick(cur + 1), delay)
      } else {
        if (!completeFired.current) {
          completeFired.current = true
          setTimeout(onComplete, 500)
        }
      }
    }

    timeoutId = setTimeout(() => tick(0), 600)
    const cid = setInterval(() => setCursorOn(v => !v), 530)
    return () => { clearTimeout(timeoutId); clearInterval(cid) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exampleIdx, onComplete])

  const lineShows = lineTexts.map((text, li) => {
    const lineStart = lineTexts.slice(0, li).reduce((s, l) => s + l.length + 1, 0)
    if (progress <= lineStart) return { show: false, chars: 0 }
    const chars = Math.min(progress - lineStart, text.length)
    return { show: true, chars }
  })

  const currentLine = lineShows.findLastIndex(l => l.show)
  const isDone = progress >= totalChars

  return (
    <div style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.85rem', lineHeight: 1.9, padding: '18px 20px 10px', minHeight: 260, maxHeight: 280 }}>
      {example.lines.map((tokens, li) => {
        const { show, chars } = lineShows[li]
        if (!show && !isDone) return null
        let remaining = isDone ? 9999 : chars
        const nodes: React.ReactNode[] = []
        for (let ti = 0; ti < tokens.length; ti++) {
          if (remaining <= 0) break
          const [txt, color] = tokens[ti]
          const visible = txt.slice(0, remaining)
          nodes.push(<span key={ti} style={{ color }}>{visible}</span>)
          remaining -= txt.length
        }
        return (
          <div key={li} style={{ display: 'flex', gap: 14, minHeight: '1.9em' }}>
            <span style={{ color: '#1E3A4C', width: 20, textAlign: 'right', flexShrink: 0, userSelect: 'none', fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem', paddingTop: 2 }}>
              {li + 1}
            </span>
            <span style={{ whiteSpace: 'pre', flex: 1 }}>
              {nodes}
              {li === currentLine && cursorOn && !isDone && (
                <span style={{ display: 'inline-block', width: 2, height: '0.9em', background: '#60A5FA', marginLeft: 1, verticalAlign: 'text-bottom', borderRadius: 1, boxShadow: '0 0 6px #60A5FA' }} />
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedStat({ end, suffix, label, color }: { end: number; suffix: string; label: string; color: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const start = Date.now()
        const tick = () => {
          const t = Math.min((Date.now() - start) / 1400, 1)
          const ease = 1 - Math.pow(1 - t, 3)
          setCount(Math.floor(ease * end))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end])
  return (
    <div ref={ref} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
      <div style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6, background: `linear-gradient(135deg, ${color}, white)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, description, color, delay = 0 }: {
  icon: string; title: string; description: string; color: string; delay?: number
}) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="animate-fade-in"
      style={{
        animationDelay: `${delay}ms`, animationFillMode: 'both',
        background: hov ? 'rgba(255,255,255,0.04)' : 'var(--color-surface-1)',
        border: `1px solid ${hov ? color + '50' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)',
        position: 'relative', overflow: 'hidden', cursor: 'default',
        transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
        transform: hov ? 'translateY(-6px)' : 'none',
        boxShadow: hov ? `0 20px 60px ${color}20, 0 0 0 1px ${color}20` : '0 1px 3px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`, opacity: hov ? 1 : 0.3, transition: 'opacity 0.3s ease' }} />
      <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 'var(--space-4)', transition: 'all 0.3s ease', boxShadow: hov ? `0 0 24px ${color}40` : 'none', transform: hov ? 'scale(1.08)' : 'none' }}>{icon}</div>
      <h3 style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-2)' }}>{title}</h3>
      <p style={{ fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{description}</p>
    </div>
  )
}

// ── Problem row ───────────────────────────────────────────────────────────────
function ProblemRow({ id, title, difficulty, tags, acceptanceRate }: {
  id: number; title: string; difficulty: 'Easy' | 'Medium' | 'Hard'; tags: string[]; acceptanceRate: number
}) {
  const [hov, setHov] = useState(false)
  const dc = { Easy: '#10B981', Medium: '#F59E0B', Hard: '#F43F5E' }[difficulty]
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4) var(--space-5)', background: hov ? 'rgba(255,255,255,0.04)' : 'var(--color-surface-1)', border: `1px solid ${hov ? 'rgba(255,255,255,0.1)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.2s ease', transform: hov ? 'translateX(6px)' : 'none' }}
    >
      <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', width: 28, textAlign: 'right', flexShrink: 0 }}>{id}.</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{title}</div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {tags.map(t => <span key={t} className="tag" style={{ fontSize: '0.7rem' }}>{t}</span>)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', background: `${dc}15`, border: `1px solid ${dc}30`, fontSize: '0.7rem', fontWeight: 700, color: dc, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{difficulty}</span>
        <span style={{ fontSize: '0.75rem', color: dc, fontFamily: 'var(--font-code)', fontWeight: 600 }}>{acceptanceRate}%</span>
      </div>
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 64, display: 'flex', alignItems: 'center', background: scrolled ? 'rgba(11,16,32,0.95)' : 'rgba(11,16,32,0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: `1px solid ${scrolled ? 'rgba(59,130,246,0.12)' : 'transparent'}`, transition: 'all 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 var(--space-6)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: '1.25rem', color: 'white', textDecoration: 'none', letterSpacing: '-0.03em' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(20,184,166,0.2))', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 9l3-3 3 3 3-3" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 13l3-3 3 3 3-3" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            </svg>
          </div>
          Code<span style={{ color: '#60A5FA' }}>Judge</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {['Problems', 'Leaderboard', 'Discuss'].map(item => (
            <Link key={item} to={`/${item.toLowerCase()}`} className="btn-nav-link">{item}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/signin" className="btn-nav-signin">Sign In</Link>
          <Link to="/register" className="btn-nav-getstarted">Get Started</Link>
        </div>
      </div>
    </nav>
  )
}

// ── Premium cursor glow — smooth-tracked, dual-layer ─────────────────────────
function CursorGlow() {
  const coreRef = useRef<HTMLDivElement>(null)
  const haloRef = useRef<HTMLDivElement>(null)
  // Actual mouse position
  const mouse = useRef({ x: -1000, y: -1000 })
  // Lerped (smooth) position — starts offscreen
  const smooth = useRef({ x: -1000, y: -1000 })
  const raf = useRef(0)
  const hue = useRef(220) // starts at blue

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove)

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const tick = () => {
      // Smooth follow — core tracks fast, halo tracks slow
      smooth.current.x = lerp(smooth.current.x, mouse.current.x, 0.12)
      smooth.current.y = lerp(smooth.current.y, mouse.current.y, 0.12)

      const scroll = window.scrollY
      const cx = smooth.current.x
      const cy = smooth.current.y + scroll

      // Slowly shift hue for iridescent color effect
      hue.current = (hue.current + 0.15) % 360
      const h = hue.current
      const halo_color1 = `hsla(${h}, 80%, 65%, 0.09)`
      const halo_color2 = `hsla(${(h + 40) % 360}, 80%, 60%, 0.04)`
      const core_color = `hsla(${(h + 20) % 360}, 90%, 70%, 0.18)`

      if (coreRef.current) {
        coreRef.current.style.transform = `translate(${cx - 200}px, ${cy - 200}px)`
        coreRef.current.style.background = `radial-gradient(circle at center, ${core_color} 0%, transparent 70%)`
      }
      if (haloRef.current) {
        // halo lerps extra slow for trailing effect
        haloRef.current.style.transform = `translate(${cx - 400}px, ${cy - 400}px)`
        haloRef.current.style.background = `radial-gradient(circle at center, ${halo_color1} 0%, ${halo_color2} 40%, transparent 70%)`
      }

      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <>
      {/* Tight bright core */}
      <div
        ref={coreRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: 400, height: 400,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
          willChange: 'transform',
          filter: 'blur(24px)',
          mixBlendMode: 'screen',
        }}
      />
      {/* Wide diffuse halo */}
      <div
        ref={haloRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: 800, height: 800,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
          willChange: 'transform',
          filter: 'blur(60px)',
        }}
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🔒', title: 'Sandboxed Execution', description: 'Every submission runs in an isolated Docker container with zero network access, memory caps, and hard time limits.', color: '#3B82F6' },
  { icon: '⚡', title: 'Instant Feedback', description: 'Know exactly why your solution failed — compilation errors, runtime panics, wrong output, or TLE — with actionable details.', color: '#14B8A6' },
  { icon: '🌐', title: 'Four Languages', description: 'Write solutions in Python, JavaScript, C++17, or Java 21. Each runtime is pinned and deterministic.', color: '#8B5CF6' },
  { icon: '📊', title: 'Track Progress', description: 'View your full submission history, track acceptance rates, and see improvement over time across all difficulty levels.', color: '#F59E0B' },
  { icon: '✍️', title: 'Problem Authoring', description: 'Problem setters get a full editorial workflow: draft, test cases, preview, review, and publish with versioned history.', color: '#F43F5E' },
  { icon: '🎯', title: 'Accurate Judging', description: 'Built-in checker modes — exact match, float tolerance, unordered tokens — handle the full range of problem types.', color: '#10B981' },
]

const PROBLEMS = [
  { id: 1, title: 'Two Sum', difficulty: 'Easy' as const, tags: ['Array', 'Hash Table'], acceptanceRate: 52 },
  { id: 2, title: 'Add Two Numbers', difficulty: 'Medium' as const, tags: ['Linked List', 'Math'], acceptanceRate: 41 },
  { id: 3, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium' as const, tags: ['Sliding Window'], acceptanceRate: 35 },
  { id: 4, title: 'Median of Two Sorted Arrays', difficulty: 'Hard' as const, tags: ['Binary Search'], acceptanceRate: 38 },
  { id: 5, title: 'Valid Parentheses', difficulty: 'Easy' as const, tags: ['Stack', 'String'], acceptanceRate: 67 },
]

// ── Workspace preview code lines ──────────────────────────────────────────────
const WORKSPACE_LINES: Array<[number, string, string][]> = [
  [[1, 'class ', '#C792EA'], [1, 'Solution:', '#E2E8F0']],
  [[2, '    def ', '#C792EA'], [2, 'twoSum', '#82AAFF'], [2, '(self, nums, target):', '#E2E8F0']],
  [[3, '        seen ', '#E2E8F0'], [3, '=', '#89DDFF'], [3, ' {}', '#E2E8F0']],
  [[4, '        ', '#E2E8F0'], [4, 'for ', '#C792EA'], [4, 'i, num ', '#E2E8F0'], [4, 'in ', '#C792EA'], [4, 'enumerate(nums):', '#E2E8F0']],
  [[5, '            comp ', '#E2E8F0'], [5, '=', '#89DDFF'], [5, ' target ', '#E2E8F0'], [5, '-', '#89DDFF'], [5, ' num', '#E2E8F0']],
  [[6, '            ', '#E2E8F0'], [6, 'if ', '#C792EA'], [6, 'comp ', '#E2E8F0'], [6, 'in ', '#C792EA'], [6, 'seen:', '#E2E8F0']],
  [[7, '                ', '#E2E8F0'], [7, 'return ', '#C792EA'], [7, '[seen[comp], i]', '#E2E8F0']],
  [[8, '            seen[num] ', '#E2E8F0'], [8, '=', '#89DDFF'], [8, ' i', '#E2E8F0']],
  [[9, '        ', '#E2E8F0'], [9, 'return ', '#C792EA'], [9, '[]', '#E2E8F0']],
]

// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [exampleIdx, setExampleIdx] = useState(0)
  const [heroState, setHeroState] = useState<'typing' | 'moving' | 'submitting' | 'done' | 'fading'>('typing')
  const [showResult, setShowResult] = useState(false)

  const currentExample = CODE_EXAMPLES[exampleIdx]

  const advance = useCallback(() => {
    const next = (exampleIdx + 1) % CODE_EXAMPLES.length
    // cycle: typing → moving → submitting → done → (2s pause) → fade → next example
    setHeroState('moving')
    setTimeout(() => {
      setHeroState('submitting')
      setTimeout(() => {
        setHeroState('done')
        setShowResult(true)
        setTimeout(() => {
          // Fade out before switching
          setHeroState('fading')
          setShowResult(false)
          setTimeout(() => {
            setExampleIdx(next)
            setHeroState('typing')
          }, 600)
        }, 2200)
      }, 900)
    }, 1100)
  }, [exampleIdx])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-ink)', position: 'relative' }}>
      {/* Global cursor glow that follows mouse across the whole page */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <CursorGlow />
      </div>

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', padding: 'var(--space-16) 0', zIndex: 1 }}>
        <div className="hero-grid" />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)', alignItems: 'center' }}>

            {/* LEFT */}
            <div className="animate-fade-in">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg,rgba(59,130,246,0.12),rgba(20,184,166,0.08))', border: '1px solid rgba(59,130,246,0.25)', fontSize: '0.8125rem', fontWeight: 600, color: '#60A5FA', marginBottom: 'var(--space-6)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', animation: 'pulse-dot 1.5s ease-in-out infinite', display: 'inline-block', flexShrink: 0 }} />
                Now in Early Access — Free forever
              </div>

              <h1 style={{ marginBottom: 'var(--space-6)', lineHeight: 1.08, letterSpacing: '-0.03em' }}>
                Write code.{' '}
                <span style={{ background: 'linear-gradient(135deg,#60A5FA 0%,#34D399 60%,#A78BFA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Solve problems.</span>
                {' '}Ship better software.
              </h1>

              <p style={{ fontSize: '1.125rem', lineHeight: 1.8, maxWidth: 460, marginBottom: 'var(--space-8)', color: '#94A3B8' }}>
                A developer-focused judge platform with secure sandboxed execution, real-time feedback, and a clean workspace built for focused problem solving.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 'var(--space-10)' }}>
                <Link to="/register" className="btn-hero-primary">Start Solving Free <span>→</span></Link>
                <Link to="/problems" className="btn-hero-secondary">Browse Problems</Link>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex' }}>
                  {['#3B82F6', '#14B8A6', '#8B5CF6', '#F59E0B', '#F43F5E'].map((c, i) => (
                    <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${c},${c}99)`, border: '2px solid rgba(11,16,32,0.8)', marginLeft: i > 0 ? -10 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'white', boxShadow: `0 0 10px ${c}50` }}>
                      {['A', 'B', 'C', 'D', 'E'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'white' }}>1,200+ developers</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>already solving problems</div>
                </div>
              </div>
            </div>

            {/* RIGHT — Cycling code editor */}
            <div className="animate-fade-in stagger-3" style={{ animationFillMode: 'both', position: 'relative' }}>

              {/* Fake cursor animation */}
              <div style={{
                position: 'absolute', top: 224, left: 155, zIndex: 10,
                pointerEvents: 'none',
                opacity: heroState !== 'typing' && heroState !== 'fading' ? 1 : 0,
                transform: heroState === 'moving' ? 'translate(318px, -182px)' : (heroState === 'submitting' || heroState === 'done' ? 'translate(318px, -182px) scale(0.85)' : 'none'),
                transition: heroState === 'moving' ? 'transform 1.0s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s' : 'transform 0.15s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
                filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.6))',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M6 3L18.5 13L13 14L15.5 20.5L12.5 21.5L10 15L4 18.5V3Z" fill="white" stroke="#1E293B" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
                <div style={{
                  position: 'absolute', top: -8, left: -8, width: 38, height: 38,
                  borderRadius: '50%', border: '2px solid rgba(255,255,255,0.85)',
                  transform: 'scale(0)', opacity: 0,
                  animation: heroState === 'submitting' ? 'ping-click 0.55s cubic-bezier(0,0,0.2,1) forwards' : 'none',
                }} />
              </div>

              {/* Animated gradient border */}
              <div style={{ position: 'absolute', inset: -1.5, borderRadius: 16, background: 'linear-gradient(135deg,#3B82F6,#14B8A6,#8B5CF6,#3B82F6)', backgroundSize: '300% 300%', animation: 'gradient-rotate 4s ease infinite', filter: 'blur(0.5px)' }} />

              {/* Editor chrome */}
              <div style={{
                position: 'relative', background: '#0d1117', borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                opacity: heroState === 'fading' ? 0 : 1,
                transition: 'opacity 0.5s ease',
              }}>
                {/* Title bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 10px 12px', background: 'rgba(0,0,0,0.55)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['#F43F5E', '#F59E0B', '#10B981'].map((c, i) => <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c, boxShadow: `0 0 5px ${c}80` }} />)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '3px 10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#4A6A7F', fontFamily: 'var(--font-code)' }}>{currentExample.filename}</span>
                      <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
                      <span style={{ padding: '1px 7px', borderRadius: 4, background: `${currentExample.diffColor}18`, border: `1px solid ${currentExample.diffColor}35`, fontSize: '0.65rem', fontWeight: 800, color: currentExample.diffColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{currentExample.difficulty}</span>
                      <span style={{ fontSize: '0.72rem', color: '#4A6A7F', fontFamily: 'var(--font-code)' }}>{currentExample.label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.7rem', color: '#4A6A7F', fontFamily: 'var(--font-code)' }}>{currentExample.language}</span>
                    <div style={{
                      padding: '4px 12px', borderRadius: 'var(--radius-md)',
                      background: heroState === 'submitting' || heroState === 'done' ? 'rgba(16,185,129,0.18)' : 'rgba(59,130,246,0.1)',
                      border: `1px solid ${heroState === 'submitting' || heroState === 'done' ? 'rgba(16,185,129,0.4)' : 'rgba(59,130,246,0.25)'}`,
                      fontSize: '0.72rem', fontWeight: 700,
                      color: heroState === 'submitting' || heroState === 'done' ? '#34D399' : '#60A5FA',
                      display: 'flex', alignItems: 'center', gap: 5,
                      transition: 'all 0.25s ease',
                      transform: heroState === 'submitting' ? 'scale(0.95)' : 'none',
                    }}>
                      {heroState === 'submitting' ? (
                        <>
                          <div style={{ width: 9, height: 9, border: '2px solid #34D399', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          Submitting
                        </>
                      ) : (
                        <>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill={heroState === 'done' ? '#34D399' : '#60A5FA'}><path d="M8 5v14l11-7z"/></svg>
                          Run Code
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Code area with line numbers gutter */}
                <div style={{ display: 'flex', background: '#0d1117', minHeight: 210 }}>
                  {/* Line numbers gutter */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRight: '1px solid rgba(255,255,255,0.04)', padding: '18px 0 10px', minWidth: 12 }} />
                  <div style={{ flex: 1 }}>
                    <TypewriterCode key={exampleIdx} exampleIdx={exampleIdx} onComplete={advance} />
                  </div>
                </div>

                {/* Progress dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.04)', justifyContent: 'center' }}>
                  {CODE_EXAMPLES.map((_, i) => (
                    <div key={i} style={{
                      width: i === exampleIdx ? 18 : 6,
                      height: 6, borderRadius: 3,
                      background: i === exampleIdx ? '#3B82F6' : 'rgba(255,255,255,0.12)',
                      transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                      boxShadow: i === exampleIdx ? '0 0 8px #3B82F680' : 'none',
                    }} />
                  ))}
                </div>

                {/* Result bar */}
                <div style={{
                  margin: '0 16px 16px', padding: '12px 18px',
                  background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.04))',
                  border: '1px solid rgba(16,185,129,0.22)', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: '0 0 28px rgba(16,185,129,0.1)',
                  opacity: showResult ? 1 : 0,
                  transform: showResult ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'all 0.45s cubic-bezier(0.25,1,0.5,1)',
                  maxHeight: showResult ? 80 : 0,
                  overflow: 'hidden',
                  marginTop: showResult ? 0 : -8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B98180', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-code)', fontWeight: 800, color: '#34D399', fontSize: '0.95rem', letterSpacing: '0.04em' }}>ACCEPTED</span>
                  </div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    {[['Runtime', currentExample.result.runtime], ['Memory', currentExample.result.memory], ['Beats', currentExample.result.beats]].map(([k, v], i) => (
                      <div key={k} style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', color: '#3D5A6E', fontFamily: 'var(--font-code)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: i === 2 ? '#34D399' : 'white', fontFamily: 'var(--font-code)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.08)', background: 'linear-gradient(180deg,rgba(59,130,246,0.03) 0%,transparent 100%)', padding: 'var(--space-12) 0', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-4)' }}>
            <AnimatedStat end={500} suffix="+" label="Problems curated" color="#3B82F6" />
            <AnimatedStat end={4} suffix="" label="Languages supported" color="#14B8A6" />
            <AnimatedStat end={60} suffix="s" label="Max submission budget" color="#8B5CF6" />
            <AnimatedStat end={99} suffix=".5%" label="API uptime target" color="#F59E0B" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-20) 0', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-14)' }}>
            <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, color: '#60A5FA', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Built Different</div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Everything you need to <span style={{ background: 'linear-gradient(135deg,#60A5FA,#34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>level up</span></h2>
            <p style={{ fontSize: '1.0625rem', maxWidth: 480, margin: '0 auto', color: 'var(--color-text-secondary)' }}>Not another LeetCode clone — built with security and developer experience as first-class concerns.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-5)' }}>
            {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 80} />)}
          </div>
        </div>
      </section>

      {/* ── PROBLEMS PREVIEW ─────────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-20) 0', background: 'linear-gradient(180deg,var(--color-surface-1) 0%,rgba(11,16,32,0.6) 100%)', borderTop: '1px solid var(--color-border-subtle)', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-16)', alignItems: 'flex-start' }}>
            <div style={{ paddingTop: 'var(--space-4)' }}>
              <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.18)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, color: '#2DD4BF', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Problem Catalogue</div>
              <h2 style={{ marginBottom: 'var(--space-4)' }}>Hundreds of problems, <span style={{ background: 'linear-gradient(135deg,#60A5FA,#34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>all difficulty levels</span></h2>
              <p style={{ marginBottom: 'var(--space-6)', fontSize: '1.0625rem', color: 'var(--color-text-secondary)' }}>From beginner-friendly array problems to advanced dynamic programming and graph algorithms. Filter by tag, difficulty, or acceptance rate.</p>
              <Link to="/problems" className="btn-problems-link">Browse All Problems →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PROBLEMS.map(p => <ProblemRow key={p.id} {...p} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── WORKSPACE PREVIEW ────────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-20) 0', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, color: '#A78BFA', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Workspace</div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>A workspace built for <span style={{ background: 'linear-gradient(135deg,#A78BFA,#60A5FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>deep focus</span></h2>
            <p style={{ fontSize: '1.0625rem', maxWidth: 480, margin: '0 auto', color: 'var(--color-text-secondary)' }}>Monaco editor, resizable panels, keyboard shortcuts, and automatic draft saves.</p>
          </div>

          <div style={{ position: 'relative', animation: 'float 9s ease-in-out infinite' }}>
            <div style={{ position: 'absolute', inset: -2, borderRadius: 16, background: 'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(139,92,246,0.15),rgba(20,184,166,0.15))', backgroundSize: '300% 300%', animation: 'gradient-rotate 5s ease infinite', filter: 'blur(16px)', opacity: 0.7 }} />
            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '36% 1fr 28%', height: 460, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'var(--color-surface-1)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>

              {/* Panel 1 — Problem */}
              <div style={{ borderRight: '1px solid var(--color-border)', padding: 'var(--space-5)', overflow: 'auto', background: 'rgba(13,17,23,0.8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <h4 style={{ fontSize: '1rem', margin: 0 }}>Two Sum</h4>
                  <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.7rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>Easy</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {['Array', 'Hash Table'].map(t => <span key={t} className="tag" style={{ fontSize: '0.7rem' }}>{t}</span>)}
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>
                  Given an array of integers <code style={{ color: '#60A5FA', fontFamily: 'var(--font-code)', fontSize: '0.8rem' }}>nums</code> and an integer <code style={{ color: '#60A5FA', fontFamily: 'var(--font-code)', fontSize: '0.8rem' }}>target</code>, return indices of the two numbers that add up to target.
                </p>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, fontFamily: 'var(--font-code)', fontSize: '0.8rem', lineHeight: 1.8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#3D5A6E', fontSize: '0.65rem', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Example 1</div>
                  <div style={{ color: '#94A3B8' }}>Input: nums = [2,7,11,15], target = 9</div>
                  <div style={{ color: '#34D399' }}>Output: [0,1]</div>
                </div>
              </div>

              {/* Panel 2 — Editor */}
              <div style={{ background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#3D5A6E', fontFamily: 'var(--font-code)' }}>solution.py</span>
                  <div style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.18)', fontSize: '0.7rem', color: '#60A5FA', fontFamily: 'var(--font-code)', fontWeight: 700 }}>Python 3.12</div>
                </div>
                <div style={{ padding: '16px 20px', fontFamily: '"JetBrains Mono","Fira Code",monospace', fontSize: '0.82rem', lineHeight: 1.9 }}>
                  {WORKSPACE_LINES.map((line, li) => (
                    <div key={li} style={{ display: 'flex', gap: 14, minHeight: '1.9em' }}>
                      <span style={{ color: '#1E3A4C', width: 18, textAlign: 'right', flexShrink: 0, userSelect: 'none' }}>{line[0][0]}</span>
                      <span style={{ whiteSpace: 'pre' }}>
                        {line.map(([, text, color], ti) => (
                          <span key={ti} style={{ color: color as string }}>{text}</span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 3 — Results */}
              <div style={{ background: 'rgba(13,17,23,0.9)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Test Results</div>
                {[{ id: 1, time: '12ms', mem: '14.1 MB' }, { id: 2, time: '8ms', mem: '14.2 MB' }, { id: 3, time: '15ms', mem: '14.0 MB' }].map(tc => (
                  <div key={tc.id} style={{ padding: 'var(--space-3)', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Case {tc.id}</span>
                      <span style={{ color: '#34D399', fontWeight: 800, fontFamily: 'var(--font-code)', fontSize: '0.7rem' }}>✓ PASS</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-code)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      <span>{tc.time}</span><span>{tc.mem}</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 'auto', padding: 'var(--space-3)', background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.04))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B98180', display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-code)', fontWeight: 800, color: '#34D399', fontSize: '0.875rem' }}>ACCEPTED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-20) 0', background: 'var(--color-surface-1)', borderTop: '1px solid var(--color-border-subtle)', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Ready to start coding?</h2>
            <p style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>Create a free account and start solving problems right now. No credit card required.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn-cta-primary">Create Free Account</Link>
              <Link to="/problems" className="btn-cta-secondary">Explore Problems</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--color-border-subtle)', background: 'var(--color-surface-0)', padding: 'var(--space-8) 0', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: '1.0625rem', color: 'white', textDecoration: 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                  <path d="M4 9l3-3 3 3 3-3" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 13l3-3 3 3 3-3" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                </svg>
              </div>
              Code<span style={{ color: '#60A5FA' }}>Judge</span>
            </Link>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {['Privacy Policy', 'Terms of Service', 'Status'].map(l => (
                <Link key={l} to="/" style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', textDecoration: 'none' }}>{l}</Link>
              ))}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', margin: 0 }}>© 2026 CodeJudge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
