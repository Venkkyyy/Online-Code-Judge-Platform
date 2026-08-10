import { useState, useRef, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useAuth } from '../contexts/AuthContext'

// ── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_PROBLEM = {
  id: 1,
  title: 'Two Sum',
  difficulty: 'Easy',
  description: `
<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>
<p>You may assume that each input would have <strong><em>exactly</em> one solution</strong>, and you may not use the same element twice.</p>
<p>You can return the answer in any order.</p>
<br/>
<p><strong>Example 1:</strong></p>
<pre><strong>Input:</strong> nums = [2,7,11,15], target = 9
<strong>Output:</strong> [0,1]
<strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].</pre>
<p><strong>Example 2:</strong></p>
<pre><strong>Input:</strong> nums = [3,2,4], target = 6
<strong>Output:</strong> [1,2]</pre>
<p><strong>Example 3:</strong></p>
<pre><strong>Input:</strong> nums = [3,3], target = 6
<strong>Output:</strong> [0,1]</pre>
<br/>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>2 <= nums.length <= 10<sup>4</sup></code></li>
<li><code>-10<sup>9</sup> <= nums[i] <= 10<sup>9</sup></code></li>
<li><code>-10<sup>9</sup> <= target <= 10<sup>9</sup></code></li>
<li><strong>Only one valid answer exists.</strong></li>
</ul>
  `,
  templates: {
    python: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass',
    javascript: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};',
    cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};',
    java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}'
  },
  testcases: [
    { input: 'nums = [2,7,11,15]\ntarget = 9', expected: '[0,1]' },
    { input: 'nums = [3,2,4]\ntarget = 6', expected: '[1,2]' },
    { input: 'nums = [3,3]\ntarget = 6', expected: '[0,1]' },
  ]
}

