import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-ink)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-8)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Liquid glass ambient orbs */}
      <div className="liquid-orb liquid-orb-lg" style={{ width: 600, height: 600, background: 'rgba(59,130,246,0.12)', top: '-10%', left: '-5%' }} />
      <div className="liquid-orb" style={{ width: 400, height: 400, background: 'rgba(139,92,246,0.10)', bottom: '-5%', right: '5%', animationDelay: '-7s' }} />
      <div className="liquid-orb liquid-orb-sm" style={{ width: 250, height: 250, background: 'rgba(20,184,166,0.08)', top: '30%', right: '20%', animationDelay: '-3s' }} />

      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, animation: 'fadeInUp 0.6s ease both' }}>
        {/* Glitch 404 */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              fontFamily: 'var(--font-code)',
              fontSize: 'clamp(6rem, 18vw, 11rem)',
              fontWeight: 900,
              letterSpacing: '-0.05em',
              lineHeight: 1,
              background: 'linear-gradient(135deg, #60A5FA 0%, #34D399 50%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              userSelect: 'none',
            }}
          >
            404
          </div>
          {/* Glitch layer 1 */}
          <div style={{
            position: 'absolute', inset: 0,
            fontFamily: 'var(--font-code)',
            fontSize: 'clamp(6rem, 18vw, 11rem)',
            fontWeight: 900,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            color: '#60A5FA',
            opacity: 0.4,
            animation: 'glitch-1 4s ease-in-out infinite',
            animationDelay: '1s',
            userSelect: 'none',
          }}>
            404
          </div>
          {/* Glitch layer 2 */}
          <div style={{
            position: 'absolute', inset: 0,
            fontFamily: 'var(--font-code)',
            fontSize: 'clamp(6rem, 18vw, 11rem)',
            fontWeight: 900,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            color: '#F43F5E',
            opacity: 0.35,
            animation: 'glitch-2 4s ease-in-out infinite',
            animationDelay: '1.3s',
            userSelect: 'none',
          }}>
            404
          </div>
        </div>

        <h2 style={{ marginBottom: 'var(--space-3)', fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
          Page not found
        </h2>
        <p style={{ marginBottom: 'var(--space-8)', maxWidth: '400px', fontSize: '1.0625rem', color: 'var(--color-text-secondary)' }}>
          This page doesn't exist or has been moved. Head back home or try solving a problem instead.
        </p>

        {/* Floating glass code card */}
        <div className="liquid-glass animate-fadeInUp delay-300" style={{
          borderRadius: 12, padding: '16px 24px', marginBottom: 'var(--space-8)',
          maxWidth: 360, margin: '0 auto var(--space-8)',
          fontFamily: 'var(--font-code)', fontSize: '0.85rem', textAlign: 'left',
          color: 'var(--color-text-tertiary)',
          lineHeight: 1.8,
        }}>
          <span style={{ color: '#94A3B8' }}>// Oops, you've wandered off the map</span><br />
          <span style={{ color: '#60A5FA' }}>const</span> <span style={{ color: '#34D399' }}>page</span> = <span style={{ color: '#F59E0B' }}>await</span> find(<span style={{ color: '#F87171' }}>'this-route'</span>);<br />
          <span style={{ color: '#60A5FA' }}>if</span> (!page) {'{'}<br />
          &nbsp;&nbsp;<span style={{ color: '#F59E0B' }}>throw</span> <span style={{ color: '#A78BFA' }}>new</span> Error(<span style={{ color: '#F87171' }}>'404 Not Found'</span>);<br />
          {'}'}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/"
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #3B82F6, #14B8A6)',
              backgroundSize: '200% 200%',
              animation: 'gradient-x 3s ease infinite',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            ← Go Home
          </Link>
          <Link
            to="/problems"
            className="liquid-btn liquid-glass-hover"
            style={{
              padding: '12px 28px',
              borderRadius: 10,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            Browse Problems →
          </Link>
        </div>
      </div>
    </div>
  )
}
