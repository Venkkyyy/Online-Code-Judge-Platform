import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function UserDropdown({ user, onSignOut }: { user: any, onSignOut: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <div style={{ 
          width: 32, height: 32, borderRadius: '50%', 
          background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(20,184,166,0.8))', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          color: 'white', fontSize: '0.9rem', fontWeight: 600,
          boxShadow: '0 0 10px rgba(59,130,246,0.3)', border: '2px solid rgba(255,255,255,0.2)'
        }}>
          {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
        </div>
      </button>

      {isOpen && (
        <div className="liquid-glass" style={{ 
          position: 'absolute', top: 40, right: 0, width: 200, 
          borderRadius: 12, padding: 8, border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', gap: 4, zIndex: 1000
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 4 }}>
            <div style={{ color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600 }}>{user.displayName || 'User'}</div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
          </div>
          
          <Link to="/profile" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '8px 12px', color: '#CBD5E1', textDecoration: 'none', fontSize: '0.85rem', borderRadius: 6, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Profile
          </Link>
          <Link to="/admin" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '8px 12px', color: '#CBD5E1', textDecoration: 'none', fontSize: '0.85rem', borderRadius: 6, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Admin Dashboard
          </Link>
          
          <button onClick={() => { setIsOpen(false); onSignOut(); }} style={{ textAlign: 'left', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#EF4444', fontSize: '0.85rem', borderRadius: 6, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
