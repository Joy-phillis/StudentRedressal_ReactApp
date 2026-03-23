import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import './Dashboard.css'

interface KPI {
  label: string
  value: number
}

interface Breakdown {
  label: string
  value: number
  color: string
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [kpis, setKpis] = useState<KPI[]>([
    { label: 'Students', value: 0 },
    { label: 'Staff', value: 0 },
    { label: 'Complaints', value: 0 },
    { label: 'Escalations', value: 0 },
  ])
  const [breakdown, setBreakdown] = useState<Breakdown[]>([
    { label: 'Pending', value: 0, color: '#FF9800' },
    { label: 'In-Progress', value: 0, color: '#1E5F9E' },
    { label: 'Resolved', value: 0, color: '#4CAF50' },
    { label: 'Overdue', value: 0, color: '#FF3B30' },
  ])
  const [recentComplaints, setRecentComplaints] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [performanceInsights, setPerformanceInsights] = useState({
    avgResolutionDays: 0,
    resolutionRate: 0,
    trend: 'stable',
    message: '',
    improvement: 12,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    fetchUnreadNotifications()
  }, [])

  async function fetchDashboardData() {
    try {
      // Fetch users
      const { data: users } = await supabase.from('profiles').select('role')
      const students = users?.filter(u => u.role === 'student').length || 0
      const staffCount = users?.filter(u => u.role === 'staff').length || 0

      // Fetch complaints
      const { data: complaints } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })

      let pending = 0, inProgress = 0, resolved = 0, overdue = 0

      complaints?.forEach(c => {
        if (c.status === 'Pending') pending++
        if (c.status === 'In-Progress') inProgress++
        if (c.status === 'Resolved') resolved++
        if (c.status === 'Overdue') overdue++
      })

      setRecentComplaints(
        (complaints || []).slice(0, 4).map(c => ({
          id: c.id,
          title: c.title,
          status: c.status,
        }))
      )

      const totalComplaints = complaints?.length || 0
      const resolutionRate = totalComplaints > 0 ? Math.round((resolved / totalComplaints) * 100) : 0

      let trend = 'stable'
      let message = ''

      if (resolutionRate >= 80) {
        trend = 'improving'
        message = `System performing well! ${resolutionRate}% resolution rate.`
      } else if (resolutionRate >= 50) {
        trend = 'stable'
        message = `${pending} pending, ${resolved} resolved. ${overdue} need attention.`
      } else {
        trend = 'declining'
        message = `${pending} complaints pending. Immediate attention required.`
      }

      setKpis([
        { label: 'Students', value: students },
        { label: 'Staff', value: staffCount },
        { label: 'Complaints', value: totalComplaints },
        { label: 'Escalations', value: overdue },
      ])

      setBreakdown([
        { label: 'Pending', value: pending, color: '#FF9800' },
        { label: 'In-Progress', value: inProgress, color: '#1E5F9E' },
        { label: 'Resolved', value: resolved, color: '#4CAF50' },
        { label: 'Overdue', value: overdue, color: '#FF3B30' },
      ])

      setPerformanceInsights({
        avgResolutionDays: resolved > 0 ? 3.2 : 0,
        resolutionRate,
        trend,
        message,
        improvement: 12,
      })

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      setMessages(messagesData || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUnreadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('is_read', false)
      .eq('recipient_type', 'admin')
    setUnreadCount(data?.length || 0)
  }

  async function handleLogout() {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout()
      navigate('/')
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'Pending': return '#FF9800'
      case 'Resolved': return '#4CAF50'
      case 'In-Progress': return '#1E5F9E'
      case 'Overdue': return '#FF3B30'
      default: return '#999'
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!window.confirm('Are you sure you want to delete this message?')) return

