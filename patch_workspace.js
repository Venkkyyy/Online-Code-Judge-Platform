const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/web/src/pages/WorkspacePage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
if (!content.includes('react-resizable-panels')) {
  content = content.replace(
    "import { io, Socket } from 'socket.io-client'",
    "import { io, Socket } from 'socket.io-client'\nimport { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'"
  );
}

// 2. Add SwapLayout state
if (!content.includes('swapLayout')) {
  content = content.replace(
    "const [collabModalOpen, setCollabModalOpen] = useState(false)",
    "const [swapLayout, setSwapLayout] = useState(false)\n  ;(window as any).toggleSwapLayout = () => setSwapLayout(s => !s)\n\n  const [collabModalOpen, setCollabModalOpen] = useState(false)"
  );
}

// 3. Add Swap Layout button
if (!content.includes('Swap Layout')) {
  content = content.replace(
    "      {/* Center - Run / Submit / Collab */}\n      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>\n        <button \n          onClick={onRun}",
    "      {/* Center - Run / Submit / Collab */}\n      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>\n        <button \n          onClick={(window as any).toggleSwapLayout}\n          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}\n        >\n          <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\"><path d=\"M7 16V4m0 0L3 8m4-4l4 4m6 12V8m0 12l-4-4m4 4l4-4\"/></svg>\n          Swap Layout\n        </button>\n        <button \n          onClick={onRun}"
  );
}

// 4. Add CSS styles
if (!content.includes('.resize-handle')) {
  content = content.replace(
    ".problem-description strong { color: #E2E8F0; }\n      `}</style>",
    ".problem-description strong { color: #E2E8F0; }\n        .resize-handle { width: 8px; background: transparent; transition: background 0.2s; position: relative; display: flex; align-items: center; justify-content: center; z-index: 10; }\n        .resize-handle:hover, .resize-handle:active { background: rgba(59,130,246,0.3); }\n        .resize-handle::after { content: ''; width: 2px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 2px; }\n        .resize-handle-horizontal { height: 8px; width: 100%; cursor: row-resize; }\n        .resize-handle-horizontal::after { width: 32px; height: 2px; }\n      `}</style>"
  );
}

// 5. Replace layout
content = content.replace(
  "<div style={{ flex: 1, padding: 8, height: 'calc(100vh - 50px)', display: 'flex', gap: 8 }}>",
  "<PanelGroup direction=\"horizontal\" style={{ flex: 1, padding: 8, height: 'calc(100vh - 50px)', gap: 8 }}>"
);
content = content.replace(
  "<div style={{ width: '40%', background: 'var(--color-surface-1)', borderRadius: 10, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>",
  "<Panel defaultSize={40} order={swapLayout ? 2 : 1}>\n<div style={{ height: '100%', background: 'var(--color-surface-1)', borderRadius: 10, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>"
);
content = content.replace(
  "{/* ── RIGHT PANE: Code + Console ── */}",
  "</Panel>\n<PanelResizeHandle className=\"resize-handle\" />\n<Panel defaultSize={60} order={swapLayout ? 1 : 2}>\n<PanelGroup direction=\"vertical\">\n{/* ── RIGHT PANE: Code + Console ── */}"
);
content = content.replace(
  "<div style={{ width: '60%', display: 'flex', flexDirection: 'column', gap: 8 }}>",
  "<div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>"
);
content = content.replace(
  "<div style={{ flex: '60%', background: 'var(--color-surface-1)', borderRadius: 10, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>",
  "<Panel defaultSize={60}>\n<div style={{ height: '100%', background: 'var(--color-surface-1)', borderRadius: 10, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>"
);
content = content.replace(
  "{/* BOTTOM: Console / Test cases */}",
  "</div>\n</Panel>\n<PanelResizeHandle className=\"resize-handle resize-handle-horizontal\" />\n<Panel defaultSize={40}>\n{/* BOTTOM: Console / Test cases */}"
);
content = content.replace(
  "<div style={{ flex: '40%', background: 'var(--color-surface-1)', borderRadius: 10, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>",
  "<div style={{ height: '100%', background: 'var(--color-surface-1)', borderRadius: 10, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>"
);
content = content.replace(
  "                  </div>\n                </div>\n\n              )\n            }\n          </div>\n        </div>\n\n        {/* Collab Modal */}",
  "                  </div>\n                </div>\n\n              )\n            }\n          </div>\n        </div>\n</Panel>\n</PanelGroup>\n</Panel>\n</PanelGroup>\n\n        {/* Collab Modal */}"
);

