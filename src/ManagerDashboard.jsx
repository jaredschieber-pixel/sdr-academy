import { useState, useEffect } from 'react'

function ManagerDashboard({ supabase, user }) {
  const [submissions, setSubmissions] = useState([])
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchSubmissions()
  }, [filter])

  const fetchSubmissions = async () => {
    let query = supabase
      .from('user_tasks')
      .select(`
        *,
        task:tasks(title, description, xp_value),
        profile:profiles!user_tasks_user_id_fkey(email, full_name, level, total_xp)
      `)
      .order('created_at', { ascending: false })

    if (filter === 'pending') {
      query = query.eq('status', 'submitted')
    } else if (filter === 'completed') {
      query = query.eq('status', 'completed')
    }

    const { data } = await query
    setSubmissions(data || [])
  }

  const handleApprove = async (submissionId, xpValue) => {
    await supabase
      .from('user_tasks')
      .update({ 
        status: 'completed',
        reviewed_at: new Date().toISOString(),
        reviewer_id: user.id,
        reviewer_feedback: feedback
      })
      .eq('id', submissionId)

    alert('✅ Approved! XP awarded.')
    setFeedback('')
    setSelectedSubmission(null)
    fetchSubmissions()
  }

  const handleReject = async (submissionId) => {
    await supabase
      .from('user_tasks')
      .update({ 
        status: 'needs_revision',
        reviewed_at: new Date().toISOString(),
        reviewer_id: user.id,
        reviewer_feedback: feedback
      })
      .eq('id', submissionId)

    alert('📝 Marked as needs revision')
    setFeedback('')
    setSelectedSubmission(null)
    fetchSubmissions()
  }

  const pendingCount = submissions.filter(s => s.status === 'submitted').length

  return (
    <div style={{ padding: '40px 60px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>📋 Manager Dashboard</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>Review and approve SDR submissions</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e9ecef' }}>
        <button
          onClick={() => setFilter('all')}
          style={{ padding: '12px 24px', background: filter === 'all' ? '#667eea' : 'transparent', color: filter === 'all' ? 'white' : '#666', border: 'none', borderBottom: filter === 'all' ? '3px solid #667eea' : 'none', cursor: 'pointer', fontWeight: '500', fontSize: '15px' }}
        >
          All ({submissions.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          style={{ padding: '12px 24px', background: filter === 'pending' ? '#667eea' : 'transparent', color: filter === 'pending' ? 'white' : '#666', border: 'none', borderBottom: filter === 'pending' ? '3px solid #667eea' : 'none', cursor: 'pointer', fontWeight: '500', fontSize: '15px' }}
        >
          Pending Review ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          style={{ padding: '12px 24px', background: filter === 'completed' ? '#667eea' : 'transparent', color: filter === 'completed' ? 'white' : '#666', border: 'none', borderBottom: filter === 'completed' ? '3px solid #667eea' : 'none', cursor: 'pointer', fontWeight: '500', fontSize: '15px' }}
        >
          Completed
        </button>
      </div>

      {/* Submissions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {submissions.map(sub => (
          <div key={sub.id} style={{ background: 'white', padding: '30px', borderRadius: '12px', border: '2px solid #e9ecef', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', marginBottom: '8px' }}>{sub.task?.title}</h3>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <span>👤 {sub.profile?.email || sub.user_email}</span>
                  <span style={{ margin: '0 10px', color: '#ddd' }}>•</span>
                  <span style={{ textTransform: 'capitalize' }}>{sub.profile?.level || 'rookie'}</span>
                  <span style={{ margin: '0 10px', color: '#ddd' }}>•</span>
                  <span>{sub.profile?.total_xp || 0} XP</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  background: sub.status === 'completed' ? '#f6ffed' : sub.status === 'needs_revision' ? '#fff7e6' : '#e7f3ff',
                  color: sub.status === 'completed' ? '#52c41a' : sub.status === 'needs_revision' ? '#fa8c16' : '#0066ff',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  textTransform: 'capitalize'
                }}>
                  {sub.status === 'needs_revision' ? 'Needs Revision' : sub.status}
                </span>
                <span style={{ background: '#f0f0f0', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                  +{sub.task?.xp_value} XP
                </span>
              </div>
            </div>

            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '15px' }}>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px', fontWeight: '500' }}>Task Description:</p>
              <p style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', marginBottom: '20px' }}>{sub.task?.description}</p>
              
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px', fontWeight: '500' }}>Submission:</p>
              <p style={{ fontSize: '15px', color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{sub.submission_text}</p>
            </div>

            {sub.reviewer_feedback && (
              <div style={{ background: '#fff7e6', padding: '15px', borderRadius: '8px', marginBottom: '15px', borderLeft: '4px solid #fa8c16' }}>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '5px', fontWeight: '500' }}>Manager Feedback:</p>
                <p style={{ fontSize: '14px', color: '#333', margin: 0 }}>{sub.reviewer_feedback}</p>
              </div>
            )}

            {sub.status === 'submitted' && (
              <>
                {selectedSubmission === sub.id ? (
                  <div>
                    <textarea
                      placeholder="Add feedback (optional)..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      style={{ width: '100%', minHeight: '80px', padding: '12px', fontSize: '14px', border: '2px solid #ddd', borderRadius: '8px', marginBottom: '12px', fontFamily: 'system-ui', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleApprove(sub.id, sub.task?.xp_value)}
                        style={{ background: '#52c41a', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
                      >
                        ✅ Approve & Award XP
                      </button>
                      <button
                        onClick={() => handleReject(sub.id)}
                        style={{ background: '#fa8c16', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
                      >
                        📝 Request Revision
                      </button>
                      <button
                        onClick={() => { setSelectedSubmission(null); setFeedback('') }}
                        style={{ background: '#f0f0f0', color: '#666', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedSubmission(sub.id)}
                    style={{ background: '#667eea', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
                  >
                    Review Submission
                  </button>
                )}
              </>
            )}

            <div style={{ fontSize: '12px', color: '#999', marginTop: '15px' }}>
              Submitted {new Date(sub.created_at).toLocaleString()}
            </div>
          </div>
        ))}

        {submissions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
            <p style={{ fontSize: '18px' }}>No submissions yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManagerDashboard
