import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type LayoutPreset = 'standard' | 'flipped' | 'stacked' | 'leet' | 'note' | 'debug' | 'focus';

export function LayoutDropdown({ value, onChange }: { value: LayoutPreset, onChange: (val: LayoutPreset) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.right - 280 // width is 280
      });
    }
  }, [isOpen]);

  const LayoutBox = ({ label, id, isLocked, children }: any) => (
    <div 
      onClick={() => {
        if (!isLocked) {
          onChange(id);
          if (id === 'focus') setIsOpen(false);
        }
      }}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8, cursor: isLocked ? 'not-allowed' : 'pointer',
        opacity: isLocked ? 0.5 : 1
      }}
    >
      <div style={{
        height: 70, background: value === id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${value === id ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 8, padding: 6, display: 'flex', gap: 4,
        transition: 'all 0.2s',
      }}>
        {children}
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: value === id ? '#60A5FA' : '#CBD5E1', display: 'flex', alignItems: 'center', gap: 4 }}>
        {isLocked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
        {label}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600,
          padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
          outline: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
        Layout: {value.charAt(0).toUpperCase() + value.slice(1)}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginLeft: 4 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && createPortal(
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 999 }} 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
          />
          <div className="liquid-glass" style={{
            position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: 280,
            borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', flexDirection: 'column', gap: 16, zIndex: 1000,
            background: 'var(--color-surface-2)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>Layouts</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Hints
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <LayoutBox label="Default" id="standard">
                <div style={{ width: '40%', background: 'rgba(255,255,255,0.1)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }} />
                <div style={{ width: '60%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }} />
                  <div style={{ height: '30%', background: 'rgba(255,255,255,0.1)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              </LayoutBox>
              
              <LayoutBox label="Leet" id="leet">
                <div style={{ width: '30%', background: 'rgba(255,255,255,0.1)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }} />
                <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }} />
                  <div style={{ height: '20%', background: 'rgba(255,255,255,0.1)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div style={{ width: '30%', background: 'rgba(255,255,255,0.1)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }} />
              </LayoutBox>

              <LayoutBox label="Note-taking" id="note">
                <div style={{ width: '25%', background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
                <div style={{ width: '45%', background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
                <div style={{ width: '30%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
                  <div style={{ height: '30%', background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
                </div>
              </LayoutBox>

              <LayoutBox label="Debug" id="debug">
                <div style={{ width: '30%', background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
                <div style={{ width: '30%', background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
                <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
                  <div style={{ height: '30%', background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
                </div>
              </LayoutBox>
            </div>

            <button 
              onClick={() => { onChange('focus'); setIsOpen(false); }}
              style={{
                width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              🧘 Focus Mode
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
