import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPasswordHint, setShowPasswordHint] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">🎓</div>
          </div>
          <h1 className="login-title">Admin Dashboard</h1>
          <p className="login-subtitle">Student Redressal System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-hint-btn"
                onClick={() => setShowPasswordHint(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Secure • Confidential • Transparent</p>
        </div>
      </div>

      {/* Password Requirements Modal */}
      {showPasswordHint && (
        <div className="modal-overlay" onClick={() => setShowPasswordHint(false)}>
          <div className="password-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E5F9E" strokeWidth="2" style={{ marginRight: '10px', verticalAlign: 'middle' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M12 8v4"/>
                  <path d="M12 16h.01"/>
                </svg>
                Password Requirements
              </h2>
              <button className="close-btn" onClick={() => setShowPasswordHint(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="requirement-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                <span>Minimum 8 characters</span>
              </div>
              <div className="requirement-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                <span>At least 1 uppercase letter (A-Z)</span>
              </div>
              <div className="requirement-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                <span>At least 1 lowercase letter (a-z)</span>
              </div>
              <div className="requirement-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                <span>At least 1 number (0-9)</span>
              </div>
              <div className="requirement-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                <span>At least 1 special character (@, $, !, %, *, ?, &, #, etc.)</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="close-modal-btn" onClick={() => setShowPasswordHint(false)}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
