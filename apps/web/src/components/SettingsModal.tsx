import { useState, useEffect } from 'react';

export interface EditorSettings {
  theme: string;
  fontSize: number;
  tabSize: number;
}

export function SettingsModal({ isOpen, onClose, settings, setSettings }: { isOpen: boolean, onClose: () => void, settings: EditorSettings, setSettings: (s: EditorSettings) => void }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="liquid-glass" style={{ width: 400, borderRadius: 16, padding: 24, position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ margin: '0 0 20px', color: '#fff', fontSize: '1.2rem', fontWeight: 600 }}>Editor Settings</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#E2E8F0', fontSize: '0.9rem' }}>Theme</span>
            <select 
              value={settings.theme}
              onChange={e => setSettings({ ...settings, theme: e.target.value })}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 8, outline: 'none' }}>
              <option value="codejudge-dark" style={{ background: '#1e293b' }}>CodeJudge Dark</option>
              <option value="vs-dark" style={{ background: '#1e293b' }}>VS Dark</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#E2E8F0', fontSize: '0.9rem' }}>Font Size</span>
            <select 
              value={settings.fontSize.toString()}
              onChange={e => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 8, outline: 'none' }}>
              <option value="12" style={{ background: '#1e293b' }}>12px</option>
              <option value="14" style={{ background: '#1e293b' }}>14px</option>
              <option value="16" style={{ background: '#1e293b' }}>16px</option>
              <option value="18" style={{ background: '#1e293b' }}>18px</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#E2E8F0', fontSize: '0.9rem' }}>Tab Size</span>
            <select 
              value={settings.tabSize.toString()}
              onChange={e => setSettings({ ...settings, tabSize: parseInt(e.target.value) })}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 8, outline: 'none' }}>
              <option value="2" style={{ background: '#1e293b' }}>2 spaces</option>
              <option value="4" style={{ background: '#1e293b' }}>4 spaces</option>
            </select>
          </div>
        </div>

        <button onClick={onClose} style={{ marginTop: 24, width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: 'rgba(59,130,246,0.2)', color: '#60A5FA', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
          Done
        </button>
      </div>
    </div>
  );
}
