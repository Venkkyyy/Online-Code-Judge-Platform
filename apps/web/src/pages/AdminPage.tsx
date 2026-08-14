import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Shared Mock Data for Admin
const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

interface Problem {
  id: number
  title: string
  difficulty: string
  description: string
  published: boolean
  testCases: {input: string, expectedOutput: string, isHidden: boolean}[]
  templates: { python: string; javascript: string; cpp: string; java: string }
}

export default function AdminPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'problems' | 'users' | 'settings'>('dashboard')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [problems, setProblems] = useState<Problem[]>([])
  
  // Form state
  const [newTitle, setNewTitle] = useState('')
  const [newDifficulty, setNewDifficulty] = useState('Easy')
  const [newDesc, setNewDesc] = useState('')
  const [newPublished, setNewPublished] = useState(false)
  const [newTestCases, setNewTestCases] = useState<{input: string, expectedOutput: string, isHidden: boolean}[]>([])
  const [newTemplates, setNewTemplates] = useState<{ python: string; javascript: string; cpp: string; java: string }>({ python: '', javascript: '', cpp: '', java: '' })

  const openCreateModal = () => {
    setEditingId(null)
    setNewTitle('')
    setNewDifficulty('Easy')
    setNewDesc('')
    setNewPublished(false)
    setNewTestCases([{ input: '', expectedOutput: '', isHidden: false }])
    setNewTemplates({ python: '', javascript: '', cpp: '', java: '' })
    setShowModal(true)
  }

  const openEditModal = (p: any) => {
    setEditingId(p.id)
    setNewTitle(p.title)
    setNewDifficulty(p.difficulty)
    setNewDesc(p.description)
    setNewPublished(p.published)
    setNewTestCases(p.testCases && p.testCases.length > 0 ? p.testCases : [{ input: '', expectedOutput: '', isHidden: false }])
    setNewTemplates({
      python: p.templates?.python || '',
      javascript: p.templates?.javascript || '',
      cpp: p.templates?.cpp || '',
      java: p.templates?.java || ''
    })
    setShowModal(true)
  }

  useEffect(() => {
    if (user) {
      user.getIdToken().then(token => {
        // Fetch Stats
        fetch(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(async res => {
            const data = await res.json()
            console.log('ADMIN STATS:', res.status, data)
            if (!res.ok) throw new Error(`Stats ${res.status}`)
            return data
          })
          .then(data => setStats(data))
          .catch(console.error)

        fetch(`${API_URL}/admin/recent-submissions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(async res => {
            const data = await res.json()
            console.log('ADMIN RECENT:', res.status, data)
            if (!res.ok) throw new Error(`Recent submissions ${res.status}`)
            return data
          })
          .then(data => {
            setRecentSubmissions(Array.isArray(data) ? data : [])
          })
          .catch(console.error)

        // Fetch Problems
        fetch(`${API_URL}/admin/problems`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(async res => {
            const data = await res.json()
            console.log('ADMIN PROBLEMS:', res.status, data)
            if (!res.ok) throw new Error(`Problems ${res.status}`)
            return data
          })
          .then(data => {
            setProblems(Array.isArray(data) ? data : [])
          })
          .catch(console.error)
      })
    }
  }, [user, activeTab])

  const handleSaveProblem = async () => {
    try {
      const token = await user?.getIdToken()
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `${API_URL}/admin/problems/${editingId}` : `${API_URL}/admin/problems`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: newTitle,
          difficulty: newDifficulty,
          description: newDesc,
          published: newPublished,
          tags: [],
          testCases: newTestCases,
          templates: newTemplates
        })
      })
      if (res.ok) {
        setShowModal(false)
        const data = await res.json()
        
        // Refresh problems to get updated data including testCases
        fetch(`${API_URL}/admin/problems`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => setProblems(d))
      } else {
        alert('Failed to save problem (Must be Admin/Problem Setter)')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // In a real app, this route should be protected by an AdminRoute wrapper.
  // For the demo, we allow anyone logged in to see the dashboard UI!
  if (!user) {
    return (
      <div style={{ color: 'white', padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-ink)' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: 16 }}>Access Denied</div>
        <div style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>Please sign in to view the Admin Dashboard.</div>
        <Link to="/signin" style={{ background: '#3B82F6', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>Go to Sign In</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-ink)', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient orbs */}
      <div className="liquid-orb liquid-orb-lg" style={{ width: 600, height: 600, background: 'rgba(59,130,246,0.1)', top: '-10%', right: '10%', position: 'fixed', pointerEvents: 'none' }} />
      <div className="liquid-orb" style={{ width: 400, height: 400, background: 'rgba(139,92,246,0.08)', bottom: '0%', left: '15%', position: 'fixed', pointerEvents: 'none', animationDelay: '-8s' }} />
      
      {/* ── SIDEBAR ── */}
      <div className="liquid-glass" style={{ width: 240, padding: '24px 0', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRadius: 0, position: 'sticky', top: 0, height: '100vh', zIndex: 10, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ padding: '0 20px', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '1.125rem', color: 'white', textDecoration: 'none', letterSpacing: '-0.03em' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'conic-gradient(from 0deg, #3B82F6, #14B8A6, #8B5CF6, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'spin 6s linear infinite' }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M5 9l3 3 6-6" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            Code<span style={{ color: '#60A5FA' }}>Admin</span>
          </Link>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '0 10px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard',         icon: 'M4 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM14 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V6zM4 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2zM14 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2z' },
            { id: 'problems',  label: 'Problem Bank',      icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
            { id: 'users',     label: 'Users & Roles',     icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
            { id: 'settings',  label: 'Platform Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={activeTab === t.id ? 'liquid-glass-blue' : 'liquid-glass-hover'}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none',
                background: activeTab === t.id ? undefined : 'transparent',
                color: activeTab === t.id ? '#60A5FA' : 'var(--color-text-secondary)',
                fontSize: '0.875rem', fontWeight: activeTab === t.id ? 700 : 500, cursor: 'pointer',
                textAlign: 'left', width: '100%',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon}/></svg>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.72rem', marginBottom: 4 }}>Logged in as</div>
          <div style={{ color: 'white', fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, padding: '48px 64px', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: 8, letterSpacing: '-0.02em' }}>
              {activeTab === 'dashboard' ? 'Platform Overview' : activeTab === 'problems' ? 'Problem Bank' : activeTab === 'users' ? 'User Management' : 'Settings'}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {activeTab === 'dashboard' ? 'Monitor system health and recent activity.' : 'Manage and review algorithmic content.'}
            </p>
          </div>
          
          {activeTab === 'problems' && (
            <button 
              onClick={openCreateModal}
              style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(59,130,246,0.4)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create Problem
            </button>
          )}
        </div>

        {activeTab === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
              {[
                { label: 'Total Submissions', value: stats?.totalSubmissions || 0, tint: 'liquid-glass-blue',   trend: '↑ 12%' },
                { label: 'Active Users',       value: stats?.activeUsers      || 0, tint: 'liquid-glass-green',  trend: '↑ 8%'  },
                { label: 'Avg Exec Time',      value: `${stats?.avgExecutionTime || 0}ms`, tint: 'liquid-glass-teal',  trend: '↓ 3%'  },
                { label: 'Pending Drafts',     value: stats?.pendingDrafts    || 0, tint: 'liquid-glass-amber', trend: ''       },
              ].map(s => (
                <div key={s.label} className={`liquid-glass ${s.tint}`} style={{ padding: '20px 24px', borderRadius: 16 }}>
                  <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.78rem', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{s.label}</div>
                  <div style={{ color: 'white', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-code)' }}>{s.value}</div>
                  {s.trend && <div style={{ color: s.trend.startsWith('↑') ? '#10B981' : '#F43F5E', fontSize: '0.78rem', marginTop: 6, fontWeight: 600 }}>{s.trend} this week</div>}
                </div>
              ))}
            </div>

            <h2 style={{ color: 'white', fontSize: '1.125rem', marginBottom: 16, fontWeight: 700 }}>Recent Submissions</h2>
            <div className="liquid-glass" style={{ borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--color-text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <th style={{ padding: '12px 24px', fontWeight: 600 }}>User</th>
                    <th style={{ padding: '12px 24px', fontWeight: 600 }}>Problem</th>
                    <th style={{ padding: '12px 24px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 24px', fontWeight: 600 }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(recentSubmissions) && recentSubmissions.map((sub, i) => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'white', fontSize: '0.875rem' }}>
                      <td style={{ padding: '14px 24px' }}>{sub.user?.email || 'Anonymous'}</td>
                      <td style={{ padding: '14px 24px', color: '#60A5FA' }}>{sub.problem?.title || `Problem ${sub.problemId}`}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <span className={`liquid-pill ${sub.status === 'ACCEPTED' ? 'liquid-glass-green' : 'liquid-glass-rose'}`}
                          style={{ color: sub.status === 'ACCEPTED' ? '#10B981' : '#F43F5E', fontSize: '0.7rem' }}>
                          {sub.status === 'ACCEPTED' ? 'Accepted' : (sub.status === 'WRONG_ANSWER' ? 'Wrong Answer' : (sub.status === 'COMPILATION_ERROR' ? 'Compilation Error' : 'Time Limit Exceeded'))}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', color: 'var(--color-text-tertiary)' }}>{new Date(sub.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {recentSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No recent submissions.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'problems' && (
          <div className="liquid-glass" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--color-text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '12px 24px', fontWeight: 600 }}>ID</th>
                  <th style={{ padding: '12px 24px', fontWeight: 600 }}>Title</th>
                  <th style={{ padding: '12px 24px', fontWeight: 600 }}>Difficulty</th>
                  <th style={{ padding: '12px 24px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 24px', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(problems) && problems.map((p, i) => (
                  <tr key={p.id} className="liquid-glass-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'white', fontSize: '0.875rem', animation: `fadeInUp 0.4s ease both`, animationDelay: `${i * 0.04}s` }}>
                    <td style={{ padding: '14px 24px', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-code)' }}>{p.id}</td>
                    <td style={{ padding: '14px 24px', fontWeight: 600 }}>{p.title}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <span className={`liquid-pill ${{ Easy: 'liquid-glass-green', Medium: 'liquid-glass-amber', Hard: 'liquid-glass-rose' }[p.difficulty as string] || ''}`}
                        style={{ color: { Easy: '#10B981', Medium: '#F59E0B', Hard: '#F43F5E' }[p.difficulty as string], fontSize: '0.7rem' }}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <span className={`liquid-pill ${p.published ? 'liquid-glass-green' : 'liquid-glass-amber'}`}
                        style={{ color: p.published ? '#10B981' : '#F59E0B', fontSize: '0.7rem' }}>
                        {p.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <button onClick={() => openEditModal(p)} className="liquid-btn liquid-glass-hover" style={{ color: 'white', padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="liquid-modal animate-scaleIn" style={{ borderRadius: 20, padding: 32, width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: 'white', marginBottom: 24, fontSize: '1.4rem', fontWeight: 800 }}>{editingId ? 'Edit Problem' : 'Create New Problem'}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Problem Title" className="liquid-input" style={{ flex: 2, padding: '12px 16px', borderRadius: 10, color: 'white' }} />
                <select value={newDifficulty} onChange={e => setNewDifficulty(e.target.value)} className="liquid-input" style={{ flex: 1, padding: '12px 16px', borderRadius: 10, color: 'white' }}>
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
              
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Markdown Description..." rows={6} className="liquid-input" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, color: 'white', resize: 'vertical' }} />
              
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={newPublished} onChange={e => setNewPublished(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#3B82F6' }} />
                Publish immediately (Visible to users)
              </label>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '8px 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: 700 }}>Test Cases</h3>
                <button onClick={() => setNewTestCases([...newTestCases, { input: '', expectedOutput: '', isHidden: false }])} className="liquid-btn liquid-glass-green" style={{ color: '#34D399', padding: '5px 14px', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>+ Add Case</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {newTestCases.map((tc, idx) => (
                  <div key={idx} className="liquid-glass" style={{ padding: 16, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 600 }}>Case {idx + 1}</span>
                      <button onClick={() => setNewTestCases(newTestCases.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#F43F5E', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Remove</button>
                    </div>
                    <textarea value={tc.input} onChange={e => { const nc = [...newTestCases]; nc[idx].input = e.target.value; setNewTestCases(nc) }} placeholder="Input" rows={2} className="liquid-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, color: 'white', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                    <textarea value={tc.expectedOutput} onChange={e => { const nc = [...newTestCases]; nc[idx].expectedOutput = e.target.value; setNewTestCases(nc) }} placeholder="Expected Output" rows={2} className="liquid-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 7, color: 'white', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={tc.isHidden} onChange={e => { const nc = [...newTestCases]; nc[idx].isHidden = e.target.checked; setNewTestCases(nc) }} style={{ accentColor: '#3B82F6' }} />
                      Hidden Test Case (Used for final evaluation only)
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '8px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {(['python', 'javascript', 'cpp', 'java'] as const).map(lang => (
                  <div key={lang}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--color-text-tertiary)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : lang.charAt(0).toUpperCase() + lang.slice(1)} Template</label>
                    <textarea value={newTemplates[lang]} onChange={e => setNewTemplates({ ...newTemplates, [lang]: e.target.value })} placeholder={lang === 'python' ? 'def solve():' : lang === 'cpp' ? '#include <bits/stdc++.h>' : ''} rows={4} className="liquid-input" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, color: 'white', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28 }}>
              <button onClick={() => setShowModal(false)} className="liquid-btn liquid-glass-hover" style={{ color: 'var(--color-text-secondary)', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>Cancel</button>
              <button onClick={handleSaveProblem} style={{ background: 'linear-gradient(135deg,#3B82F6,#14B8A6)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(59,130,246,0.4)', animation: 'gradient-x 3s ease infinite', backgroundSize: '200% 200%' }}>Save Problem</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
