import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import './ManageStudents.css'

interface Student {
  id: string
  full_name: string
  email: string
  status: string
  created_at: string
}

export default function ManageStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  async function fetchStudents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name', { ascending: true })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setStudents(data || [])
    }
    setLoading(false)
  }

  function openModal(student: Student) {
    setSelectedStudent(student)
    setModalOpen(true)
  }

  function closeModal() {
    setSelectedStudent(null)
    setModalOpen(false)
  }

  async function toggleStatus() {
    if (!selectedStudent) return
    const newStatus = selectedStudent.status === 'Active' ? 'Suspended' : 'Active'
    setActionLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', selectedStudent.id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setStudents(prev =>
        prev.map(s => (s.id === selectedStudent.id ? { ...s, status: newStatus } : s))
      )
      setSelectedStudent({ ...selectedStudent, status: newStatus })
      alert(`Status changed to ${newStatus}`)
    }
    setActionLoading(false)
  }

  const filteredStudents = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="manage-container">
      <div className="manage-header">
        <a href="/dashboard" className="back-btn">← Back</a>
        <h1>Manage Students</h1>
        <div className="header-spacer"></div>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">Loading students...</div>
      ) : (
        <div className="students-list">
          {filteredStudents.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>No students found</p>
            </div>
          ) : (
            filteredStudents.map(student => (
              <div key={student.id} className="student-card">
                <div className="student-info">
                  <div className="student-name">{student.full_name}</div>
                  <div className="student-email">{student.email}</div>
                </div>
                <div className="student-actions">
                  <button
                    className={`status-btn ${student.status === 'Active' ? 'active' : 'suspended'}`}
                    onClick={() => openModal(student)}
                  >
                    {student.status}
                  </button>
                  <button
                    className="view-btn"
                    onClick={() => openModal(student)}
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
      {modalOpen && selectedStudent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Student Details</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>Full Name:</label>
                <span>{selectedStudent.full_name}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{selectedStudent.email}</span>
              </div>
              <div className="detail-row">
                <label>Status:</label>
                <span className={`status-badge ${selectedStudent.status === 'Active' ? 'active' : 'suspended'}`}>
                  {selectedStudent.status}
                </span>
              </div>
              <div className="detail-row">
                <label>Joined:</label>
                <span>{new Date(selectedStudent.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className={`toggle-status-btn ${selectedStudent.status === 'Active' ? 'suspend' : 'activate'}`}
                onClick={toggleStatus}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : `Change to ${selectedStudent.status === 'Active' ? 'Suspended' : 'Active'}`}
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