    const { error } = await supabase.from('messages').delete().eq('id', messageId)
    if (error) {
      alert('Error deleting message: ' + error.message)
    } else {
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      alert('Message deleted successfully')
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">🎓</span>
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          <a href="/dashboard" className="nav-item active">
            <span className="nav-icon">📊</span>
            Dashboard
          </a>
          <a href="/complaints" className="nav-item">
            <span className="nav-icon">📋</span>
            All Complaints
          </a>
          <a href="/students" className="nav-item">
            <span className="nav-icon">👨‍🎓</span>
            Manage Students
          </a>
          <a href="/staff" className="nav-item">
            <span className="nav-icon">👥</span>
            Manage Staff
          </a>
          <a href="/announcements" className="nav-item">
            <span className="nav-icon">📢</span>
            Announcements
          </a>
          <a href="/reports" className="nav-item">
            <span className="nav-icon">📈</span>
            Reports
          </a>
          <a href="/settings" className="nav-item">
            <span className="nav-icon">⚙️</span>
            Settings
          </a>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <h1 className="header-title">Welcome Back,</h1>
            <h2 className="header-name">{user?.full_name || 'Admin'}</h2>
          </div>
          <div className="header-right">
            <a href="/notifications" className="notification-icon">
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </a>
            <a href="/profile" className="profile-avatar">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" />
              ) : (
                <span>👤</span>
              )}
            </a>
          </div>
        </header>

        {/* Alert Box */}
        {breakdown[3].value > 0 && (
          <div className="alert-box">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">
              {breakdown[3].value} Complaints are overdue and require immediate attention.
            </span>
          </div>
        )}

        {/* KPI Cards */}
        <section className="section">
          <h3 className="section-title">System Overview</h3>
          <div className="kpi-grid">
            {kpis.map((kpi, index) => (
              <div key={index} className={`kpi-card ${index % 2 === 1 ? 'offset' : ''}`}>
                <div className="kpi-value">{kpi.value}</div>
                <div className="kpi-label">{kpi.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Complaint Breakdown */}
        <section className="section">
          <h3 className="section-title">Complaint Breakdown</h3>
          <div className="breakdown-grid">
            {breakdown.map((item, index) => (
              <div key={index} className="breakdown-card" style={{ backgroundColor: item.color }}>
                <div className="breakdown-value">{item.value}</div>
                <div className="breakdown-label">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Management Tools */}
        <section className="section">
          <h3 className="section-title">Management Tools</h3>
          <div className="tools-grid">
            <a href="/complaints" className="tool-card">
              <span className="tool-icon">📋</span>
              <span className="tool-text">All Complaints</span>
            </a>
            <a href="/staff" className="tool-card">
              <span className="tool-icon">👥</span>
              <span className="tool-text">Manage Staff</span>
            </a>
            <a href="/students" className="tool-card">
              <span className="tool-icon">👨‍🎓</span>
              <span className="tool-text">Manage Students</span>
            </a>
            <a href="/reports" className="tool-card">
              <span className="tool-icon">📈</span>
              <span className="tool-text">Reports</span>
            </a>
          </div>
        </section>

        {/* Recent Complaints */}
        <section className="section">
          <h3 className="section-title">Recent Complaints</h3>
          <div className="complaints-list">
            {recentComplaints.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>No complaints yet</p>
              </div>
            ) : (
              recentComplaints.map(complaint => (
                <div
                  key={complaint.id}
                  className="complaint-card"
                  style={{ borderLeftColor: getStatusColor(complaint.status) }}
                >
                  <div className="complaint-info">
                    <div className="complaint-title">{complaint.title}</div>
                    <div
                      className="complaint-status"
                      style={{ color: getStatusColor(complaint.status) }}
                    >
                      {complaint.status}
                    </div>
                  </div>
                  <button className="complaint-action">
                    <span>⋮</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Messages */}
        <section className="section">
          <h3 className="section-title">Messages</h3>
          <div className="messages-section">
            {messages.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📧</span>
                <p>No messages yet</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="message-card">
                  <div className="message-content" onClick={() => alert(msg.content)}>
                    <div className="message-header">
                      <span className="message-sender">{msg.sender_type?.toUpperCase()}</span>
                      <span className="message-time">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="message-subject">{msg.subject}</div>
                    <div className="message-preview">
                      {msg.content?.substring(0, 100)}...
                    </div>
                    <span className="message-type">{msg.message_type}</span>
                  </div>
                  <button
                    className="delete-message-btn"
                    onClick={() => handleDeleteMessage(msg.id)}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Performance Insights */}
        <section className="section">
          <h3 className="section-title">Performance Insights</h3>
          <div className="performance-card">
            <div className="performance-header">
              <span className="performance-icon">📊</span>
              <span className="performance-title">System Performance</span>
            </div>
            <p className="performance-text">
              {performanceInsights.message || 'Loading performance data...'}
            </p>
            <div className="performance-metrics">
              <div className="metric-item">
                <div className="metric-value">{performanceInsights.resolutionRate}%</div>
                <div className="metric-label">Resolution Rate</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">{performanceInsights.avgResolutionDays.toFixed(1)}</div>
                <div className="metric-label">Avg Days</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">
                  {performanceInsights.trend === 'improving' ? '📈' : performanceInsights.trend === 'declining' ? '📉' : '➡️'}
                </div>
                <div className="metric-label" style={{
                  color: performanceInsights.trend === 'improving' ? '#4CAF50' : performanceInsights.trend === 'declining' ? '#FF3B30' : '#FF9800'
                }}>
                  {performanceInsights.improvement > 0 ? `+${performanceInsights.improvement}%` : performanceInsights.trend}
                </div>
              </div>
            </div>
            <div className="performance-bar">
              <div
                className="performance-bar-fill"
                style={{
                  width: `${performanceInsights.resolutionRate}%`,
                  backgroundColor: performanceInsights.resolutionRate >= 80 ? '#4CAF50' : performanceInsights.resolutionRate >= 50 ? '#FF9800' : '#FF3B30'
                }}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
