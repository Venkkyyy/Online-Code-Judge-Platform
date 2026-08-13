import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../lib/firebase'

function BrandPanel() {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, #0d1b35 0%, #0a1628 50%, #071220 100%)',
      borderRight: '1px solid rgba(59,130,246,0.1)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: 'var(--space-10)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, top: -100, right: -80,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)',
        animation: 'float 10s ease-in-out infinite', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, bottom: -40, left: -60,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 65%)',
        animation: 'float 8s ease-in-out infinite', animationDelay: '-4s', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontWeight: 800, fontSize: '1.375rem', color: 'white',
          textDecoration: 'none', letterSpacing: '-0.03em',
          marginBottom: 'var(--space-14)',
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

        <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 1.875rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: 'var(--space-4)', color: 'white' }}>
          Join thousands of developers solving problems every day
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.9375rem', lineHeight: 1.75, marginBottom: 'var(--space-8)' }}>
          Free forever. No credit card required. Start solving in 60 seconds.
        </p>

        {/* Progress visual — shows problem completion */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          {[
            { label: 'Easy Problems', pct: 68, color: '#10B981' },
            { label: 'Medium Problems', pct: 42, color: '#F59E0B' },
            { label: 'Hard Problems', pct: 15, color: '#F43F5E' },
          ].map(({ label, pct, color }) => (
            <div key={label} style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color, fontFamily: 'var(--font-code)' }}>{pct}% solved</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}99, ${color})`,
                  borderRadius: 'var(--radius-full)',
                  boxShadow: `0 0 8px ${color}60`,
                  transition: 'width 1s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Language badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { lang: 'Python', color: '#3B82F6' },
            { lang: 'JavaScript', color: '#F59E0B' },
            { lang: 'C++17', color: '#8B5CF6' },
            { lang: 'Java 21', color: '#14B8A6' },
          ].map(({ lang, color }) => (
            <div key={lang} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: `${color}12`, border: `1px solid ${color}30`,
              fontSize: '0.8rem', fontWeight: 700, color,
              fontFamily: 'var(--font-code)',
              boxShadow: `0 0 10px ${color}15`,
            }}>{lang}</div>
          ))}
        </div>
      </div>

      {/* Bottom stats */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        {[
          { value: '500+', label: 'Problems', color: '#60A5FA' },
          { value: '1.2K+', label: 'Users', color: '#34D399' },
          { value: '60s', label: 'Max time', color: '#A78BFA' },
          { value: '4', label: 'Languages', color: '#FCD34D' },
        ].map(({ value, label, color }) => (
          <div key={label} style={{
            padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1 = name/email, 2 = password
  const navigate = useNavigate()

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const getPasswordStrength = (pw: string) => {
    if (!pw) return null
    if (pw.length < 8) return { level: 1, label: 'Too short', color: '#F43F5E' }
    if (pw.length < 12) return { level: 2, label: 'Weak — needs 12+ chars', color: '#F59E0B' }
    if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { level: 3, label: 'Fair — add uppercase & numbers', color: '#F59E0B' }
    return { level: 4, label: 'Strong ✓', color: '#10B981' }
  }

  const strength = getPasswordStrength(form.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 12) { setError('Password must be at least 12 characters.'); return }
    setIsLoading(true); setError('')
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await updateProfile(userCredential.user, { displayName: form.displayName })
      navigate('/problems')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to create account.')
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
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--color-ink)' }}>
      <BrandPanel />

      {/* Right: Form */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-10) var(--space-8)',
        background: 'var(--color-ink)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div className="liquid-orb" style={{ width: 500, height: 500, background: 'rgba(139,92,246,0.08)', top: '10%', left: '10%', position: 'absolute' }} />
        <div className="liquid-orb liquid-orb-sm" style={{ width: 300, height: 300, background: 'rgba(59,130,246,0.08)', bottom: '15%', right: '5%', position: 'absolute', animationDelay: '-6s' }} />

        <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 'var(--space-8)' }}>
            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-6)' }}>
              {[1, 2].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: step >= s ? 'var(--color-blue)' : 'var(--color-surface-3)',
                    border: `2px solid ${step >= s ? 'var(--color-blue)' : 'var(--color-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 800, color: 'white',
                    boxShadow: step >= s ? '0 0 12px rgba(59,130,246,0.4)' : 'none',
                    transition: 'all 0.2s ease',
                  }}>
                    {step > s ? '✓' : s}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: step >= s ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                    {s === 1 ? 'Your info' : 'Password'}
                  </span>
                  {s < 2 && <div style={{ width: 32, height: 2, background: step > s ? 'var(--color-blue)' : 'var(--color-border)', transition: 'background 0.2s ease', borderRadius: 'var(--radius-full)' }} />}
                </div>
              ))}
            </div>

            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
              {step === 1 ? 'Create your account' : 'Set your password'}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
              {step === 1 ? 'Free forever. Start solving in 60 seconds.' : 'Choose a strong password (12+ characters)'}
            </p>
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

            {step === 1 ? (
              <>
                <div className="form-group">
                  <label className="label" htmlFor="displayName" style={{ fontWeight: 600 }}>Display Name</label>
                  <input
                    id="displayName" type="text" className="liquid-input"
                    placeholder="e.g. Alice Chen"
                    value={form.displayName} onChange={handleChange('displayName')}
                    required autoComplete="name"
                    style={{ fontSize: '1rem', padding: '14px 16px', borderRadius: 'var(--radius-lg)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="reg-email" style={{ fontWeight: 600 }}>Email address</label>
                  <input
                    id="reg-email" type="email" className="liquid-input"
                    placeholder="you@example.com"
                    value={form.email} onChange={handleChange('email')}
                    required autoComplete="email"
                    style={{ fontSize: '1rem', padding: '14px 16px', borderRadius: 'var(--radius-lg)' }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="label" htmlFor="reg-password" style={{ fontWeight: 600 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="reg-password" type={showPassword ? 'text' : 'password'} className="liquid-input"
                      placeholder="Minimum 12 characters"
                      value={form.password} onChange={handleChange('password')}
                      required autoComplete="new-password" minLength={12}
                      style={{ fontSize: '1rem', padding: '14px 48px 14px 16px', borderRadius: 'var(--radius-lg)' }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', fontSize: '1.1rem', padding: 4, display: 'flex', alignItems: 'center' }}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {strength && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                        {[1,2,3,4].map(l => (
                          <div key={l} style={{
                            flex: 1, height: 4, borderRadius: 'var(--radius-full)',
                            background: l <= strength.level ? strength.color : 'var(--color-surface-3)',
                            boxShadow: l <= strength.level ? `0 0 6px ${strength.color}60` : 'none',
                            transition: 'all 0.2s ease',
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: strength.color, fontWeight: 500 }}>{strength.label}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="confirmPassword" style={{ fontWeight: 600 }}>Confirm Password</label>
                  <input
                    id="confirmPassword" type="password"
                    className={`liquid-input ${form.confirmPassword && form.password !== form.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Repeat your password"
                    value={form.confirmPassword} onChange={handleChange('confirmPassword')}
                    required autoComplete="new-password"
                    style={{ fontSize: '1rem', padding: '14px 16px', borderRadius: 'var(--radius-lg)' }}
                  />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <span className="form-error" style={{ marginTop: 6 }}>⚠️ Passwords don't match</span>
                  )}
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', lineHeight: 1.6 }}>
                  By creating an account, you agree to our{' '}
                  <Link to="/terms" style={{ color: 'var(--color-blue)' }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" style={{ color: 'var(--color-blue)' }}>Privacy Policy</Link>.
                </p>
              </>
            )}

            {error && (
              <div className="liquid-glass-rose animate-shake" style={{
                padding: '12px 16px', borderRadius: 'var(--radius-lg)',
                fontSize: '0.875rem', color: '#F87171',
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <span>⚠️</span>{error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)} className="liquid-btn liquid-glass-hover" style={{
                  flex: '0 0 auto', padding: '14px 20px',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer', fontFamily: 'var(--font-ui)',
                }}>← Back</button>
              )}
              <button
                id="register-submit"
                type="submit"
                disabled={isLoading}
                className="liquid-btn"
                style={{
                  flex: 1, padding: '14px',
                  background: isLoading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3B82F6, #14B8A6)',
                  border: 'none', borderRadius: 'var(--radius-lg)',
                  color: 'white', fontWeight: 700, fontSize: '1rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: isLoading ? 'none' : '0 4px 20px rgba(59,130,246,0.4)',
                  transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: 'var(--font-ui)', backgroundSize: '200% 200%', animation: 'gradient-x 3s ease infinite',
                }}
              >
                {isLoading ? (
                  <>
                    <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    Creating account...
                  </>
                ) : step === 1 ? 'Continue →' : 'Create Free Account'}
              </button>
            </div>
          </form>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="liquid-btn liquid-glass-hover"
            style={{ 
              width: '100%', padding: '12px', color: 'white', 
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
            Already have an account?
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          <Link to="/signin" className="liquid-glass-hover" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px', width: '100%',
            borderRadius: 'var(--radius-lg)', color: 'var(--color-text-primary)',
            fontWeight: 600, fontSize: '0.9375rem', textDecoration: 'none',
          }}>
            Sign in to your account →
          </Link>
        </div>
      </div>
    </div>
  )
}
