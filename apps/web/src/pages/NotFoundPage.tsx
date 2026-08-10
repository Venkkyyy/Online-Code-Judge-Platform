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
      <div className="hero-grid" />
      <div className="orb orb-blue" style={{ width: 400, height: 400, top: '20%', left: '30%', opacity: 0.15 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: 'clamp(5rem, 15vw, 9rem)',
            fontWeight: 900,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            marginBottom: 'var(--space-4)',
          }}
          className="gradient-text"
        >
          404
        </div>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>Page not found</h2>
        <p style={{ marginBottom: 'var(--space-8)', maxWidth: '380px', fontSize: '1.0625rem' }}>
          This page doesn't exist or has been moved. Head back home or try solving a problem instead.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">Go Home</Link>
          <Link to="/problems" className="btn btn-secondary">Browse Problems</Link>
        </div>
      </div>
    </div>
  )
}
