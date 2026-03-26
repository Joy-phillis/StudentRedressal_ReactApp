import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function App() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [email, setEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Check if we have a hash in the URL (recovery link)
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      // User clicked the recovery link - they're already authenticated for password reset
      console.log('Recovery link detected, user can reset password')
    }
  }, [])

  // Password validation
  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*?&#^()_\-+=]/.test(password),
    }
    return requirements
  }

  const passwordRequirements = validatePassword(newPassword)
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean)
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword

  // Handle password reset (when user has clicked the link)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isPasswordValid) {
      setError('Password does not meet all requirements')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setSuccess(true)
      // Clear the URL hash
      window.history.replaceState(null, '', window.location.pathname)
    } catch (error: any) {
      setError(error.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  // Handle sending reset email
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')

    if (!email.trim()) {
      setEmailError('Email is required')
      return
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/
    if (!emailRegex.test(email.trim())) {
      setEmailError('Enter a valid email address')
      return
    }

    setEmailLoading(true)

    try {
      // Use environment variable or default to production URL
      // For development: http://localhost:5174
      // For production: Your Vercel URL
      const siteUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:5174'
        : 'https://studentpassword.vercel.app'

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${siteUrl}/reset-password`,
      })

      if (error) throw error

      setEmailSent(true)
    } catch (error: any) {
      setEmailError(error.message || 'Failed to send reset link')
    } finally {
      setEmailLoading(false)
    }
  }

  // Show success screen after password reset
  if (success) {
    return (
      <div className="reset-container">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h1 className="success-title">Password Reset Successful!</h1>
          <p className="success-message">
            Your password has been updated successfully. You can now log in with your new password.
          </p>
          <div className="back-link">
            <a href="#" onClick={() => window.close()}>
              Close this window
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Check if user is in recovery mode (clicked email link)
  const isInRecoveryMode = window.location.hash.includes('access_token')

  // Show password reset form (user clicked the link)
  if (isInRecoveryMode) {
    return (
      <div className="reset-container">
        <div className="reset-header">
          <div className="reset-icon">🔐</div>
          <h1 className="reset-title">Reset Your Password</h1>
          <p className="reset-subtitle">Create a new strong password</p>
        </div>

        {error && (
          <div className="message error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword}>
          <div className="input-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={loading}
              />
            </div>
          </div>

          <div className="password-requirements">
            <h4>Password Requirements:</h4>
            <div className="requirement-item">
              <span>{passwordRequirements.length ? '✓' : '○'}</span>
              <span className={passwordRequirements.length ? 'valid' : ''}>Minimum 8 characters</span>
            </div>
            <div className="requirement-item">
              <span>{passwordRequirements.uppercase ? '✓' : '○'}</span>
              <span className={passwordRequirements.uppercase ? 'valid' : ''}>At least 1 uppercase letter (A-Z)</span>
            </div>
            <div className="requirement-item">
              <span>{passwordRequirements.lowercase ? '✓' : '○'}</span>
              <span className={passwordRequirements.lowercase ? 'valid' : ''}>At least 1 lowercase letter (a-z)</span>
            </div>
            <div className="requirement-item">
              <span>{passwordRequirements.number ? '✓' : '○'}</span>
              <span className={passwordRequirements.number ? 'valid' : ''}>At least 1 number (0-9)</span>
            </div>
            <div className="requirement-item">
              <span>{passwordRequirements.special ? '✓' : '○'}</span>
              <span className={passwordRequirements.special ? 'valid' : ''}>At least 1 special character</span>
            </div>
          </div>

          <button type="submit" className="reset-button" disabled={loading || !isPasswordValid || !passwordsMatch}>
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <span>🔐</span>
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>

        <div className="back-link">
          <a href="#" onClick={(e) => { e.preventDefault(); window.location.href = window.location.origin; }}>
            ← Back to Login
          </a>
        </div>
      </div>
    )
  }

  // Show email input form (initial state)
  return (
    <div className="reset-container">
      <div className="reset-header">
        <div className="reset-icon">📧</div>
        <h1 className="reset-title">Forgot Password?</h1>
        <p className="reset-subtitle">Enter your email to receive a reset link</p>
      </div>

      {emailError && (
        <div className="message error">
          <span>⚠️</span>
          <span>{emailError}</span>
        </div>
      )}

      {emailSent && (
        <div className="message success">
          <span>✓</span>
          <span>Reset link sent! Check your email inbox.</span>
        </div>
      )}

      <form onSubmit={handleSendResetEmail}>
        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <div className="input-wrapper">
            <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              disabled={emailLoading || emailSent}
            />
          </div>
        </div>

        <button type="submit" className="reset-button" disabled={emailLoading || emailSent}>
          {emailLoading ? (
            <>
              <div className="loading-spinner"></div>
              <span>Sending...</span>
            </>
          ) : emailSent ? (
            <>
              <span>✓</span>
              <span>Link Sent!</span>
            </>
          ) : (
            <>
              <span>📧</span>
              <span>Send Reset Link</span>
            </>
          )}
        </button>
      </form>

      <div className="back-link">
        <a href="#" onClick={(e) => { e.preventDefault(); window.location.href = window.location.origin + '/'; }}>
          ← Back to Login
        </a>
      </div>
    </div>
  )
}

export default App
