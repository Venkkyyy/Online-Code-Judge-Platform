import { useState, useRef, useEffect } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useAuth } from '../contexts/AuthContext'
import { io, Socket } from 'socket.io-client'
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { SettingsModal, EditorSettings } from '../components/SettingsModal'
import { UserDropdown } from '../components/UserDropdown'
import { LanguageDropdown } from '../components/LanguageDropdown'
import { LayoutDropdown, LayoutPreset } from '../components/LayoutDropdown'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'
const SOCKET_URL = API_URL === '/api/v1' ? '' : (API_URL.replace(/\/api\/v1\/?$/, '') || '')

// ── Shared components ────────────────────────────────────────────────────────
type JudgeState = 'IDLE' | 'QUEUED' | 'RUNNING'

function Stopwatch() {
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(0)

  useEffect(() => {
    let interval: any
    if (running) interval = setInterval(() => setTime(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [running])

  const format = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="liquid-glass" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, color: 'white', fontSize: '0.85rem', fontFamily: 'monospace' }}>
      <button onClick={() => setRunning(!running)} style={{ background: 'none', border: 'none', color: running ? '#EF4444' : '#10B981', cursor: 'pointer', padding: 0, display: 'flex' }}>
        {running ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        )}
      </button>
      <span style={{ minWidth: 60, textAlign: 'center' }}>{format(time)}</span>
      <button onClick={() => { setRunning(false); setTime(0) }} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', marginLeft: 4 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
      </button>
    </div>
  )
}

