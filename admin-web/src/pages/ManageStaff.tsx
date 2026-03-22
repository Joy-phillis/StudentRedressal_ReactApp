import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import './ManageStaff.css'

interface Staff {
  id: string
  full_name: string
  email: string
  status: string
  created_at: string
}

export default function ManageStaff() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  async function fetchStaff() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'staff')
      .order('full_name', { ascending: true })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setStaff(data || [])
    }
    setLoading(false)
  }

  function openModal(item: Staff) {
    setSelectedStaff(item)
    setModalOpen(true)
  }

  function closeModal() {
    setSelectedStaff(null)
    setModalOpen(false)
  }

  async function toggleStatus() {
    if (!selectedStaff) return
    const newStatus = selectedStaff.status === 'Active' ? 'Suspended' : 'Active'
    setActionLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', selectedStaff.id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setStaff(prev =>
        prev.map(s => (s.id === selectedStaff.id ? { ...s, status: newStatus } : s))
      )
      setSelectedStaff({ ...selectedStaff, status: newStatus })
      alert(`Status changed to ${newStatus}`)
    }
    setActionLoading(false)
  }

  return (
    <div className="manage-container">
      <div className="manage-header">
        <a href="/dashboard" className="back-btn">← Back</a>
        <h1>Manage Staff</h1>
        <div className="header-spacer"></div>
      </div>

      {loading ? (
        <div className="loading">Loading staff...</div>
      ) : (
        <div className="staff-list">
          {staff.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>No staff members found</p>
            </div>
          ) : (
            staff.map(item => (
              <div key={item.id} className="staff-card">
                <div className="staff-info">
                  <div className="staff-name">{item.full_name}</div>
                  <div className="staff-email">{item.email}</div>
                </div>
                <div className="staff-actions">
                  <button
                    className={`status-btn ${item.status === 'Active' ? 'active' : 'suspended'}`}
                    onClick={() => openModal(item)}
                  >
                    {item.status}
                  </button>
                  <button
                    className="view-btn"
                    onClick={() => openModal(item)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedStaff && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Staff Details</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>Full Name:</label>
                <span>{selectedStaff.full_name}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{selectedStaff.email}</span>
              </div>
              <div className="detail-row">
                <label>Status:</label>
                <span className={`status-badge ${selectedStaff.status === 'Active' ? 'active' : 'suspended'}`}>
                  {selectedStaff.status}
                </span>
              </div>
              <div className="detail-row">
                <label>Joined:</label>
                <span>{new Date(selectedStaff.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className={`toggle-status-btn ${selectedStaff.status === 'Active' ? 'suspend' : 'activate'}`}
                onClick={toggleStatus}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : `Change to ${selectedStaff.status === 'Active' ? 'Suspended' : 'Active'}`}
              </button>
              <button className="close-modal-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
