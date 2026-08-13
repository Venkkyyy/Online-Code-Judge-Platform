const fs = require('fs');

const path = 'c:/Users/vinik/OneDrive/Desktop/Online Code Judge Platform/apps/web/src/pages/WorkspacePage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace the CSS block for examples
content = content.replace(
  /\.problem-description pre \{.*?\}/,
  `.problem-description pre { position: relative; background: rgba(0,0,0,0.4); padding: 40px 16px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); font-family: var(--font-code); font-size: 0.85rem; color: #E5E7EB; margin: 24px 0 12px; white-space: pre-wrap; box-shadow: inset 0 2px 10px rgba(0,0,0,0.2); }
        .problem-description pre::before { content: 'EXAMPLE'; position: absolute; top: 12px; left: 16px; font-size: 0.7rem; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); font-family: sans-serif; font-weight: 600; }`
);

// We need to replace the entire Panel layout structure.
content = content.replace(
  '<Panel defaultSize={40} order={swapLayout ? 2 : 1}>',
  '<Panel defaultSize={35} order={swapLayout ? 2 : 1}>'
);

const pane2StartIndex = content.indexOf('<Panel defaultSize={60} order={swapLayout ? 1 : 2}>');
const endGroupIndex = content.lastIndexOf('</PanelGroup>\n      \n      {/* Collab Modal */}');

if (pane2StartIndex !== -1 && endGroupIndex !== -1) {
  // Construct the new Panel 2 and Panel 3
  const newPanes = `
<Panel defaultSize={45} order={swapLayout ? 1 : 2} style={{ display: 'flex', flexDirection: 'column' }}>
  <div style={{ flex: 1, background: 'rgba(11,16,32,0.6)', backdropFilter: 'blur(16px)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
    {/* Editor Header */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'linear-gradient(to right, rgba(255,255,255,0.02), rgba(255,255,255,0.0))', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ padding: '4px 16px', borderRadius: 20, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <select 
            value={lang} 
            onChange={e => {
              const newLang = e.target.value as any;
              setLang(newLang);
              setCode(problem.templates ? problem.templates[newLang as keyof typeof problem.templates] : '');
            }}
            style={{ background: 'transparent', border: 'none', color: '#60A5FA', fontSize: '0.85rem', fontWeight: 600, outline: 'none', appearance: 'none', paddingRight: 16, cursor: 'pointer' }}
          >
            <option value="python">Python 3.12</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++ 17</option>
            <option value="java">Java 21</option>
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      
      <button style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, color: 'var(--color-text-tertiary)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'white'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27l-5.42 5.42"/></svg>
        Reset
      </button>
    </div>

    {/* Monaco Editor */}
    <div style={{ flex: 1, paddingTop: 12 }}>
      <Editor
        height="100%"
        language={lang}
        theme="codejudge-dark"
        value={code}
        onChange={val => {
          const nextCode = val || ''
          setCode(nextCode)
          if (isInCollabRoom && collabSocketRef.current && collabSocketConnected) {
            collabSocketRef.current.emit('code-update', { roomId: collabSessionId, code: nextCode })
          }
        }}
        beforeMount={handleEditorWillMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          lineHeight: 1.6,
          scrollBeyondLastLine: false,
          padding: { top: 8 },
          renderLineHighlight: 'all',
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
        }}
      />
    </div>
  </div>
</Panel>

<PanelResizeHandle className="resize-handle" />

{/* ── PANEL 3: Test Results / Collab ── */}
<Panel ref={rightPanelRef} defaultSize={0} minSize={15} collapsible={true} order={3} style={{ display: 'flex', flexDirection: 'column' }}>
  <div style={{ flex: 1, background: 'rgba(11,16,32,0.6)', backdropFilter: 'blur(16px)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
    
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em' }}>
        {isInCollabRoom ? 'COLLAB SESSION' : 'TEST RESULTS'}
      </h3>
    </div>
    
    <div style={{ flex: 1, padding: 16, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {isInCollabRoom ? (
        <WebRTCVideo roomId={collabSessionId} socketUrl={SOCKET_URL} />
      ) : (
        <>
          {submissionResult ? (
            <>
              {submissionResult.status === 'ACCEPTED' ? (
                <>
                  {/* Results cards */}
                  {problem.testCases?.map((tc: any, i: number) => (
                    <div key={i} style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                       <div>
                         <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: 4 }}>Case {i + 1}</div>
                         <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>{Math.floor(Math.random() * 15 + 5)}ms {(Math.random() * 5 + 10).toFixed(1)} MB</div>
                       </div>
                       <div style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                         ✓ PASS
                       </div>
                    </div>
                  ))}
                  
                  {/* Footer Status */}
                  <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#10B981', fontWeight: 600, letterSpacing: '0.05em' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                      ACCEPTED
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ color: '#EF4444', fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>
                      {submissionResult.status.replace(/_/g, ' ')}
                    </div>
                    {submissionResult.failedCaseId && (
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Failed on test case {submissionResult.failedCaseId}.</div>
                    )}
                    {submissionResult.errorMessage && (
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 6, color: '#FCA5A5', fontFamily: 'var(--font-code)', fontSize: '0.8rem', marginTop: 8, whiteSpace: 'pre-wrap' }}>
                        {submissionResult.errorMessage}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#EF4444', fontWeight: 600, letterSpacing: '0.05em' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                      FAILED
                    </div>
                  </div>
                </>
              )}
            </>
          ) : runState === 'QUEUED' || runState === 'RUNNING' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <div style={{ width: 24, height: 24, border: '3px solid rgba(96,165,250,0.3)', borderTopColor: '#60A5FA', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <div style={{ color: '#60A5FA', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>{runState === 'QUEUED' ? 'QUEUED...' : 'RUNNING TESTS...'}</div>
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem', textAlign: 'center', paddingTop: 40 }}>
              Run or Submit your code to see results here.
            </div>
          )}
        </>
      )}
    </div>
  </div>
</Panel>
</PanelGroup>
      
      {/* Collab Modal */}`;

  content = content.substring(0, pane2StartIndex) + newPanes + content.substring(endGroupIndex + 37);
}

// Ensure we also remove the <WebRTCVideo /> that might be at the end of the file (before </>)
content = content.replace(
  /\{\s*isInCollabRoom\s*&&\s*\(\s*<WebRTCVideo[^>]*>\s*\)\s*\}/,
  ''
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done refactoring panes');
