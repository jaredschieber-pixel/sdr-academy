import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function Leaderboard({ supabase, currentUserId }) {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('total_xp', { ascending: false })
      .limit(20)

    setLeaders(data || [])
    setLoading(false)
  }

  const getLevelIcon = (level) => {
    const icons = { rookie: '🥉', prospector: '🥈', closer: '🥇', elite: '💎' }
    return icons[level] || '🥉'
  }

  const getRankEmoji = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  const getRankColor = (index) => {
    if (index === 0) return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
    if (index === 1) return 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)'
    if (index === 2) return 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)'
    return '#f0f0f0'
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>Loading leaderboard...</div>
  }

  return (
    <div style={{ padding: '40px 60px', maxWidth: '1200px', margin: '0 auto' }}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '42px', marginBottom: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🏆 Leaderboard</h1>
          <p style={{ color: '#666', fontSize: '18px' }}>Top performers this month</p>
        </div>

        {/* Top 3 Podium */}
        {leaders.length >= 3 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '20px', marginBottom: '60px' }}>
            {/* 2nd Place */}
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ textAlign: 'center', flex: 1, maxWidth: '200px' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '10px', border: '3px solid #C0C0C0', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🥈</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>{leaders[1].email?.split('@')[0]}</div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px', textTransform: 'capitalize' }}>{getLevelIcon(leaders[1].level)} {leaders[1].level}</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#764ba2' }}>{leaders[1].total_xp} XP</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)', height: '100px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: 'bold' }}>2</div>
            </motion.div>

            {/* 1st Place */}
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} style={{ textAlign: 'center', flex: 1, maxWidth: '220px' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '25px', marginBottom: '10px', border: '3px solid #FFD700', boxShadow: '0 12px 32px rgba(255, 215, 0, 0.3)' }}>
                <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: '56px', marginBottom: '10px' }}>👑</motion.div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>{leaders[0].email?.split('@')[0]}</div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px', textTransform: 'capitalize' }}>{getLevelIcon(leaders[0].level)} {leaders[0].level}</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>{leaders[0].total_xp} XP</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', height: '140px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '40px', fontWeight: 'bold', boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)' }}>1</div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ textAlign: 'center', flex: 1, maxWidth: '200px' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '10px', border: '3px solid #CD7F32', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🥉</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>{leaders[2].email?.split('@')[0]}</div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px', textTransform: 'capitalize' }}>{getLevelIcon(leaders[2].level)} {leaders[2].level}</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#764ba2' }}>{leaders[2].total_xp} XP</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)', height: '80px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: 'bold' }}>3</div>
            </motion.div>
          </div>
        )}

        {/* Rest of Rankings */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '25px', fontSize: '20px' }}>All Rankings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leaders.map((leader, index) => (
              <motion.div
                key={leader.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px',
                  borderRadius: '12px',
                  background: leader.id === currentUserId ? 'linear-gradient(90deg, #e7f3ff 0%, #fff 100%)' : '#f8f9fa',
                  border: leader.id === currentUserId ? '2px solid #667eea' : '2px solid transparent',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ width: '60px', textAlign: 'center', fontSize: index < 3 ? '32px' : '20px', fontWeight: 'bold' }}>
                  {getRankEmoji(index)}
                </div>
                <div style={{ flex: 1, marginLeft: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                      {leader.email?.split('@')[0]}
                    </span>
                    {leader.id === currentUserId && (
                      <span style={{ background: '#667eea', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>YOU</span>
                    )}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', textTransform: 'capitalize' }}>
                    {getLevelIcon(leader.level)} {leader.level}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: index < 3 ? '#667eea' : '#333' }}>
                    {leader.total_xp}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>XP</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Leaderboard
