import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../lib/firebase'

// Left brand panel shown on auth pages
function BrandPanel() {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, #0d1b35 0%, #0a1628 50%, #071220 100%)',
      borderRight: '1px solid rgba(59,130,246,0.1)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: 'var(--space-10)',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)',
        pointerEvents: 'none',
      }} />

      {/* Orbs */}
      <div style={{
        position: 'absolute', width: 400, height: 400, top: -100, left: -80,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 65%)',
        animation: 'float 10s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, bottom: -60, right: -60,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 65%)',
        animation: 'float 8s ease-in-out infinite',
        animationDelay: '-4s',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontWeight: 800, fontSize: '1.375rem', color: 'white',
          textDecoration: 'none', letterSpacing: '-0.03em',
          marginBottom: 'var(--space-16)',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(20,184,166,0.2))',
            border: '1px solid rgba(59,130,246,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(59,130,246,0.3)',
          }}>
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <path d="M4 9l3-3 3 3 3-3" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 13l3-3 3 3 3-3" stroke="#14B8A6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
            </svg>
          </div>
          Code<span style={{ color: '#60A5FA' }}>Judge</span>
        </Link>

        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: 'var(--space-5)', color: 'white' }}>
          The coding platform built for{' '}
          <span style={{
            background: 'linear-gradient(135deg, #60A5FA, #34D399)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>real developers</span>
        </h2>
        <p style={{ color: '#64748B', fontSize: '1rem', lineHeight: 1.75, maxWidth: 360, marginBottom: 'var(--space-10)' }}>
          Secure sandboxed execution, instant verdicts, and a workspace that gets out of your way.
        </p>

        {/* Feature bullets */}
        {[
          { icon: '🔒', text: 'Sandboxed execution — your code can\'t escape' },
          { icon: '⚡', text: 'Results in seconds, not minutes' },
          { icon: '🌐', text: 'Python, JavaScript, C++17, Java 21' },
          { icon: '📊', text: 'Full submission history and progress tracking' },
        ].map((item, i) => (
          <div key={i} className="liquid-glass liquid-glass-hover" style={{
            display: 'flex', alignItems: 'center', gap: 14,
            marginBottom: 'var(--space-3)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-lg)',
            animation: `fadeInUp 0.5s ease both`,
            animationDelay: `${i * 0.1 + 0.3}s`,
          }}>
            <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: '0.875rem', color: '#94A3B8', fontWeight: 500 }}>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Bottom testimonial */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: 'var(--space-5)',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 'var(--radius-xl)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#F59E0B', fontSize: '0.875rem' }}>★</span>)}
        </div>
        <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.7, marginBottom: 12, fontStyle: 'italic' }}>
          "Finally a judge platform that actually tells me why my solution failed — not just 'Wrong Answer'."
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 800, color: 'white',
          }}>A</div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>Alex M.</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Software Engineer</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/problems')
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      navigate('/problems')
    } catch (err: any) {
      console.error(err)
      setError('Google Sign-In failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--color-ink)',
    }}>
      {/* Left: Brand panel */}
      <BrandPanel />

      {/* Right: Form */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-10) var(--space-8)',
        background: 'var(--color-ink)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient orbs for liquid glass effect */}
        <div className="liquid-orb" style={{ width: 500, height: 500, background: 'rgba(59,130,246,0.08)', top: '20%', left: '10%', position: 'absolute' }} />
        <div className="liquid-orb liquid-orb-sm" style={{ width: 300, height: 300, background: 'rgba(20,184,166,0.07)', bottom: '10%', right: '5%', position: 'absolute', animationDelay: '-6s' }} />

        <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
              Welcome back 👋
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
              Sign in to continue solving problems
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="form-group">
              <label className="label" htmlFor="email" style={{ fontWeight: 600 }}>Email address</label>
              <input
                id="email"
                type="email"
                className="liquid-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ width: '100%', fontSize: '1rem', padding: '14px 16px', borderRadius: 'var(--radius-lg)' }}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="label" htmlFor="password" style={{ margin: 0, fontWeight: 600 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.8125rem', color: 'var(--color-blue)', fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="liquid-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ width: '100%', fontSize: '1rem', padding: '14px 48px 14px 16px', borderRadius: 'var(--radius-lg)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-tertiary)', fontSize: '1.1rem', padding: 4,
                    display: 'flex', alignItems: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="liquid-glass-rose animate-shake" style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.875rem', color: '#F87171',
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>⚠️</span>
                {error}
              </div>
            )}

            <button
              id="signin-submit"
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #3B82F6, #14B8A6)',
                backgroundSize: '200% 200%',
                animation: 'gradient-x 3s ease infinite',
                border: 'none', borderRadius: 'var(--radius-lg)',
                color: 'white', fontWeight: 700, fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 24px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: 'var(--font-ui)',
                opacity: isLoading ? 0.75 : 1,
              }}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
                  Signing in...
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="liquid-btn liquid-glass-hover"
            style={{ 
              width: '100%', padding: '12px', color: 'white', 
              borderRadius: 'var(--radius-lg)', 
              fontSize: '0.9375rem', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              marginTop: 16
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, margin: 'var(--space-6) 0',
            color: 'var(--color-text-tertiary)', fontSize: '0.875rem',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            New to CodeJudge?
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          <Link to="/register" className="liquid-btn liquid-glass-hover" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px', width: '100%',
            borderRadius: 'var(--radius-lg)', color: 'var(--color-text-primary)',
            fontWeight: 600, fontSize: '0.9375rem', textDecoration: 'none',
          }}>
            Create a free account →
          </Link>
        </div>
      </div>
    </div>
  )
}
