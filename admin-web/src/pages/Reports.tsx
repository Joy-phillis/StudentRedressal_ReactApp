import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import './Reports.css'

export default function Reports() {
  const [reportData, setReportData] = useState({
    totalComplaints: 0,
    resolved: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0,
    totalStudents: 0,
    totalStaff: 0,
  })
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ category: string; count: number }[]>([])
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    try {
      // Fetch complaints
      const { data: complaints } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })

      let resolved = 0, pending = 0, inProgress = 0, overdue = 0
      const categoryCount: { [key: string]: number } = {}
      const monthCount: { [key: string]: number } = {}

      complaints?.forEach(c => {
        // Status breakdown
        if (c.status === 'Resolved') resolved++
        else if (c.status === 'Pending') pending++
        else if (c.status === 'In-Progress') inProgress++
        else if (c.status === 'Overdue') overdue++

        // Category breakdown
        const cat = c.category || 'Uncategorized'
        categoryCount[cat] = (categoryCount[cat] || 0) + 1

        // Monthly breakdown
        const month = new Date(c.created_at).toLocaleString('default', { month: 'short', year: '2-digit' })
        monthCount[month] = (monthCount[month] || 0) + 1
      })

      // Fetch users
      const { data: users } = await supabase.from('profiles').select('role')
      const students = users?.filter(u => u.role === 'student').length || 0
      const staff = users?.filter(u => u.role === 'staff').length || 0

      setReportData({
        totalComplaints: complaints?.length || 0,
        resolved,
        pending,
        inProgress,
        overdue,
        totalStudents: students,
        totalStaff: staff,
      })

      setCategoryBreakdown(
        Object.entries(categoryCount)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
      )

      setMonthlyData(
        Object.entries(monthCount)
          .map(([month, count]) => ({ month, count }))
          .slice(-6) // Last 6 months
      )
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
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

  const resolutionRate = reportData.totalComplaints > 0
    ? Math.round((reportData.resolved / reportData.totalComplaints) * 100)
    : 0

  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <a href="/dashboard" className="back-btn">← Back</a>
        <h1>Reports & Analytics</h1>
        <div className="header-spacer"></div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card primary">
          <div className="summary-icon">📋</div>
          <div className="summary-value">{reportData.totalComplaints}</div>
          <div className="summary-label">Total Complaints</div>
        </div>
        <div className="summary-card success">
          <div className="summary-icon">✅</div>
          <div className="summary-value">{reportData.resolved}</div>
          <div className="summary-label">Resolved</div>
        </div>
        <div className="summary-card warning">
          <div className="summary-icon">⏳</div>
          <div className="summary-value">{reportData.pending}</div>
          <div className="summary-label">Pending</div>
        </div>
        <div className="summary-card danger">
          <div className="summary-icon">⚠️</div>
          <div className="summary-value">{reportData.overdue}</div>
          <div className="summary-label">Overdue</div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="stats-section">
        <h2 className="section-title">User Statistics</h2>
        <div className="user-stats-grid">
          <div className="user-stat-card">
            <div className="user-stat-icon">👨‍🎓</div>
            <div className="user-stat-value">{reportData.totalStudents}</div>
            <div className="user-stat-label">Total Students</div>
          </div>
          <div className="user-stat-card">
            <div className="user-stat-icon">👥</div>
            <div className="user-stat-value">{reportData.totalStaff}</div>
            <div className="user-stat-label">Total Staff</div>
          </div>
          <div className="user-stat-card">
            <div className="user-stat-icon">📊</div>
            <div className="user-stat-value">{resolutionRate}%</div>
            <div className="user-stat-label">Resolution Rate</div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="stats-section">
        <h2 className="section-title">Complaint Status Breakdown</h2>
        <div className="status-breakdown">
          {[
            { label: 'Pending', value: reportData.pending, color: '#FF9800' },
            { label: 'In-Progress', value: reportData.inProgress, color: '#1E5F9E' },
            { label: 'Resolved', value: reportData.resolved, color: '#4CAF50' },
            { label: 'Overdue', value: reportData.overdue, color: '#FF3B30' },
          ].map(status => (
            <div key={status.label} className="status-bar-container">
              <div className="status-bar-label">{status.label}</div>
              <div className="status-bar">
                <div
                  className="status-bar-fill"
                  style={{
                    width: `${reportData.totalComplaints > 0 ? (status.value / reportData.totalComplaints) * 100 : 0}%`,
                    backgroundColor: status.color
                  }}
                />
              </div>
              <div className="status-bar-value">{status.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="stats-section">
        <h2 className="section-title">Category Breakdown</h2>
        <div className="category-grid">
          {categoryBreakdown.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>No categories available</p>
            </div>
          ) : (
            categoryBreakdown.map((cat, index) => (
              <div key={index} className="category-card">
                <div className="category-name">{cat.category}</div>
                <div className="category-count">{cat.count}</div>
                <div
                  className="category-bar"
                  style={{
                    width: `${(cat.count / reportData.totalComplaints) * 100}%`,
                    backgroundColor: getStatusColor('In-Progress')
                  }}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="stats-section">
        <h2 className="section-title">Monthly Trend (Last 6 Months)</h2>
        <div className="monthly-chart">
          {monthlyData.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>No data available</p>
            </div>
          ) : (
            <div className="chart-bars">
              {monthlyData.map((item, index) => {
                const maxCount = Math.max(...monthlyData.map(d => d.count))
                const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                return (
                  <div key={index} className="chart-column">
                    <div className="chart-value">{item.count}</div>
                    <div
                      className="chart-bar"
                      style={{ height: `${height}%` }}
                    />
                    <div className="chart-label">{item.month}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Export Button */}
      <div className="export-section">
        <button className="export-btn" onClick={() => window.print()}>
          📄 Print Report
        </button>
      </div>
    </div>
  )
}
