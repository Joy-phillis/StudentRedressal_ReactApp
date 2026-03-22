import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import './AllComplaints.css'

interface Complaint {
  id: string
  title: string
  description: string
  status: string
  category: string
  created_at: string
  assigned_to: string | null
}

interface Staff {
  id: string
  full_name: string
}

export default function AllComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchComplaints()
    fetchStaff()
  }, [])

  async function fetchComplaints() {
    setLoading(true)
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setComplaints(data)
    }
    setLoading(false)
  }

  async function fetchStaff() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'staff')

    if (!error && data) {
      setStaffList(data)
    }
  }

  function openDetails(item: Complaint) {
    setSelectedComplaint(item)
    setSelectedStaff(item.assigned_to || null)
    setModalOpen(true)
  }

  function closeDetails() {
    setSelectedComplaint(null)
    setSelectedStaff(null)
    setModalOpen(false)
  }

  async function assignToStaff() {
    if (!selectedStaff) {
      alert('Please select a staff member')
      return
    }

    if (selectedComplaint?.assigned_to === selectedStaff) {
      alert('This staff is already assigned')
      return
    }

    const { error } = await supabase
      .from('complaints')
      .update({ assigned_to: selectedStaff, status: 'In-Progress' })
      .eq('id', selectedComplaint?.id)

    if (!error) {
      alert('Complaint assigned successfully!')
      fetchComplaints()
      closeDetails()
    } else {
      alert('Failed to assign complaint. Try again.')
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

  const filteredData = complaints.filter(
    c =>
      (filter === 'All' || c.status === filter) &&
      c.title.toLowerCase().includes(search.toLowerCase())
  )

  const sortedData = [...filteredData].sort((a, b) =>
    sortAsc
      ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="complaints-container">
      <div className="complaints-header">
        <a href="/dashboard" className="back-btn">← Back</a>
        <h1>All Complaints</h1>
        <div className="header-spacer"></div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="filter-buttons">
            {['All', 'Pending', 'In-Progress', 'Resolved', 'Overdue'].map(status => (
              <button
                key={status}
                className={`filter-btn ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            className="sort-btn"
            onClick={() => setSortAsc(!sortAsc)}
          >
            Sort: {sortAsc ? 'Oldest' : 'Newest'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading complaints...</div>
      ) : (
        <div className="complaints-list">
          {sortedData.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>No complaints found</p>
            </div>
          ) : (
            sortedData.map(complaint => (
              <div
                key={complaint.id}
                className="complaint-card"
                style={{ borderLeftColor: getStatusColor(complaint.status) }}
              >
                <div className="complaint-info">
                  <div className="complaint-title">{complaint.title}</div>
                  <div className="complaint-meta">
                    <span className="complaint-category">{complaint.category}</span>
                    <span className="complaint-date">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="complaint-actions">
                  <span
                    className="complaint-status"
                    style={{
                      backgroundColor: getStatusColor(complaint.status) + '20',
                      color: getStatusColor(complaint.status)
                    }}
                  >
                    {complaint.status}
                  </span>
                  <button
                    className="view-btn"
                    onClick={() => openDetails(complaint)}
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedComplaint && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complaint Details</h2>
              <button className="close-btn" onClick={closeDetails}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>Title:</label>
                <span>{selectedComplaint.title}</span>
              </div>
              <div className="detail-row">
                <label>Category:</label>
                <span>{selectedComplaint.category}</span>
              </div>
              <div className="detail-row">
                <label>Status:</label>
                <span
                  className={`status-badge ${selectedComplaint.status === 'Active' ? 'active' : 'pending'}`}
                  style={{
                    backgroundColor: getStatusColor(selectedComplaint.status) + '20',
                    color: getStatusColor(selectedComplaint.status)
                  }}
                >
                  {selectedComplaint.status}
                </span>
              </div>
              <div className="detail-row">
                <label>Description:</label>
                <span className="description-text">{selectedComplaint.description}</span>
              </div>
              <div className="detail-row">
                <label>Created:</label>
                <span>{new Date(selectedComplaint.created_at).toLocaleString()}</span>
              </div>

              {/* Assign to Staff */}
              <div className="assign-section">
                <label className="assign-label">Assign to Staff:</label>
                <select
                  value={selectedStaff || ''}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="staff-select"
                >
                  <option value="">Select Staff</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="assign-btn"
                onClick={assignToStaff}
                disabled={!selectedStaff}
              >
                Assign Complaint
              </button>
              <button className="close-modal-btn" onClick={closeDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
