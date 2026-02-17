import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function ActivityTracker({ supabase, user }) {
  const [todayActivity, setTodayActivity] = useState(null)
  const [calls, setCalls] = useState(0)
  const [emails, setEmails] = useState(0)
  const [linkedin, setLinkedin] = useState(0)
  const [weekData, setWeekData] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTodayActivity()
    fetchWeekData()
  }, [])

  const fetchTodayActivity = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_date', today)
      .single()

    if (data) {
      setTodayActivity(data)
      setCalls(data.calls || 0)
      setEmails(data.emails || 0)
      setLinkedin(data.linkedin_touches || 0)
    }
  }

  const fetchWeekData = async () => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    
    const { data } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('activity_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('activity_date', { ascending: true })

    setWeekData(data || [])
  }

  const saveActivity = async () => {
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]

    if (todayActivity) {
      await supabase
        .from('daily_activities')
        .update({
          calls,
          emails,
          linkedin_touches: linkedin
        })
        .eq('id', todayActivity.id)
    } else {
      await supabase
        .from('daily_activities')
        .insert({
          user_id: user.id,
          user_email: user.email,
          activity_date: today,
          calls,
          emails,
          linkedin_touches: linkedin
        })
    }

    await fetchTodayActivity()
    await fetchWeekData()
    setSaving(false)
  }

  const getWeekTotal = (field) => {
    return weekData.reduce((sum, day) => sum + (day[field] || 0), 0)
  }

  return (
    <div style={{ padding: '40px 60px', maxWidth: '1200px', margin: '0 auto' }}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '42px', marginBottom: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📊 Daily Activity</h1>
          <p style={{ color: '#666', fontSize: '18px' }}>Track your calls, emails, and LinkedIn touches</p>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: '30px' }}>
          <h2 style={{ marginTop: 0, marginBottom: '30px', fontSize: '24px' }}>Today's Activity</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '40px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '16px', fontWeight: '500', color: '#333' }}>📞 Calls Made</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCalls(Math.max(0, calls - 1))} style={{ width: '50px', height: '50px', background: '#f8f9fa', border: '2px solid #ddd', borderRadius: '12px', fontSize: '24px', cursor: 'pointer', fontWeight: 'bold' }}>−</motion.button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '48px', fontWeight: 'bold', color: '#667eea' }}>{calls}</div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCalls(calls + 1)} style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '12px', fontSize: '24px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>+</motion.button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '16px', fontWeight: '500', color: '#333' }}>✉️ Emails Sent</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEmails(Math.max(0, emails - 1))} style={{ width: '50px', height: '50px', background: '#f8f9fa', border: '2px solid #ddd', borderRadius: '12px', fontSize: '24px', cursor: 'pointer', fontWeight: 'bold' }}>−</motion.button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '48px', fontWeight: 'bold', color: '#764ba2' }}>{emails}</div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEmails(emails + 1)} style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '12px', fontSize: '24px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>+</motion.button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '16px', fontWeight: '500', color: '#333' }}>💼 LinkedIn Touches</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setLinkedin(Math.max(0, linkedin - 1))} style={{ width: '50px', height: '50px', background: '#f8f9fa', border: '2px solid #ddd', borderRadius: '12px', fontSize: '24px', cursor: 'pointer', fontWeight: 'bold' }}>−</motion.button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '48px', fontWeight: 'bold', color: '#0077b5' }}>{linkedin}</div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setLinkedin(linkedin + 1)} style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '12px', fontSize: '24px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>+</motion.button>
              </div>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={saveActivity} disabled={saving} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Save Activity'}
          </motion.button>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '30px', fontSize: '24px' }}>This Week's Summary</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <motion.div whileHover={{ scale: 1.05 }} style={{ background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)', padding: '30px', borderRadius: '16px', textAlign: 'center', border: '2px solid #667eea30' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>📞 Total Calls</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#667eea' }}>{getWeekTotal('calls')}</div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} style={{ background: 'linear-gradient(135deg, #764ba220 0%, #667eea20 100%)', padding: '30px', borderRadius: '16px', textAlign: 'center', border: '2px solid #764ba230' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>✉️ Total Emails</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#764ba2' }}>{getWeekTotal('emails')}</div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} style={{ background: 'linear-gradient(135deg, #0077b520 0%, #00a0dc20 100%)', padding: '30px', borderRadius: '16px', textAlign: 'center', border: '2px solid #0077b530' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>💼 LinkedIn Touches</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#0077b5' }}>{getWeekTotal('linkedin_touches')}</div>
            </motion.div>
          </div>

          {weekData.length > 0 && (
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Daily Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {weekData.slice().reverse().map((day, index) => (
                  <motion.div key={day.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.05 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
                    <div style={{ fontWeight: '500', color: '#333', minWidth: '120px' }}>
                      {new Date(day.activity_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', gap: '40px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Calls</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>{day.calls}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Emails</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#764ba2' }}>{day.emails}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>LinkedIn</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0077b5' }}>{day.linkedin_touches}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ActivityTracker
