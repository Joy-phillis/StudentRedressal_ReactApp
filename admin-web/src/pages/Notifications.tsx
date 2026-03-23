import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import './Notifications.css'

interface Notification {
  id: number
  type: 'complaint' | 'system' | 'announcement' | 'update' | 'urgent' | 'rating'
  title: string
  message: string
  created_at: string
  is_read: boolean
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setNotifications(data)
    }
    setLoading(false)
  }

  async function markAsRead(id: number) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      )
    }
  }

  async function markAsUnread(id: number) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: false })
      .eq('id', id)

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: false } : n))
      )
    }
  }

  async function deleteNotification(id: number) {
    if (!confirm('Delete this notification?')) return

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }
  }

  async function markAllAsRead() {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'urgent': return '⚠️'
      case 'complaint': return '📋'
      case 'update': return '✅'
      case 'announcement': return '📢'
      case 'system': return '⚙️'
      case 'rating': return '⭐'
      default: return '🔔'
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (selectedFilter === 'unread') return !n.is_read
    if (selectedFilter === 'all') return true
    return n.type === selectedFilter
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <a href="/dashboard" className="back-btn">← Back</a>
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
        <button className="mark-all-btn" onClick={markAllAsRead}>
          Mark All Read
        </button>
      </div>

      <div className="filter-buttons">
        {['all', 'unread', 'complaint', 'rating', 'urgent', 'announcement'].map(filter => (
          <button
            key={filter}
            className={`filter-btn ${selectedFilter === filter ? 'active' : ''}`}
            onClick={() => setSelectedFilter(filter)}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <span>🔔</span>
          <p>No notifications</p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <h3>{notification.title}</h3>
                  {!notification.is_read && <span className="unread-dot"></span>}
                </div>
                <p>{notification.message}</p>
                <span className="notification-time">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
              <div className="notification-actions">
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    notification.is_read ? markAsUnread(notification.id) : markAsRead(notification.id)
                  }}
                >
                  {notification.is_read ? '📧 Mark Unread' : '📬 Mark Read'}
                </button>
                <button
                  className="action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNotification(notification.id)
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