// 6. Collab Modal UI (Add Join tab)
const oldModalStr = `              <h2 style={{ fontSize: '1.4rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                {isJoiningCollab ? 'Join Collab Session' : 'Collab Session'}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.6 }}>
                {isJoiningCollab ? 'Enter the password provided by your friend to join this session.' : 'Generate a secure session to code and video chat with a friend in real-time.'}
              </p>`;

const newModalStr = `              <h2 style={{ fontSize: '1.4rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                Collab Session
              </h2>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 24 }}>
                <button onClick={() => setIsJoiningCollab(false)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: !isJoiningCollab ? '#A78BFA' : 'var(--color-text-secondary)', fontWeight: !isJoiningCollab ? 600 : 400, borderBottom: !isJoiningCollab ? '2px solid #A78BFA' : '2px solid transparent', cursor: 'pointer' }}>Create Session</button>
                <button onClick={() => setIsJoiningCollab(true)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: isJoiningCollab ? '#A78BFA' : 'var(--color-text-secondary)', fontWeight: isJoiningCollab ? 600 : 400, borderBottom: isJoiningCollab ? '2px solid #A78BFA' : '2px solid transparent', cursor: 'pointer' }}>Join Session</button>
              </div>`;

if (content.includes("isJoiningCollab ? 'Join Collab Session' : 'Collab Session'")) {
  content = content.replace(oldModalStr, newModalStr);
}

const oldJoinStr = `              {isJoiningCollab ? (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Password</label>
                    <input 
                      type="text"
                      value={collabPassword}
                      onChange={(e) => setCollabPassword(e.target.value.toUpperCase())}
                      placeholder="Enter 6-digit PIN"
                      style={{ width: '100%', marginTop: 6, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 14px', borderRadius: 8, color: 'white', fontSize: '1.2rem', fontFamily: 'var(--font-code)', letterSpacing: '0.2em', textAlign: 'center', fontWeight: 800 }} 
                    />
                  </div>`;

const newJoinStr = `              {isJoiningCollab ? (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session ID</label>
                    <input 
                      type="text"
                      value={collabSessionId || ''}
                      onChange={(e) => setCollabSessionId(e.target.value.toUpperCase())}
                      placeholder="Enter 6-character ID"
                      style={{ width: '100%', marginTop: 6, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 14px', borderRadius: 8, color: 'white', fontSize: '1.1rem', fontFamily: 'var(--font-code)', letterSpacing: '0.1em', textAlign: 'center', fontWeight: 600 }} 
                    />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Password</label>
                    <input 
                      type="text"
                      value={collabPassword}
                      onChange={(e) => setCollabPassword(e.target.value.toUpperCase())}
                      placeholder="Enter 6-digit PIN"
                      style={{ width: '100%', marginTop: 6, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 14px', borderRadius: 8, color: 'white', fontSize: '1.1rem', fontFamily: 'var(--font-code)', letterSpacing: '0.1em', textAlign: 'center', fontWeight: 600 }} 
                    />
                  </div>`;

if (content.includes("placeholder=\"Enter 6-digit PIN\"") && !content.includes("Enter 6-character ID")) {
  content = content.replace(oldJoinStr, newJoinStr);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched WorkspacePage.tsx');
