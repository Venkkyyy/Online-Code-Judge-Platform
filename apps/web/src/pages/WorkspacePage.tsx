import { useState, useRef, useEffect } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useAuth } from '../contexts/AuthContext'
import { io, Socket } from 'socket.io-client'
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'
const SOCKET_URL = API_URL === '/api/v1' ? '' : (API_URL.replace(/\/api\/v1\/?$/, '') || '')

// ── WebRTC Component ────────────────────────────────────────────────────────
function WebRTCVideo({ roomId, socketUrl, onEndSession }: { roomId: string, socketUrl: string, onEndSession: () => void }) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [connected, setConnected] = useState(false)
  
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = io(socketUrl)
    socketRef.current = socket

    const getMedia = async () => {
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        return localVideoRef.current.srcObject as MediaStream;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
        return stream;
      } catch (err) {
        console.error('Failed to get media devices:', err)
        alert('Could not access camera/microphone. Video call requires permissions.')
        return null;
      }
    }

    socket.on('user-connected', async () => {
      const stream = await getMedia();
      if (!stream) return;
      const pc = createPeerConnection(stream)
      peerConnection.current = pc
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit('offer', { roomId, offer })
    })

    socket.on('offer', async (payload: { senderId: string, offer: any }) => {
      const stream = await getMedia();
      if (!stream) return;
      const pc = createPeerConnection(stream)
      peerConnection.current = pc
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('answer', { roomId, answer })
    })

    socket.on('answer', async (payload: { senderId: string, answer: any }) => {
      const pc = peerConnection.current
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload.answer))
    })

    socket.on('ice-candidate', async (payload: { senderId: string, candidate: any }) => {
      const pc = peerConnection.current
      if (pc && payload.candidate) await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
    })
    
    socket.on('user-disconnected', () => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
      setConnected(false)
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
        localVideoRef.current.srcObject = null
      }
      if (peerConnection.current) {
        peerConnection.current.close()
        peerConnection.current = null
      }
    })

    socket.on('connect', () => {
      socket.emit('join-room', roomId)
    })

    return () => {
      socket.disconnect()
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      }
      if (peerConnection.current) peerConnection.current.close()
    }
  }, [roomId, socketUrl])

  const createPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    stream.getTracks().forEach(track => pc.addTrack(track, stream))
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
        setConnected(true)
      }
    }
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', { roomId, candidate: event.candidate })
      }
    }
    return pc
  }

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const videoTrack = displayStream.getVideoTracks()[0]
        if (peerConnection.current) {
          const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video')
          if (sender) sender.replaceTrack(videoTrack)
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = displayStream
        setIsScreenSharing(true)
        videoTrack.onended = () => { stopScreenShare() }
      } else {
        stopScreenShare()
      }
    } catch (e) {
      console.error('Screen sharing failed:', e)
    }
  }

  const stopScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      const videoTrack = stream.getVideoTracks()[0]
      if (peerConnection.current) {
        const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video')
        if (sender) sender.replaceTrack(videoTrack)
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      setIsScreenSharing(false)
    } catch(e) { console.error(e) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 200, borderRadius: 8, overflow: 'hidden', background: '#000', marginBottom: 12 }}>
        <video ref={remoteVideoRef} autoPlay playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        {!connected && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem', background: '#111' }}>
            Waiting for partner to join...
          </div>
        )}
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: 80, height: 60, background: '#111', borderRadius: 8, objectFit: 'cover', position: 'absolute', bottom: 8, right: 8, border: '2px solid rgba(255,255,255,0.2)', display: connected ? 'block' : 'none' }} />
      </div>
      
      <div style={{ display: 'flex', gap: 12, paddingBottom: 12 }}>
        <button onClick={toggleScreenShare} disabled={!connected} style={{ flex: 1, background: isScreenSharing ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.15)', color: isScreenSharing ? '#EF4444' : '#60A5FA', border: 'none', padding: '10px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: connected ? 'pointer' : 'not-allowed', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s', opacity: connected ? 1 : 0.5 }}>
          {isScreenSharing ? 'Stop Share' : 'Share Screen'}
        </button>
        <button onClick={onEndSession} style={{ flex: 1, background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: 'none', padding: '10px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}>
          End Session
        </button>
      </div>
    </div>
  )
}

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

function WorkspaceNav({ runState, onRun, onSubmit }: { runState: JudgeState, onRun: () => void, onSubmit: () => void }) {
  const { user, signOut } = useAuth()
  return (
    <nav className="liquid-nav" style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, zIndex: 100 }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link to="/problems" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, transition: 'color 0.2s' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Problem List
        </Link>
      </div>

      {/* Center - Run / Submit / Collab */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button 
          onClick={(window as any).toggleSwapLayout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 12V8m0 12l-4-4m4 4l4-4"/></svg>
          Swap Layout
        </button>
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
          onClick={() => (window as any).openCollabModal?.()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, color: '#A78BFA', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Share
        </button>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Stopwatch />
        <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
        {user ? (
          <>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(59,130,246,0.5),rgba(20,184,166,0.5))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>
              {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <button onClick={() => signOut()} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>Sign Out</button>
          </>
        ) : (
          <Link to="/signin" style={{ color: '#60A5FA', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
        )}
      </div>
    </nav>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WorkspacePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [problem, setProblem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python')
  const [code, setCode] = useState('')
  const [activeTab, setActiveTab] = useState<'description' | 'editorial' | 'submissions'>('description')
  const [activeTestCase, setActiveTestCase] = useState(0)
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcases' | 'result'>('testcases')
  const [runState, setRunState] = useState<JudgeState>('IDLE')
  const [submissionResult, setSubmissionResult] = useState<any>(null)

  // Collab State
  const [swapLayout, setSwapLayout] = useState(false)
  ;(window as any).toggleSwapLayout = () => setSwapLayout(s => !s)

  const [collabModalOpen, setCollabModalOpen] = useState(false)
  const rightPanelRef = useRef<ImperativePanelHandle>(null)
  const [collabPassword, setCollabPassword] = useState('')
  const [isCollabLoading, setIsCollabLoading] = useState(false)
  const [collabSessionId, setCollabSessionId] = useState('')
  const [joinSessionId, setJoinSessionId] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [isJoiningCollab, setIsJoiningCollab] = useState(false)
  const [isInCollabRoom, setIsInCollabRoom] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [collabSocketConnected, setCollabSocketConnected] = useState(false)
  const collabSocketRef = useRef<Socket | null>(null)
  const collabQuery = searchParams.get('collab')

  useEffect(() => {
    ;(window as any).openCollabModal = () => setCollabModalOpen(true)
    if (collabQuery) {
      setJoinSessionId(collabQuery)
      setIsJoiningCollab(true)
      setCollabModalOpen(true)
    }
    return () => {
      delete (window as any).openCollabModal
    }
  }, [collabQuery])

  // Fetch user's past submissions for this problem
  useEffect(() => {
    if (user && problem) {
      user.getIdToken().then(token => {
        fetch(`${API_URL}/users/submissions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data)) {
              setSubmissions(data.filter((s: any) => s.problemId === problem.id))
            }
          })
          .catch(console.error)
      })
    }
  }, [user, problem, submissionResult])

  const generateCollabSession = async () => {
    setIsCollabLoading(true)
    try {
      const token = await user?.getIdToken()
      const res = await fetch(`${API_URL}/collab/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ problemId: problem.id })
      })
      if (res.ok) {
        const data = await res.json()
        setCollabSessionId(data.sessionId)
        setCollabPassword(data.password)
        setIsInCollabRoom(true)
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to create session (are you logged in?)')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsCollabLoading(false)
    }
  }

  const joinCollabSession = async () => {
    if (!user) {
      alert('You must be logged in to join a collab session!')
      return
    }
    setIsCollabLoading(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`${API_URL}/collab/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId: joinSessionId, password: joinPassword })
      })
      if (res.ok) {
        setCollabSessionId(joinSessionId)
        setCollabPassword(joinPassword)
        setCollabModalOpen(false)
        setIsJoiningCollab(false)
        setIsInCollabRoom(true)
      } else {
        alert('Invalid password or session')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsCollabLoading(false)
    }
  }

  const handleStartHostCollab = () => {
    setCollabModalOpen(false)
    setIsInCollabRoom(true)
  }

  useEffect(() => {
    if (!isInCollabRoom || !collabSessionId) return

    const socket = io(SOCKET_URL, { withCredentials: true })
    collabSocketRef.current = socket

    socket.on('connect', () => {
      setCollabSocketConnected(true)
      socket.emit('join-room', collabSessionId)
    })
    socket.on('disconnect', () => setCollabSocketConnected(false))
    socket.on('code-update', (payload: any) => {
      if (payload?.code && payload.senderId !== socket.id) {
        setCode(payload.code)
      }
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('code-update')
      socket.disconnect()
      collabSocketRef.current = null
      setCollabSocketConnected(false)
    }
  }, [isInCollabRoom, collabSessionId])

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await fetch(`${API_URL}/problems/${id}`)
        if (res.ok) {
          const data = await res.json()
          setProblem(data)
          if (data.templates && data.templates.python) {
            setCode(data.templates.python)
          } else {
            setCode('')
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProblem()
  }, [id])

  const authHeader = async () => {
    const token = await user?.getIdToken()
    return token ? { Authorization: `Bearer ${token}` } as Record<string, string> : {} as Record<string, string>
  }

  const executeCode = async (mode: 'RUN' | 'SUBMIT') => {
    if (!user) {
      alert('Please sign in to run or submit code.')
      return
    }
    if (!code || code.trim().length === 0) {
      alert('Please write some code before running or submitting.')
      return
    }
    
    // Animate open the right pane for results
    if (rightPanelRef.current) {
      try { rightPanelRef.current.expand() } catch {}
    }
    
    setRunState('QUEUED')
    setActiveConsoleTab('result')
    setSubmissionResult(null)
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(await authHeader())
      }
      const res = await fetch(`${API_URL}/${mode === 'RUN' ? 'runs' : 'submissions'}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ problemId: problem.id, language: lang, code })
      })
      if (!res.ok) throw new Error('Execution request failed')
      const data = await res.json()
      
      setRunState('RUNNING')
      
      const poll = setInterval(async () => {
        const pollRes = await fetch(`${API_URL}/submissions/${data.id}`, { headers })
        if (pollRes.ok) {
          const pollData = await pollRes.json()
          if (pollData.status !== 'QUEUED' && pollData.status !== 'RUNNING') {
            clearInterval(poll)
            setRunState('IDLE')
            setSubmissionResult(pollData)
          }
        }
      }, 1000)
    } catch (err) {
      console.error(err)
      setRunState('IDLE')
      setSubmissionResult({ status: 'INTERNAL_ERROR', error: 'Failed to connect to judge server.' })
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

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-ink)', color: 'white' }}>Loading problem...</div>
  }
  if (!problem) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-ink)', color: 'white' }}>Problem not found</div>
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-ink)', overflow: 'hidden' }}>
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
      <WorkspaceNav runState={runState} onRun={handleRun} onSubmit={handleSubmit} />
      
      <PanelGroup direction="horizontal" style={{ flex: 1, padding: 8, height: 'calc(100vh - 50px)', gap: 8 }}>
          
        {/* ── LEFT PANE: Description ── */}
        <Panel defaultSize={35} order={swapLayout ? 2 : 1}>
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
                  dangerouslySetInnerHTML={{ __html: problem.description }}
                />
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
                            {sub.status.replace(/_/g, ' ')}
                          </td>
                          <td style={{ padding: '10px 0', color: 'var(--color-text-secondary)' }}>
                            {sub.executionTime != null ? `${sub.executionTime}ms` : 'N/A'}
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

<Panel defaultSize={45} order={swapLayout ? 1 : 2} style={{ display: 'flex', flexDirection: 'column' }}>
  <div className="liquid-glass" style={{ flex: 1, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
            <option value="python" style={{ background: '#1e293b', color: '#fff' }}>Python 3</option>
            <option value="javascript" style={{ background: '#1e293b', color: '#fff' }}>JavaScript</option>
            <option value="cpp" style={{ background: '#1e293b', color: '#fff' }}>C++ 17</option>
            <option value="java" style={{ background: '#1e293b', color: '#fff' }}>Java 21</option>
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
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
<Panel ref={rightPanelRef} defaultSize={0} minSize={20} collapsible={true} order={3} style={{ display: 'flex', flexDirection: 'column' }}>
  <div className="liquid-glass" style={{ flex: 1, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    
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
        isVideoEnabled ? (
          <WebRTCVideo roomId={collabSessionId} socketUrl={SOCKET_URL} onEndSession={() => { setIsInCollabRoom(false); setCollabSessionId(''); setIsVideoEnabled(false); }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
              Code sharing is active.<br/>Join the video call to see and hear your partner.
            </div>
            <button onClick={() => setIsVideoEnabled(true)} style={{ background: '#3B82F6', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              Join Video Call
            </button>
            <button onClick={() => { setIsInCollabRoom(false); setCollabSessionId(''); setIsVideoEnabled(false); }} style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              End Session
            </button>
          </div>
        )
      ) : (
        <>
          {submissionResult ? (
            <>
              {submissionResult.status === 'ACCEPTED' ? (
                <>
                  {/* Results cards — using real timing data */}
                  {problem.testCases?.map((tc: any, i: number) => (
                    <div key={i} className="liquid-glass-green" style={{ borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                       <div>
                         <div style={{ color: '#10B981', fontSize: '0.85rem', marginBottom: 4, fontWeight: 600 }}>Case {i + 1}</div>
                         <div style={{ color: 'rgba(110,231,183,0.7)', fontSize: '0.75rem' }}>{submissionResult.executionTime ?? '—'}ms · {submissionResult.memoryUsed ? (submissionResult.memoryUsed / 1024 / 1024).toFixed(1) : '—'} MB</div>
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