function WorkspaceNav({ 
  runState, 
  onRun, 
  onSubmit, 
  onOpenSettings, 
  onOpenCollab, 
  layoutPreset, 
  onLayoutChange 
}: { 
  runState: JudgeState, 
  onRun: () => void, 
  onSubmit: () => void, 
  onOpenSettings: () => void, 
  onOpenCollab: () => void, 
  layoutPreset: LayoutPreset, 
  onLayoutChange: (p: LayoutPreset) => void 
}) {
  const { user, signOut } = useAuth()
  return (
    <nav className="liquid-nav" style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0, zIndex: 100, gap: 16, overflow: 'visible' }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
        <Link to="/problems" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Problem List
        </Link>
      </div>

      {/* Center - Run / Submit / Collab */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <LayoutDropdown value={layoutPreset} onChange={onLayoutChange} />
        <button 
          onClick={onRun}
          disabled={runState !== 'IDLE'}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, color: '#60A5FA', fontSize: '0.85rem', fontWeight: 600, cursor: runState !== 'IDLE' ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: runState !== 'IDLE' ? 0.6 : 1 }}
        >
          {runState === 'RUNNING' ? (
            <div style={{ width: 12, height: 12, border: '2px solid #60A5FA', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          )}
          Run
        </button>
        <button 
          onClick={onSubmit}
          disabled={runState !== 'IDLE'}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 20px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none', boxShadow: '0 0 16px rgba(16,185,129,0.3)', borderRadius: 8, color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, cursor: runState !== 'IDLE' ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: runState !== 'IDLE' ? 0.6 : 1 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Submit
        </button>
        
        {/* Collab Button */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
        <button 
          onClick={onOpenCollab}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, color: '#A78BFA', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Share
        </button>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, position: 'relative', zIndex: 110 }}>
        <Stopwatch />
        <button onClick={onOpenSettings} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
        {user ? (
          <UserDropdown user={user} onSignOut={signOut} />
        ) : (
          <Link to="/signin" style={{ color: '#60A5FA', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
        )}
      </div>
    </nav>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function formatDescriptionText(desc: string) {
  if (!desc) return '';
  
  let mainPart = desc;
  let constraintsPart = '';
  const constraintsIndex = desc.indexOf('Constraints:');
  if (constraintsIndex !== -1) {
    mainPart = desc.substring(0, constraintsIndex);
    constraintsPart = desc.substring(constraintsIndex).replace('Constraints:', '').trim();
  }
  
  const parts = mainPart.split(/(Example \d+:|Example:)/g);
  let html = '';
  
  html += `<p style="margin-bottom: 16px; white-space: pre-line; color: #cbd5e1; font-size: 0.95rem; line-height: 1.75;">${parts[0].trim()}</p>`;
  
  for (let i = 1; i < parts.length; i += 2) {
    const header = parts[i];
    const content = parts[i + 1] || '';
    
    const lines = content.split('\n');
    let inputStr = '';
    let outputStr = '';
    let explanationStr = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('Input:')) {
        inputStr = trimmed.replace('Input:', '').trim();
      } else if (trimmed.startsWith('Output:')) {
        outputStr = trimmed.replace('Output:', '').trim();
      } else if (trimmed.startsWith('Explanation:')) {
        explanationStr = trimmed.replace('Explanation:', '').trim();
      } else if (trimmed && explanationStr) {
        explanationStr += ' ' + trimmed;
      }
    });

    html += `
      <div class="problem-example" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 18px; margin: 20px 0; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; box-shadow: inset 0 2px 10px rgba(0,0,0,0.3); backdrop-filter: blur(4px);">
        <div style="color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; font-family: sans-serif;">${header.replace(':', '')}</div>
        <div style="margin-bottom: 8px; color: #e2e8f0;"><span style="color: #60a5fa; font-weight: 600;">Input:</span> <span>${inputStr}</span></div>
        <div style="margin-bottom: ${explanationStr ? '8px' : '0'}; color: #10b981; font-weight: 600;"><span style="color: #10b981; font-weight: 600;">Output:</span> <span>${outputStr}</span></div>
        ${explanationStr ? `<div style="color: #94a3b8; font-size: 0.825rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; margin-top: 10px; line-height: 1.6; font-family: sans-serif;"><span style="color: #64748b; font-weight: 600;">Explanation:</span> ${explanationStr}</div>` : ''}
      </div>
    `;
  }
  
  if (constraintsPart) {
    html += `
      <div style="margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px;">
        <h4 style="color: white; font-size: 0.9rem; font-weight: 600; margin-bottom: 10px; font-family: sans-serif;">Constraints:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 0.85rem; line-height: 1.7; display: flex; flex-direction: column; gap: 6px;">
          ${constraintsPart.split('\n').filter(c => c.trim()).map(c => `<li><code style="background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: #f43f5e;">${c.trim()}</code></li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  return html;
}

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [problem, setProblem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [_error, setError] = useState('')
  
  const [code, setCode] = useState('')
  const [lang, setLang] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python')
  const [activeTab, setActiveTab] = useState<'description' | 'editorial' | 'submissions'>('description')
  
  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<EditorSettings>({
    theme: 'codejudge-dark',
    fontSize: 14,
    tabSize: 4
  })
  
  // Layout Preset
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>('standard')
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  // Judge State
  const [runState, setRunState] = useState<JudgeState>('IDLE')
  const [submissionResult, setSubmissionResult] = useState<any>(null)
  const [showRightPanel, setShowRightPanel] = useState(false)
  const rightPanelRef = useRef<any>(null)
  
  // Collab Room States
  const [collabModalOpen, setCollabModalOpen] = useState(false)
  const [isJoiningCollab, setIsJoiningCollab] = useState(false)
  const [collabSessionId, setCollabSessionId] = useState('')
  const [collabPassword, setCollabPassword] = useState('')
  const [joinSessionId, setJoinSessionId] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [isCollabLoading, setIsCollabLoading] = useState(false)
  
  // Live sync states
  const [isInCollabRoom, setIsInCollabRoom] = useState(false)
  const collabSocketRef = useRef<Socket | null>(null)
  const [collabSocketConnected, setCollabSocketConnected] = useState(false)
  const [_partnerActive, setPartnerActive] = useState(false)
  const [_partnerCursor, setPartnerCursor] = useState<{lineNumber: number, column: number} | null>(null)
  
  // Submissions list & availability tracker
  const [submissions, setSubmissions] = useState<any[]>([])
  const submissionsSupportedRef = useRef<boolean>(true)

  // Attach global openCollabModal caller
  useEffect(() => {
    (window as any).openCollabModal = () => setCollabModalOpen(true);
    return () => {
      delete (window as any).openCollabModal;
    };
  }, []);

  useEffect(() => {
    // Sync query param layout if exists
    const urlPreset = searchParams.get('layout')
    if (urlPreset && ['standard', 'flipped', 'stacked', 'leet', 'note', 'debug', 'focus'].includes(urlPreset)) {
      setLayoutPreset(urlPreset as LayoutPreset)
    }
  }, [searchParams])

  useEffect(() => {
    const controller = new AbortController()
    async function loadProblem() {
      try {
        setLoading(true)
        const res = await fetch(`${API_URL}/problems/${id}`, { signal: controller.signal })
        if (!res.ok) throw new Error('Problem not found')
        const data = await res.json()
        setProblem(data)
        setCode(data.templates?.[lang] || '')
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Failed to load problem')
        }
      } finally {
        setLoading(false)
      }
    }
    loadProblem()
    return () => controller.abort()
  }, [id])

  // Lazy load submissions only when user views the 'Submissions' tab
  useEffect(() => {
    let isMounted = true

    async function loadSubmissions() {
      if (activeTab !== 'submissions' || !user || !id || !submissionsSupportedRef.current) {
        return
      }

      try {
        const token = await user.getIdToken().catch(() => null)
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`${API_URL}/submissions?problemId=${id}`, { headers })

        if (res.status === 404) {
          submissionsSupportedRef.current = false
          if (isMounted) setSubmissions([])
          return
        }

        if (!res.ok) {
          if (isMounted) setSubmissions([])
          return
        }

        const data = await res.json()
        const list = Array.isArray(data) ? data : Array.isArray(data?.submissions) ? data.submissions : []
        if (isMounted) setSubmissions(list)
      } catch (_err) {
        if (isMounted) setSubmissions([])
      }
    }

    if (runState === 'IDLE') {
      loadSubmissions()
    }

    return () => { isMounted = false }
  }, [activeTab, user?.uid, id, submissionResult?.id, runState])

  // Collab Room setup
  useEffect(() => {
    if (isInCollabRoom && collabSessionId) {
      const socket = io(SOCKET_URL, {
        path: '/socket.io',
        transports: ['websocket'],
      })
      collabSocketRef.current = socket

      socket.on('connect', () => {
        setCollabSocketConnected(true)
        socket.emit('join-room', { roomId: collabSessionId, userId: user?.uid || 'anon' })
      })

      socket.on('code-sync', (data: { code: string }) => {
        setCode(data.code)
      })

      socket.on('partner-cursor', (pos: { lineNumber: number, column: number }) => {
        setPartnerCursor(pos)
      })

      socket.on('partner-status', (status: { active: boolean }) => {
        setPartnerActive(status.active)
      })

      socket.on('disconnect', () => {
        setCollabSocketConnected(false)
      })

      return () => {
        socket.disconnect()
      }
    }
  }, [isInCollabRoom, collabSessionId])

  const generateCollabSession = async () => {
    try {
      setIsCollabLoading(true)
      const token = await user?.getIdToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_URL}/collab/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ problemId: parseInt(id || '0') })
      })
      if (res.ok) {
        const data = await res.json()
        setCollabSessionId(data.sessionId)
        setCollabPassword(data.password)
      } else {
        alert('Failed to create collab room')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsCollabLoading(false)
    }
  }

  const joinCollabSession = async () => {
    try {
      setIsCollabLoading(true)
      const token = await user?.getIdToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_URL}/collab/join`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId: joinSessionId, password: joinPassword })
      })
      if (res.ok) {
        const data = await res.json()
        setCollabSessionId(joinSessionId)
        setIsInCollabRoom(true)
        setCollabModalOpen(false)
      } else {
        alert('Invalid session ID or password')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsCollabLoading(false)
    }
  }

  const handleStartHostCollab = () => {
    setIsInCollabRoom(true)
    setCollabModalOpen(false)
  }

  const executeCode = async (action: 'RUN' | 'SUBMIT') => {
    try {
      setRunState('QUEUED')
      setSubmissionResult(null)
      setShowRightPanel(true)
      
      const token = await user?.getIdToken().catch(() => null)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const endpoint = action === 'RUN' ? 'runs' : 'submissions'
      const res = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          problemId: parseInt(id || '0'),
          language: lang,
          code,
          isRun: action === 'RUN'
        })
      })
      
      if (!res.ok) {
        let errMessage = 'Failed to submit code'
        try {
          const errData = await res.json()
          errMessage = errData.message || errData.error || errMessage
        } catch (_) {}
        
        if (res.status === 401) {
          errMessage = 'Please sign in to run or submit code.'
        }

        setRunState('IDLE')
        setSubmissionResult({ status: 'ERROR', errorMessage: errMessage, isRun: action === 'RUN' })
        return
      }
      
      const data = await res.json()
      setRunState('RUNNING')
      
      // Poll submission result
      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_URL}/submissions/${data.id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
          if (!statusRes.ok) return
          const statusData = await statusRes.json()
          if (statusData.status !== 'QUEUED' && statusData.status !== 'RUNNING') {
            clearInterval(interval)
            setSubmissionResult(statusData)
            setRunState('IDLE')
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr)
        }
      }, 1000)
    } catch (err) {
      console.error(err)
      setRunState('IDLE')
      setSubmissionResult({ status: 'INTERNAL_ERROR', errorMessage: 'Failed to connect to judge server.' })
    }
  }

  const handleRun = () => executeCode('RUN')
  const handleSubmit = () => executeCode('SUBMIT')

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

  // Similar questions data source
  const similarQuestionsList = Array.isArray(problem?.similarQuestions) && problem.similarQuestions.length > 0
    ? problem.similarQuestions
    : [
        { id: '1', title: 'Two Sum' },
        { id: '15', title: '3Sum' },
        { id: '56', title: 'Merge Intervals' },
        { id: '125', title: 'Valid Palindrome' }
      ].filter(q => String(q.id) !== String(id));

  if (loading) {
    return <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-ink)', color: 'white' }}>Loading problem...</div>
  }
  if (!problem) {
    return <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-ink)', color: 'white' }}>Problem not found</div>
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-ink)', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .problem-description pre { position: relative; background: rgba(0,0,0,0.4); padding: 40px 16px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); font-family: var(--font-code); font-size: 0.85rem; color: #E5E7EB; margin: 24px 0 12px; white-space: pre-wrap; box-shadow: inset 0 2px 10px rgba(0,0,0,0.2); }
        .problem-description pre::before { content: 'EXAMPLE'; position: absolute; top: 12px; left: 16px; font-size: 0.7rem; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); font-family: sans-serif; font-weight: 600; }
        .problem-description code { background: rgba(255,255,255,0.08); padding: 2px 5px; border-radius: 4px; font-family: var(--font-code); font-size: 0.85em; color: #E2E8F0; }
        .problem-description strong { color: #E2E8F0; }
        .resize-handle { width: 8px; background: transparent; transition: background 0.2s; position: relative; display: flex; align-items: center; justify-content: center; z-index: 10; }
        .resize-handle:hover, .resize-handle:active { background: rgba(59,130,246,0.3); }
        .resize-handle::after { content: ''; width: 2px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 2px; }
        .resize-handle-horizontal { height: 8px; width: 100%; cursor: row-resize; }
        .resize-handle-horizontal::after { width: 32px; height: 2px; }
      `}</style>
      
      {layoutPreset !== 'focus' && (
        <WorkspaceNav 
          runState={runState} 
          onRun={handleRun} 
          onSubmit={handleSubmit} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          onOpenCollab={() => setCollabModalOpen(true)}
          layoutPreset={layoutPreset} 
          onLayoutChange={setLayoutPreset} 
        />
      )}
      {layoutPreset === 'focus' && (
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 100 }}>
          <button onClick={() => setLayoutPreset('standard')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            Exit Focus
          </button>
        </div>
      )}
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} setSettings={setSettings} />
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <PanelGroup 
          orientation={(isMobile || layoutPreset === 'stacked') ? "vertical" : "horizontal"} 
          style={{ 
            flex: 1, padding: layoutPreset === 'focus' ? '0' : '4px 8px 8px 8px', height: '100%', gap: layoutPreset === 'focus' ? 0 : 8, 
            flexDirection: (isMobile || layoutPreset === 'stacked') ? 'column' : layoutPreset === 'flipped' ? 'row-reverse' : 'row' 
          }}
        >
          
        {/* ── LEFT PANE: Description ── */}
        {layoutPreset !== 'focus' && (
        <>
        <Panel defaultSize={35} minSize={15}>
<div className="liquid-glass" style={{ height: '100%', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                  dangerouslySetInnerHTML={{ __html: formatDescriptionText(problem.description) }}
                />
                
                <div style={{ marginTop: 40, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24 }}>
                  <h3 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Hints
                  </h3>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 8, color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: 24 }}>
                    Try breaking down the problem into smaller subproblems. Consider using a hash map or two pointers to optimize your time complexity.
                  </div>
                  
                  <h3 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Similar Questions
                  </h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {similarQuestionsList.map((sq: any) => {
                      const sqTitle = typeof sq === 'string' ? sq : sq.title;
                      const sqId = typeof sq === 'object' && sq.id ? sq.id : null;
                      return (
                        <button 
                          key={sqTitle} 
                          onClick={() => {
                            if (sqId) {
                              navigate(`/problems/${sqId}`);
                            } else {
                              navigate(`/problems?search=${encodeURIComponent(sqTitle)}`);
                            }
                          }}
                          style={{ 
                            background: 'rgba(59,130,246,0.1)', 
                            border: '1px solid rgba(59,130,246,0.2)',
                            color: '#60A5FA', 
                            padding: '6px 14px', 
                            borderRadius: 20, 
                            fontSize: '0.75rem', 
                            fontWeight: 500,
                            cursor: 'pointer', 
                            transition: 'all 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }} 
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.25)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          {sqTitle}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'editorial' && <div style={{ color: 'var(--color-text-secondary)' }}>Editorial content coming soon.</div>}
            {activeTab === 'submissions' && (
              <div>
                {!user ? (
                  <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', paddingTop: 40 }}>Sign in to view your submissions.</div>
                ) : submissions.length === 0 ? (
                  <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', paddingTop: 40 }}>No submissions yet. Write some code and hit Submit!</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Runtime</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Memory</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Lang</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub: any) => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 0', color: sub.status === 'ACCEPTED' ? '#10B981' : sub.status === 'WRONG_ANSWER' ? '#EF4444' : '#F59E0B', fontWeight: 600 }}>
                            {sub.status?.replace(/_/g, ' ')}
                          </td>
                          <td style={{ padding: '10px 0', color: 'var(--color-text-secondary)' }}>
                            {sub.executionTime != null ? `${Math.round(sub.executionTime)}ms` : 'N/A'}
                          </td>
                          <td style={{ padding: '10px 0', color: 'var(--color-text-secondary)' }}>
                            {sub.memoryUsed != null ? `${(sub.memoryUsed / 1024 / 1024).toFixed(1)}MB` : 'N/A'}
                          </td>
                          <td style={{ padding: '10px 0' }}>
                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4, color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>{sub.language}</span>
                          </td>
                          <td style={{ padding: '10px 0', color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                            {new Date(sub.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        </Panel>
<PanelResizeHandle className="resize-handle" />
</>
)}

<Panel defaultSize={layoutPreset === 'focus' ? 100 : 45} minSize={15} style={{ display: 'flex', flexDirection: 'column' }}>
  <div className="liquid-glass" style={{ flex: 1, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    {/* Editor Header */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'linear-gradient(to right, rgba(255,255,255,0.02), rgba(255,255,255,0.0))', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <LanguageDropdown 
          value={lang} 
          onChange={(newLang) => {
            setLang(newLang as any);
            setCode(problem.templates ? problem.templates[newLang as keyof typeof problem.templates] : '');
          }} 
        />
      </div>
      
      <button
        className="liquid-btn"
        onClick={() => setCode(problem.templates?.[lang] || '')}
        style={{ borderRadius: 6, color: 'var(--color-text-secondary)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
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
        theme={settings.theme}
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
          fontSize: settings.fontSize,
          tabSize: settings.tabSize,
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

{layoutPreset !== 'focus' && layoutPreset !== 'stacked' && layoutPreset !== 'flipped' && layoutPreset !== 'leet' && (showRightPanel || isInCollabRoom) && (
  <>
<PanelResizeHandle className="resize-handle" />

{/* ── PANEL 3: Test Results / Collab ── */}
{/* @ts-ignore */}
<Panel id="results" ref={rightPanelRef} defaultSize={30} minSize={15} collapsible={true} order={3} style={{ display: 'flex', flexDirection: 'column' }}>
  <div className="liquid-glass" style={{ flex: 1, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
{(() => {
const renderResultContent = () => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em' }}>
        {isInCollabRoom ? 'COLLAB SESSION' : submissionResult?.isRun ? 'RUN RESULTS' : 'SUBMISSION RESULTS'}
      </h3>
      {submissionResult && !isInCollabRoom && (
        <span className={`liquid-pill ${submissionResult.status === 'ACCEPTED' ? 'liquid-glass-green' : 'liquid-glass-rose'}`}
          style={{ fontSize: '0.7rem', color: submissionResult.status === 'ACCEPTED' ? '#10B981' : '#F43F5E' }}>
          {submissionResult.status?.replace(/_/g, ' ')}
        </span>
      )}
    </div>
    
    <div style={{ flex: 1, padding: 16, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {isInCollabRoom ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
          <div style={{ color: '#10B981', fontSize: '1.2rem', textAlign: 'center', fontWeight: 600 }}>
            Live Collab is Active
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', textAlign: 'center', maxWidth: 300 }}>
            Your code is currently being synced in real-time with your partner.
          </div>
          <button onClick={() => { setIsInCollabRoom(false); setCollabSessionId(''); }} style={{ background: '#EF4444', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>
            End Session
          </button>
        </div>
      ) : (
        <>
          {submissionResult ? (
            <>
              {submissionResult.status === 'ACCEPTED' ? (
                <>
                  {/* Stat Cards */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{ flex: 1, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-tertiary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Runtime
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        {submissionResult.executionTime != null ? Math.round(submissionResult.executionTime) : '—'} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>ms</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                        Beats <span style={{ color: '#10B981', fontWeight: 600 }}>{submissionResult.beatsRuntime}%</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-tertiary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                        Memory
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        {submissionResult.memoryUsed ? (submissionResult.memoryUsed).toFixed(1) : '—'} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>MB</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                        Beats <span style={{ color: '#10B981', fontWeight: 600 }}>{submissionResult.beatsMemory}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Distribution Graph */}
                  {submissionResult.runtimeDistribution && (
                    <div style={{ height: 160, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 16px 8px 16px', marginBottom: 16, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Runtime Distribution</div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={submissionResult.runtimeDistribution} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap={1}>
                          <XAxis dataKey="mark" hide />
                          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: '0.8rem' }} />
                          <Bar dataKey="count" radius={[2,2,0,0]}>
                            {submissionResult.runtimeDistribution.map((entry: any, index: number) => {
                               const val = parseInt(entry.mark);
                               const userVal = submissionResult.executionTime || 0;
                               const isUser = Math.abs(val - userVal) <= (Math.max(2, userVal * 0.1)); 
                               return <Cell key={`cell-${index}`} fill={isUser ? '#3B82F6' : 'rgba(59,130,246,0.3)'} />
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Results cards */}
                  {problem.testCases?.map((_tc: any, i: number) => (
                    <div key={i} className="liquid-glass-green" style={{ borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                       <div>
                         <div style={{ color: '#10B981', fontSize: '0.85rem', marginBottom: 4, fontWeight: 600 }}>Case {i + 1}</div>
                         <div style={{ color: 'rgba(110,231,183,0.7)', fontSize: '0.75rem' }}>{submissionResult.executionTime != null ? Math.round(submissionResult.executionTime) : '—'}ms • {submissionResult.memoryUsed ? (submissionResult.memoryUsed / 1024 / 1024).toFixed(1) : '—'} MB</div>
                       </div>
                       <div style={{ color: '#10B981', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                         PASS
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
                      {submissionResult.status?.replace(/_/g, ' ')}
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
);

return (
  <>{renderResultContent()}</>
)
})()}
  </div>
</Panel>
  </>
)}
</PanelGroup>
      </div>

      {/* FLOATING RESULTS PANEL for Custom Layouts */}
      {((layoutPreset === 'focus' || layoutPreset === 'stacked' || layoutPreset === 'flipped' || layoutPreset === 'leet') && (showRightPanel || isInCollabRoom)) && (
        <div style={{
          position: 'fixed', bottom: 16, right: 16, width: '450px', height: '70dvh',
          zIndex: 999, animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6)'
        }}>
          {/* Close Button for floating panel */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 8 }}>
            <button onClick={() => setShowRightPanel(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          {(() => {
            const renderFloatingContent = () => (
              <div className="liquid-glass" style={{ flex: 1, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em' }}>
                    {isInCollabRoom ? 'COLLAB SESSION' : submissionResult?.isRun ? 'RUN RESULTS' : 'SUBMISSION RESULTS'}
                  </h3>
                  {submissionResult && !isInCollabRoom && (
                    <span className={`liquid-pill ${submissionResult.status === 'ACCEPTED' ? 'liquid-glass-green' : 'liquid-glass-rose'}`}
                      style={{ fontSize: '0.7rem', color: submissionResult.status === 'ACCEPTED' ? '#10B981' : '#F43F5E' }}>
                      {submissionResult.status?.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                
                <div style={{ flex: 1, padding: 16, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {isInCollabRoom ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
                      <div style={{ color: '#10B981', fontSize: '1.2rem', textAlign: 'center', fontWeight: 600 }}>
                        Live Collab is Active
                      </div>
                      <button onClick={() => { setIsInCollabRoom(false); setCollabSessionId(''); }} style={{ background: '#EF4444', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>
                        End Session
                      </button>
                    </div>
                  ) : (
                    <>
                      {submissionResult ? (
                        <>
                          {submissionResult.status === 'ACCEPTED' ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                                <div style={{ flex: 1, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-tertiary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Runtime</div>
                                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    {submissionResult.executionTime != null ? Math.round(submissionResult.executionTime) : '—'} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>ms</span>
                                  </div>
                                </div>
                                <div style={{ flex: 1, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-tertiary)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Memory</div>
                                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    {submissionResult.memoryUsed ? (submissionResult.memoryUsed / 1024 / 1024).toFixed(1) : '—'} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>MB</span>
                                  </div>
                                </div>
                              </div>
                              {submissionResult.runtimeDistribution && (
                                <div style={{ height: 120, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 16px 8px 16px', marginBottom: 16, display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Runtime Distribution</div>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={submissionResult.runtimeDistribution} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap={1}>
                                      <XAxis dataKey="mark" hide />
                                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: '0.8rem' }} />
                                      <Bar dataKey="count" radius={[2,2,0,0]}>
                                        {submissionResult.runtimeDistribution.map((entry: any, index: number) => {
                                           const val = parseInt(entry.mark);
                                           const userVal = submissionResult.executionTime || 0;
                                           const isUser = Math.abs(val - userVal) <= (Math.max(2, userVal * 0.1)); 
                                           return <Cell key={`cell-${index}`} fill={isUser ? '#3B82F6' : 'rgba(59,130,246,0.3)'} />
                                        })}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                              {problem.testCases?.map((_tc: any, i: number) => (
                                <div key={i} className="liquid-glass-green" style={{ borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                   <div>
                                     <div style={{ color: '#10B981', fontSize: '0.85rem', marginBottom: 4, fontWeight: 600 }}>Case {i + 1}</div>
                                     <div style={{ color: 'rgba(110,231,183,0.7)', fontSize: '0.75rem' }}>{submissionResult.executionTime != null ? Math.round(submissionResult.executionTime) : '—'}ms</div>
                                   </div>
                                   <div style={{ color: '#10B981', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                     PASS
                                   </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <>
                              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '12px 16px' }}>
                                <div style={{ color: '#EF4444', fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>
                                  {submissionResult.status?.replace(/_/g, ' ')}
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
                            </>
                          )}
                        </>
                      ) : runState === 'QUEUED' || runState === 'RUNNING' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                          <div style={{ width: 24, height: 24, border: '3px solid rgba(96,165,250,0.3)', borderTopColor: '#60A5FA', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          <div style={{ color: '#60A5FA', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>{runState === 'QUEUED' ? 'QUEUED...' : 'RUNNING TESTS...'}</div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            );
            return renderFloatingContent();
          })()}
        </div>
      )}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      
      {/* Collab Modal */}
      {collabModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 32, width: 440, boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              Collab Session
            </h2>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 24 }}>
              <button onClick={() => setIsJoiningCollab(false)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: !isJoiningCollab ? '#A78BFA' : 'var(--color-text-secondary)', fontWeight: !isJoiningCollab ? 600 : 400, borderBottom: !isJoiningCollab ? '2px solid #A78BFA' : '2px solid transparent', cursor: 'pointer' }}>Create Session</button>
              <button onClick={() => setIsJoiningCollab(true)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: isJoiningCollab ? '#A78BFA' : 'var(--color-text-secondary)', fontWeight: isJoiningCollab ? 600 : 400, borderBottom: isJoiningCollab ? '2px solid #A78BFA' : '2px solid transparent', cursor: 'pointer' }}>Join Session</button>
            </div>
            
            {isJoiningCollab ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session ID</label>
                  <input 
                    type="text"
                    value={joinSessionId}
                    onChange={(e) => setJoinSessionId(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character ID"
                    style={{ width: '100%', marginTop: 6, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 14px', borderRadius: 8, color: 'white', fontSize: '1.1rem', fontFamily: 'var(--font-code)', letterSpacing: '0.1em', textAlign: 'center', fontWeight: 600 }} 
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Password</label>
                  <input 
                    type="text"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="Enter Password"
                    style={{ width: '100%', marginTop: 6, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 14px', borderRadius: 8, color: 'white', fontSize: '1.1rem', fontFamily: 'var(--font-code)', letterSpacing: '0.1em', textAlign: 'center', fontWeight: 600 }} 
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => { setCollabModalOpen(false); setIsJoiningCollab(false); navigate(`/problems/${id}`) }} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={joinCollabSession} disabled={isCollabLoading || joinPassword.length < 6} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: (isCollabLoading || joinPassword.length < 6) ? 'not-allowed' : 'pointer', opacity: (isCollabLoading || joinPassword.length < 6) ? 0.5 : 1 }}>
                    {isCollabLoading ? 'Joining...' : 'Join Room'}
                  </button>
                </div>
              </div>
            ) : collabSessionId ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session ID</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <input readOnly value={collabSessionId} style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: 8, color: 'white', fontSize: '1.2rem', fontFamily: 'var(--font-code)', letterSpacing: '0.2em', textAlign: 'center', fontWeight: 800 }} />
                    <button onClick={() => navigator.clipboard.writeText(collabSessionId)} style={{ padding: '0 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', cursor: 'pointer' }}>Copy</button>
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Password</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <input readOnly value={collabPassword} style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: 8, color: '#A78BFA', fontSize: '1.2rem', fontFamily: 'var(--font-code)', letterSpacing: '0.2em', textAlign: 'center', fontWeight: 800 }} />
                    <button onClick={() => navigator.clipboard.writeText(collabPassword)} style={{ padding: '0 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', cursor: 'pointer' }}>Copy</button>
                  </div>
                </div>
                <button onClick={handleStartHostCollab} style={{ width: '100%', padding: '12px', background: '#3B82F6', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>Start Room Now</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setCollabModalOpen(false); setCollabSessionId(''); setCollabPassword(''); }} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', cursor: 'pointer' }}>Cancel</button>
                <button onClick={generateCollabSession} disabled={isCollabLoading} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  {isCollabLoading ? 'Generating...' : 'Generate Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
    </div>
  )
}