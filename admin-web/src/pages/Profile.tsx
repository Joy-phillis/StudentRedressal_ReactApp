import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import './Profile.css'

export default function Profile() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setEmail(user.email || '')
      setAvatarUrl(user.avatar_url || null)
    }
  }, [user])

  async function handleUploadPhoto() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const files = event.target.files
      if (!files || files.length === 0) return

      const file = files[0]
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      setUploading(true)

      // Upload to Supabase Storage with consistent path
      const filePath = `${user?.id}/profile.jpg`

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      const imageUrl = urlData.publicUrl

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: imageUrl })
        .eq('id', user?.id)

      if (updateError) throw updateError

      setAvatarUrl(imageUrl)
      alert('Profile image updated successfully!')
    } catch (error: any) {
      console.error('Upload error:', error)
      alert('Error uploading image: ' + error.message)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleSaveProfile() {
    if (!fullName.trim()) {
      alert('Please enter your full name')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        email: email,
      })
      .eq('id', user?.id)

    if (error) {
      alert('Error updating profile: ' + error.message)
    } else {
      alert('Profile updated successfully!')
    }

    setLoading(false)
  }

  async function handleLogout() {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout()
      window.location.href = '/'
    }
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <a href="/dashboard" className="back-btn">← Back</a>
        <h1>Profile</h1>
        <div className="header-spacer"></div>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          {/* Profile Photo Section */}
          <div className="profile-photo-section">
            <div className="profile-avatar-wrapper">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  <span>👤</span>
                </div>
              )}
              <button
                className="camera-btn"
                onClick={handleUploadPhoto}
                disabled={uploading}
              >
                {uploading ? '⏳' : '📷'}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <p className="photo-help">
              {uploading ? 'Uploading...' : 'Click camera icon to change photo'}
            </p>
          </div>

          {/* Profile Form */}
          <div className="profile-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <div className="role-display">
                <span className="role-badge">{user?.role?.toUpperCase()}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Account Status</label>
              <div className="status-display">
                <span className="status-badge active">Active</span>
              </div>
            </div>

            <div className="form-actions">
              <button
                className="save-btn"
                onClick={handleSaveProfile}
                disabled={loading || uploading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="account-info">
          <h3>Account Information</h3>
          <div className="info-row">
            <span className="info-label">Member Since:</span>
            <span className="info-value">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">User ID:</span>
            <span className="info-value">{user?.id?.substring(0, 8)}...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
