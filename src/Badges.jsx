import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const BADGE_DEFINITIONS = [
  { type: 'first_task', name: 'First Steps', icon: '🎯', description: 'Complete your first task' },
  { type: 'task_5', name: 'Getting Started', icon: '⭐', description: 'Complete 5 tasks' },
  { type: 'task_10', name: 'Committed', icon: '🌟', description: 'Complete 10 tasks' },
  { type: 'prospector', name: 'Prospector', icon: '🥈', description: 'Reach Prospector level' },
  { type: 'closer', name: 'Closer', icon: '🥇', description: 'Reach Closer level' },
  { type: 'elite', name: 'Elite', icon: '💎', description: 'Reach Elite level' },
  { type: 'call_50', name: 'Phone Warrior', icon: '📞', description: 'Make 50 calls in a week' },
  { type: 'email_50', name: 'Email Champion', icon: '✉️', description: 'Send 50 emails in a week' },
  { type: 'linkedin_50', name: 'Social Seller', icon: '💼', description: '50 LinkedIn touches in a week' },
  { type: 'perfect_week', name: 'Perfect Week', icon: '🔥', description: 'Hit all targets for 7 days straight' }
]

function Badges({ supabase, user, userTasks, profile }) {
  const [userBadges, setUserBadges] = useState([])
  const [showCelebration, setShowCelebration] = useState(null)

  useEffect(() => {
    fetchBadges()
  }, [])

  useEffect(() => {
    if (userTasks.length > 0 && profile) {
      checkAndAwardBadges()
    }
  }, [userTasks, profile])

  const fetchBadges = async () => {
    const { data } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id)

    setUserBadges(data || [])
  }

  const hasBadge = (badgeType) => {
    return userBadges.some(b => b.badge_type === badgeType)
  }

  const awardBadge = async (badgeType) => {
    if (hasBadge(badgeType)) return

    await supabase
      .from('user_badges')
      .insert({
        user_id: user.id,
        badge_type: badgeType
      })

    await fetchBadges()
    
    const badge = BADGE_DEFINITIONS.find(b => b.type === badgeType)
    setShowCelebration(badge)
    setTimeout(() => setShowCelebration(null), 3000)
  }

  const checkAndAwardBadges = async () => {
    const completedCount = userTasks.filter(ut => ut.status === 'completed').length

    // Task badges
    if (completedCount >= 1 && !hasBadge('first_task')) {
      awardBadge('first_task')
    }
    if (completedCount >= 5 && !hasBadge('task_5')) {
      awardBadge('task_5')
    }
    if (completedCount >= 10 && !hasBadge('task_10')) {
      awardBadge('task_10')
    }

    // Level badges
    if (profile?.level === 'prospector' && !hasBadge('prospector')) {
      awardBadge('prospector')
    }
    if (profile?.level === 'closer' && !hasBadge('closer')) {
      awardBadge('closer')
    }
    if (profile?.level === 'elite' && !hasBadge('elite')) {
      awardBadge('elite')
    }
  }

  const earnedBadges = BADGE_DEFINITIONS.filter(b => hasBadge(b.type))
  const lockedBadges = BADGE_DEFINITIONS.filter(b => !hasBadge(b.type))

  return (
    <div style={{ padding: '40px 60px', maxWidth: '1200px', margin: '0 auto' }}>
      {showCelebration && (
        <motion.div initial={{ opacity: 0, scale: 0.5, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5 }} style={{ position: 'fixed', bottom: '40px', right: '40px', background: 'white', padding: '30px 40px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', zIndex: 1000, border: '3px solid #FFD700' }}>
          <div style={{ fontSize: '64px', marginBottom: '15px', textAlign: 'center' }}>{showCelebration.icon}</div>
          <h3 style={{ margin: 0, fontSize: '24px', marginBottom: '8px', color: '#333', textAlign: 'center' }}>Badge Earned!</h3>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#667eea', textAlign: 'center' }}>{showCelebration.name}</p>
        </motion.div>
      )}

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '42px', marginBottom: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🏆 Badges</h1>
          <p style={{ color: '#666', fontSize: '18px' }}>Earn badges by completing challenges</p>
          <div style={{ marginTop: '20px', fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
            {earnedBadges.length} / {BADGE_DEFINITIONS.length} Earned
          </div>
        </div>

        {earnedBadges.length > 0 && (
          <div style={{ marginBottom: '50px' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '25px' }}>✨ Your Badges</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {earnedBadges.map((badge, index) => (
                <motion.div
                  key={badge.type}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.1, type: 'spring' }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    padding: '30px',
                    borderRadius: '20px',
                    textAlign: 'center',
                    boxShadow: '0 8px 24px rgba(255, 215, 0, 0.3)',
                    border: '3px solid #FFD700',
                    cursor: 'pointer'
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    style={{ fontSize: '64px', marginBottom: '15px' }}
                  >
                    {badge.icon}
                  </motion.div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>{badge.name}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>{badge.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {lockedBadges.length > 0 && (
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '25px' }}>🔒 Locked Badges</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {lockedBadges.map((badge, index) => (
                <motion.div
                  key={badge.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  style={{
                    background: '#f8f9fa',
                    padding: '30px',
                    borderRadius: '20px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: '2px solid #e9ecef',
                    opacity: 0.6,
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '64px', marginBottom: '15px', filter: 'grayscale(100%)' }}>
                    {badge.icon}
                  </div>
                  <div style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '24px' }}>🔒</div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>{badge.name}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{badge.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Badges
