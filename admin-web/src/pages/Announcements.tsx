import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import './Announcements.css'

interface Announcement {
  id: string
  title: string
  content: string
  created_by: string
  created_at: string
  is_active: boolean
  creator_name?: string
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    getCurrentUser()
    fetchAnnouncements()
  }, [])

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
    }
  }

  async function fetchAnnouncements() {
    setLoading(true)
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        profiles:created_by (
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      // Map the data to include creator name
      const mappedData = (data || []).map(item => ({
        ...item,
        creator_name: item.profiles?.full_name || 'Unknown',
      }))
      setAnnouncements(mappedData)
    }
    setLoading(false)
  }

  function openCreateModal() {
    setEditingAnnouncement(null)
    setTitle('')
    setContent('')
    setIsActive(true)
    setModalOpen(true)
  }

  function openEditModal(announcement: Announcement) {
    setEditingAnnouncement(announcement)
    setTitle(announcement.title)
    setContent(announcement.content)
    setIsActive(announcement.is_active)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingAnnouncement(null)
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      alert('Please fill in all fields')
      return
    }

    if (!currentUserId) {
      alert('User not authenticated')
      return
    }

    setLoading(true)

    if (editingAnnouncement) {
      // Update existing
      const { error } = await supabase
        .from('announcements')
        .update({
          title,
          content,
          is_active: isActive,
        })
        .eq('id', editingAnnouncement.id)

      if (error) {
        alert('Error updating: ' + error.message)
      } else {
        alert('Announcement updated successfully!')
        fetchAnnouncements()
        closeModal()
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('announcements')
        .insert([{
          title,
          content,
          is_active: isActive,
          created_by: currentUserId,
        }])

      if (error) {
        alert('Error creating: ' + error.message)
      } else {
        alert('Announcement created successfully!')
        fetchAnnouncements()
        closeModal()
      }
    }

    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Announcement deleted successfully!')
      fetchAnnouncements()
    }
  }

  async function toggleActive(announcement: Announcement) {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: !announcement.is_active })
      .eq('id', announcement.id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      fetchAnnouncements()
    }
  }

  return (
    <div className="announcements-container">
      <div className="announcements-header">
        <a href="/dashboard" className="back-btn">← Back</a>
        <h1>Manage Announcements</h1>
        <button className="create-btn" onClick={openCreateModal}>
          + New Announcement
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading announcements...</div>
      ) : (
        <div className="announcements-list">
          {announcements.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>No announcements yet</p>
            </div>
          ) : (
            announcements.map(announcement => (
              <div
                key={announcement.id}
                className={`announcement-card ${!announcement.is_active ? 'inactive' : ''}`}
              >
                <div className="announcement-content">
                  <div className="announcement-header">
                    <h3 className="announcement-title">{announcement.title}</h3>
                    <span className={`status-badge ${announcement.is_active ? 'active' : 'inactive'}`}>
                      {announcement.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="announcement-text">{announcement.content}</p>
                  <div className="announcement-meta">
                    <span className="announcement-date">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                    <span className="announcement-author">By: {announcement.creator_name || 'Admin'}</span>
                  </div>
                </div>
                <div className="announcement-actions">
                  <button
                    className="action-btn toggle"
                    onClick={() => toggleActive(announcement)}
                  >
                    {announcement.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => openEditModal(announcement)}
                  >
                    Edit
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter announcement title"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="content">Content</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter announcement content"
                  rows={6}
                  className="form-textarea"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span>Active (visible to users)</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : editingAnnouncement ? 'Update' : 'Create'}
              </button>
              <button className="cancel-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