// ── Shared components ────────────────────────────────────────────────────────
function WorkspaceNav({ runState, onRun, onSubmit }: { runState: string, onRun: () => void, onSubmit: () => void }) {
  const { user, signOut } = useAuth()
  return (
    <nav style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'var(--color-surface-1)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.9rem', color: 'white', textDecoration: 'none' }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: 'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(20,184,166,0.2))', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 18 18" fill="none"><path d="M4 9l3-3 3 3 3-3" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 13l3-3 3 3 3-3" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/></svg>
          </div>
        </Link>
        <Link to="/problems" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-tertiary)', fontSize: '0.85rem', textDecoration: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Problems
        </Link>
      </div>

      {/* Center - Run / Submit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button 
          onClick={onRun}
          disabled={runState !== 'IDLE'}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'white', fontSize: '0.85rem', cursor: runState !== 'IDLE' ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: runState !== 'IDLE' ? 0.6 : 1 }}
        >
          {runState === 'IDLE' ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> : <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
          {runState === 'IDLE' ? 'Run' : runState === 'QUEUED' ? 'Queued...' : 'Running...'}
        </button>
        <button 
          onClick={onSubmit}
          disabled={runState !== 'IDLE'}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: runState === 'ACCEPTED' ? '#10B981' : '#10B981', border: '1px solid #059669', borderRadius: 6, color: '#022C22', fontSize: '0.85rem', fontWeight: 600, cursor: runState !== 'IDLE' ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: runState !== 'IDLE' && runState !== 'ACCEPTED' ? 0.6 : 1 }}
        >
          {runState === 'ACCEPTED' ? 'Accepted!' : 'Submit'}
        </button>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
        {user ? (
          <>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA', fontSize: '0.8rem', fontWeight: 600 }}>
              {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <button onClick={() => signOut()} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>Sign Out</button>
          </>
        ) : (
          <Link to="/signin" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>Sign In</Link>
        )}
      </div>
    </nav>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WorkspacePage() {
  const { id } = useParams()
  const problem = MOCK_PROBLEM // In real app, fetch based on ID
  const [lang, setLang] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python')
  const [code, setCode] = useState(problem.templates.python)
  const [activeTab, setActiveTab] = useState<'description' | 'editorial' | 'submissions'>('description')
  const [activeTestCase, setActiveTestCase] = useState(0)
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcases' | 'result'>('testcases')
  const [runState, setRunState] = useState<'IDLE' | 'QUEUED' | 'RUNNING' | 'ACCEPTED'>('IDLE')

  const handleRun = () => {
    setRunState('QUEUED')
    setTimeout(() => {
      setRunState('RUNNING')
      setTimeout(() => {
        setRunState('ACCEPTED')
        setActiveConsoleTab('result')
      }, 2000)
    }, 1000)
  }

  // Custom theme for Monaco to match our exact background colors
  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme('codejudge-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#111827',
        'editor.lineHighlightBackground': '#1f2d4580',
        'editorLineNumber.foreground': '#475569',
      }
    });
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-ink)', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
      <WorkspaceNav runState={runState} onRun={handleRun} onSubmit={handleRun} />
      
      <div style={{ flex: 1, padding: 8, height: 'calc(100vh - 50px)', display: 'flex', gap: 8 }}>
          
        {/* ── LEFT PANE: Description ── */}
        <div style={{ width: '40%', background: 'var(--color-surface-1)', borderRadius: 10, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 8px', background: 'rgba(0,0,0,0.1)' }}>
            {[
              { id: 'description', label: 'Description', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
              { id: 'editorial', label: 'Editorial', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
              { id: 'submissions', label: 'Submissions', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', background: 'none', border: 'none', color: activeTab === t.id ? '#60A5FA' : 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: activeTab === t.id ? 600 : 500, cursor: 'pointer', borderBottom: `2px solid ${activeTab === t.id ? '#3B82F6' : 'transparent'}` }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {activeTab === 'description' && (
              <div>
                <h1 style={{ fontSize: '1.4rem', marginBottom: 12 }}>{problem.id}. {problem.title}</h1>
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>{problem.difficulty}</span>
                </div>
                
                <div 
                  className="problem-description"
                  style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--color-text-secondary)' }}
                  dangerouslySetInnerHTML={{ __html: problem.description }}
                />
                
                {/* CSS for inner HTML formatting (pre tags etc) */}
                <style>{`
                  .problem-description pre { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); font-family: var(--font-code); font-size: 0.85rem; color: #E5E7EB; margin: 12px 0; white-space: pre-wrap; }
                  .problem-description code { background: rgba(255,255,255,0.08); padding: 2px 5px; border-radius: 4px; font-family: var(--font-code); font-size: 0.85em; color: #E2E8F0; }
                  .problem-description strong { color: #E2E8F0; }
                `}</style>
              </div>
            )}
            {activeTab === 'editorial' && <div style={{ color: 'var(--color-text-secondary)' }}>Editorial content coming soon.</div>}
            {activeTab === 'submissions' && <div style={{ color: 'var(--color-text-secondary)' }}>No submissions yet.</div>}
          </div>
        </div>

        {/* ── RIGHT PANE: Code + Console ── */}
        <div style={{ width: '60%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            
          {/* TOP: Editor */}
          <div style={{ flex: '60%', background: 'var(--color-surface-1)', borderRadius: 10, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Editor Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(0,0,0,0.1)', borderBottom: '1px solid var(--color-border)' }}>
              <select 
                value={lang} 
                onChange={e => {
                  const newLang = e.target.value as any;
                  setLang(newLang);
                  setCode(problem.templates[newLang as keyof typeof problem.templates]);
                }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 24px 4px 10px', color: 'white', fontSize: '0.75rem', outline: 'none', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2.5\' stroke-linecap=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', cursor: 'pointer' }}
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++ 17</option>
                <option value="java">Java 21</option>
              </select>
              
              <button style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', cursor: 'pointer' }}>
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
                onChange={val => setCode(val || '')}
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

          {/* BOTTOM: Console / Test cases */}
          <div style={{ flex: '40%', background: 'var(--color-surface-1)', borderRadius: 10, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 12px', background: 'rgba(0,0,0,0.1)', borderBottom: '1px solid var(--color-border)', height: 36, flexShrink: 0 }}>
              <button onClick={() => setActiveConsoleTab('testcases')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: activeConsoleTab === 'testcases' ? '#60A5FA' : 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: activeConsoleTab === 'testcases' ? 600 : 500, cursor: 'pointer', borderBottom: activeConsoleTab === 'testcases' ? '2px solid #3B82F6' : '2px solid transparent', height: '100%' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Testcases
              </button>
              <button onClick={() => setActiveConsoleTab('result')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: activeConsoleTab === 'result' ? '#10B981' : 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: activeConsoleTab === 'result' ? 600 : 500, cursor: 'pointer', borderBottom: activeConsoleTab === 'result' ? '2px solid #10B981' : '2px solid transparent', height: '100%' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                Test Result
              </button>
            </div>
            
            <div style={{ flex: 1, padding: 12, overflow: 'auto' }}>
              {activeConsoleTab === 'testcases' ? (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {problem.testcases.map((tc, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setActiveTestCase(idx)}
                        style={{ padding: '4px 12px', background: activeTestCase === idx ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: 'none', borderRadius: 6, color: activeTestCase === idx ? 'white' : 'var(--color-text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Input</div>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'var(--font-code)', fontSize: '0.85rem', color: '#E5E7EB', whiteSpace: 'pre-wrap' }}>
                        {problem.testcases[activeTestCase].input}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Expected Output</div>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'var(--font-code)', fontSize: '0.85rem', color: '#E5E7EB', whiteSpace: 'pre-wrap' }}>
                        {problem.testcases[activeTestCase].expected}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                  {runState === 'ACCEPTED' ? (
                    <>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div style={{ color: '#10B981', fontSize: '1.2rem', fontWeight: 600 }}>Accepted</div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Your code passed all test cases!</div>
                    </>
                  ) : runState !== 'IDLE' ? (
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Running code...</div>
                  ) : (
                    <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>Run or Submit your code to see results here.</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
