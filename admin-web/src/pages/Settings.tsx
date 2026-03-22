import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import './Settings.css'

export default function Settings() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)

  useEffect(() => {
    // Load user preferences if stored
    const prefs = localStorage.getItem('notificationPrefs')
    if (prefs) {
      const parsed = JSON.parse(prefs)
      setNotificationsEnabled(parsed.enabled)
      setEmailNotifications(parsed.email)
    }
  }, [])

  async function handleLogout() {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout()
      window.location.href = '/'
    }
  }

  async function handleSavePreferences() {
    setLoading(true)
    localStorage.setItem('notificationPrefs', JSON.stringify({
      enabled: notificationsEnabled,
      email: emailNotifications,
    }))
    alert('Settings saved successfully!')
    setLoading(false)
  }

  async function handleChangePassword() {
    const email = prompt('Enter your email to reset password:')
    if (email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      })
      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('Password reset email sent! Check your inbox.')
      }
    }
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <a href="/dashboard" className="back-btn">← Back</a>
        <h1>Settings</h1>
        <div className="header-spacer"></div>
      </div>

      <div className="settings-content">
        {/* Profile Section */}
        <section className="settings-section">
          <h2 className="section-title">Profile</h2>
          <div className="profile-card">
            <div className="profile-avatar-large">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" />
              ) : (
                <span>👤</span>
              )}
            </div>
            <div className="profile-info">
              <div className="profile-name">{user?.full_name}</div>
              <div className="profile-email">{user?.email}</div>
              <div className="profile-role">{user?.role?.toUpperCase()}</div>
            </div>
            <a href="/profile" className="edit-profile-btn">Edit Profile</a>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="settings-section">
          <h2 className="section-title">Notifications</h2>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Push Notifications</div>
              <div className="setting-description">Receive real-time notifications</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Email Notifications</div>
              <div className="setting-description">Receive notifications via email</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                disabled={!notificationsEnabled}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <button
            className="save-btn"
            onClick={handleSavePreferences}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </section>

        {/* Security Section */}
        <section className="settings-section">
          <h2 className="section-title">Security</h2>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Change Password</div>
              <div className="setting-description">Update your password</div>
            </div>
            <button className="action-btn" onClick={handleChangePassword}>
              Change
            </button>
          </div>
        </section>

        {/* Account Section */}
        <section className="settings-section">
          <h2 className="section-title">Account</h2>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-label">Account Status</div>
              <div className="setting-description">Your account is active</div>
            </div>
            <span className="status-badge active">Active</span>
          </div>
        </section>

        {/* Logout Section */}
        <section className="settings-section">
          <button className="logout-btn-large" onClick={handleLogout}>
            🚪 Logout
          </button>
        </section>

        {/* App Info */}
        <div className="app-info">
          <div className="app-version">Admin Dashboard v1.0.0</div>
          <div className="app-copyright">© 2024 Student Redressal System</div>
        </div>
      </div>
    </div>
  )
}
