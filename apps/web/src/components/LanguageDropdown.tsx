import { useState, useRef, useEffect } from 'react';

export function LanguageDropdown({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options = [
    { value: 'python', label: 'Python 3' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'cpp', label: 'C++ 17' },
    { value: 'java', label: 'Java 21' },
  ];

  const currentLabel = options.find(o => o.value === value)?.label || 'Language';

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
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
          color: '#60A5FA', fontSize: '0.85rem', fontWeight: 600,
          padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
          outline: 'none', transition: 'all 0.2s'
        }}
      >
        {currentLabel}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="3" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="liquid-glass" style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 140,
          borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', gap: 2, zIndex: 1000,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              style={{
                textAlign: 'left', padding: '8px 12px', background: value === opt.value ? 'rgba(59,130,246,0.2)' : 'transparent',
                border: 'none', color: value === opt.value ? '#60A5FA' : '#CBD5E1',
                fontSize: '0.85rem', fontWeight: value === opt.value ? 600 : 500,
                borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (value !== opt.value) e.currentTarget.style.background = 'transparent' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
