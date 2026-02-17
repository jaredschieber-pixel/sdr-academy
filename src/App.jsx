import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import ManagerDashboard from './ManagerDashboard'
import Leaderboard from './Leaderboard'
import ActivityTracker from './ActivityTracker'
import Badges from './Badges'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [tasks, setTasks] = useState([])
  const [userTasks, setUserTasks] = useState([])
  const [showSubmit, setShowSubmit] = useState(null)
  const [submission, setSubmission] = useState('')
  const [showCelebration, setShowCelebration] = useState(false)
  const [currentView, setCurrentView] = useState('tasks')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchTasks()
      fetchUserTasks()
    }
  }, [user])

  const fetchProfile = async (userId) => {
    let { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (!data) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ id: userId, email: user?.email || '' })
        .select()
        .single()
      data = newProfile
    }
    setProfile(data)
  }

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*')
    setTasks(data || [])
  }

  const fetchUserTasks = async () => {
    const { data } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_email', user.email)
    setUserTasks(data || [])
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Account created! You can now sign in.')
        setIsSignUp(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const handleSubmit = async (taskId) => {
    if (!submission) {
      alert('Please enter your submission!')
      return
    }
    await supabase.from('user_tasks').insert({
      user_id: user.id,
      user_email: user.email,
      task_id: taskId,
      status: 'submitted',
      submission_text: submission
    })

    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)

    setSubmission('')
    setShowSubmit(null)
    fetchUserTasks()
  }

  const getTaskStatus = (taskId) => {
    const userTask = userTasks.find((ut) => ut.task_id === taskId)
    return userTask?.status || 'available'
  }

  const getLevelProgress = () => {
    if (!profile) return 0
    const xp = profile.total_xp || 0
    const level = profile.level || 'rookie'
    const thresholds = { rookie: 1000, prospector: 3000, closer: 7000, elite: 15000 }
    const nextThreshold = thresholds[level] || 1000
    return Math.min((xp / nextThreshold) * 100, 100)
  }

  const getNextLevelXP = () => {
    if (!profile) return 1000
    const level = profile.level || 'rookie'
    const thresholds = { rookie: 1000, prospector: 3000, closer: 7000, elite: 15000 }
    return thresholds[level] || 1000
  }

  const getLevelIcon = (level) => {
    const icons = { rookie: '🥉', prospector: '🥈', closer: '🥇', elite: '💎' }
    return icons[level] || '🥉'
  }

  const completedCount = userTasks.filter((ut) => ut.status === 'completed').length

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'system-ui',
          fontSize: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'black'
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Loading...
        </motion.div>
      </div>
    )
  }

  const isManager = profile?.role === 'manager'

  if (isManager) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f8f9fa',
          fontFamily: 'system-ui',
          color: 'black'
        }}
      >
        <div
          style={{
            background: 'white',
            borderBottom: '2px solid #e9ecef',
            padding: '20px 60px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <h1 style={{ margin: 0, fontSize: '24px', color: 'black' }}>
            🎯 SDR Academy - Manager View
          </h1>
          <button
            onClick={handleSignOut}
            style={{
              padding: '10px 20px',
              background: '#f8f9fa',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s',
              color: 'black'
            }}
            onMouseOver={(e) => (e.target.style.background = '#e9ecef')}
            onMouseOut={(e) => (e.target.style.background = '#f8f9fa')}
          >
            Sign Out
          </button>
        </div>
        <ManagerDashboard supabase={supabase} user={user} />
      </div>
    )
  }

  if (!user) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          fontFamily: 'system-ui',
          width: '100%',
          overflow: 'hidden',
          color: 'black'
        }}
      >
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            flex: 1,
            minWidth: '0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            color: 'black'
          }}
        >
          <motion.h1
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            style={{ fontSize: '48px', marginBottom: '20px', color: 'black' }}
          >
            🎯 SDR Academy
          </motion.h1>
          <p
            style={{
              fontSize: '20px',
              opacity: 0.9,
              textAlign: 'center',
              maxWidth: '400px',
              color: 'black'
            }}
          >
            Level up your sales skills with gamified onboarding
          </p>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ marginTop: '60px', fontSize: '64px', opacity: 0.3 }}
          >
            📞 💼 📊
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            flex: 1,
            minWidth: '0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f8f9fa',
            padding: '40px',
            color: 'black'
          }}
        >
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '32px', marginBottom: '10px', color: 'black' }}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p
              style={{
                color: 'black',
                marginBottom: '40px',
                fontSize: '16px'
              }}
            >
              {isSignUp
                ? 'Sign up to start your journey'
                : 'Sign in to continue your progress'}
            </p>
            <form
              onSubmit={handleAuth}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: 'black',
                    fontWeight: '500'
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border 0.2s',
                    color: 'black'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                  onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: 'black',
                    fontWeight: '500'
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border 0.2s',
                    color: 'black'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                  onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px',
                  fontSize: '16px',
                  background: '#667eea',
                  color: 'black',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginTop: '10px'
                }}
              >
                {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </motion.button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'black',
                  cursor: 'pointer',
                  fontSize: '15px',
                  textDecoration: 'underline'
                }}
              >
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)',
        fontFamily: 'system-ui',
        width: '100%',
        color: 'black'
      }}
    >
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              padding: '40px 60px',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              zIndex: 1000,
              textAlign: 'center',
              color: 'black'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ fontSize: '28px', marginBottom: '10px', color: 'black' }}>
              Submitted!
            </h2>
            <p style={{ fontSize: '16px', color: 'black' }}>Pending manager review</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          background: 'white',
          borderBottom: '2px solid #e9ecef',
          padding: '15px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          minHeight: '60px',
          flexWrap: 'wrap',
          gap: '15px',
          color: 'black'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            flex: '1 1 auto',
            minWidth: '0'
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '18px',
              whiteSpace: 'nowrap',
              color: 'black'
            }}
          >
            🎯 SDR Academy
          </h1>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <a
              onClick={() => setCurrentView('tasks')}
              style={{
                color: 'black',
                textDecoration: 'none',
                fontWeight: '500',
                position: 'relative',
                cursor: 'pointer',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              Tasks
              {currentView === 'tasks' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#667eea'
                  }}
                />
              )}
            </a>
            <a
              onClick={() => setCurrentView('activity')}
              style={{
                color: 'black',
                textDecoration: 'none',
                fontWeight: '500',
                position: 'relative',
                cursor: 'pointer',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              Activity
              {currentView === 'activity' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#667eea'
                  }}
                />
              )}
            </a>
            <a
              onClick={() => setCurrentView('badges')}
              style={{
                color: 'black',
                textDecoration: 'none',
                fontWeight: '500',
                position: 'relative',
                cursor: 'pointer',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              Badges
              {currentView === 'badges' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#667eea'
                  }}
                />
              )}
            </a>
            <a
              onClick={() => setCurrentView('leaderboard')}
              style={{
                color: 'black',
                textDecoration: 'none',
                fontWeight: '500',
                position: 'relative',
                cursor: 'pointer',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              Leaderboard
              {currentView === 'leaderboard' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#667eea'
                  }}
                />
              )}
            </a>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '12px',
                color: 'black',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '180px'
              }}
            >
              {user.email}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'black',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap'
              }}
            >
              {getLevelIcon(profile?.level)} {profile?.level || 'rookie'} •{' '}
              {profile?.total_xp || 0} XP
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            style={{
              padding: '8px 14px',
              background: '#f8f9fa',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              color: 'black'
            }}
          >
            Sign Out
          </motion.button>
        </div>
      </div>

      {currentView === 'tasks' && (
        <div
          style={{
            display: 'flex',
            gap: '40px',
            padding: '40px 30px',
            maxWidth: '1600px',
            margin: '0 auto',
            flexWrap: 'wrap',
            color: 'black'
          }}
        >
          <div style={{ flex: '2 1 600px', minWidth: 0 }}>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{ marginBottom: '30px' }}
            >
              <h2
                style={{
                  fontSize: '28px',
                  marginBottom: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Your Tasks
              </h2>
              <p style={{ color: '#666', fontSize: '16px' }}>
                Complete tasks to earn XP and level up
              </p>
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {tasks.map((task, index) => {
                const status = getTaskStatus(task.id)
                const isCompleted = status === 'completed'
                const isPending = status === 'submitted'
                const needsRevision = status === 'needs_revision'

                return (
                  <motion.div
                    key={task.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                    style={{
                      background: 'white',
                      padding: '30px',
                      borderRadius: '16px',
                      border: `2px solid ${
                        isCompleted
                          ? '#52c41a'
                          : needsRevision
                          ? '#fa8c16'
                          : isPending
                          ? '#0066ff'
                          : '#e9ecef'
                      }`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      opacity: isCompleted ? 0.7 : 1,
                      transition: 'all 0.3s'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '15px',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flex: '1 1 auto'
                        }}
                      >
                        {isCompleted && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{ fontSize: '28px' }}
                          >
                            ✅
                          </motion.span>
                        )}
                        {isPending && (
                          <motion.span
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{ fontSize: '28px' }}
                          >
                            ⏳
                          </motion.span>
                        )}
                        {needsRevision && (
                          <motion.span
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            style={{ fontSize: '28px' }}
                          >
                            📝
                          </motion.span>
                        )}
                        <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
                          {task.title}
                        </h3>
                      </div>
                      <motion.span
                        whileHover={{ scale: 1.1 }}
                        style={{
                          background: isCompleted
                            ? '#f6ffed'
                            : isPending
                            ? '#e7f3ff'
                            : needsRevision
                            ? '#fff7e6'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: isCompleted
                            ? '#52c41a'
                            : isPending
                            ? '#0066ff'
                            : needsRevision
                            ? '#fa8c16'
                            : 'white',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isCompleted ? '✓ ' : '+'}
                        {task.xp_value} XP
                      </motion.span>
                    </div>
                    <p
                      style={{
                        color: '#666',
                        fontSize: '15px',
                        lineHeight: '1.8',
                        marginBottom: '20px'
                      }}
                    >
                      {task.description}
                    </p>
                    {isPending && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          background: 'linear-gradient(90deg, #e7f3ff 0%, #fff 100%)',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          marginBottom: '15px',
                          color: '#0066ff',
                          fontSize: '14px',
                          fontWeight: '500',
                          borderLeft: '4px solid #0066ff'
                        }}
                      >
                        ⏳ Pending manager review
                      </motion.div>
                    )}
                    {needsRevision && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          background: 'linear-gradient(90deg, #fff7e6 0%, #fff 100%)',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          marginBottom: '15px',
                          color: '#fa8c16',
                          fontSize: '14px',
                          fontWeight: '500',
                          borderLeft: '4px solid #fa8c16'
                        }}
                      >
                        📝 Needs revision - please resubmit
                      </motion.div>
                    )}
                    {!isCompleted && !isPending && (
                      showSubmit === task.id ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                        >
                          <textarea
                            placeholder="Paste your work here..."
                            value={submission}
                            onChange={(e) => setSubmission(e.target.value)}
                            style={{
                              width: '100%',
                              minHeight: '120px',
                              padding: '15px',
                              fontSize: '15px',
                              border: '2px solid #ddd',
                              borderRadius: '12px',
                              marginBottom: '15px',
                              fontFamily: 'system-ui',
                              boxSizing: 'border-box',
                              resize: 'vertical',
                              transition: 'border 0.2s'
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                            onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                          />
                          <div
                            style={{
                              display: 'flex',
                              gap: '10px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSubmit(task.id)}
                              style={{
                                background:
                                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                padding: '12px 24px',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '15px'
                              }}
                            >
                              Submit Task
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setShowSubmit(null)}
                              style={{
                                background: '#f8f9fa',
                                color: '#666',
                                padding: '12px 24px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '15px'
                              }}
                            >
                              Cancel
                            </motion.button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.button
                          whileHover={{
                            scale: 1.05,
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                          }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowSubmit(task.id)}
                          style={{
                            background:
                              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '15px'
                          }}
                        >
                          {needsRevision ? 'Resubmit Task' : 'Submit Task'}
                        </motion.button>
                      )
                    )}
                    {isCompleted && (
                      <div
                        style={{
                          color: '#52c41a',
                          fontWeight: '500',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        ✓ Completed
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>

          <div style={{ flex: '1 1 300px', minWidth: '280px' }}>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4 }}
              style={{
                background: 'white',
                padding: '30px',
                borderRadius: '16px',
                border: '2px solid #e9ecef',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.3s'
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: '18px', marginBottom: '20px' }}>
                Your Progress
              </h3>
              <div style={{ marginBottom: '25px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#666' }}>Level Progress</span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#667eea',
                      textTransform: 'capitalize'
                    }}
                  >
                    {getLevelIcon(profile?.level)} {profile?.level || 'rookie'}
                  </span>
                </div>
                <div
                  style={{
                    background: '#f0f0f0',
                    height: '10px',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getLevelProgress()}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      height: '100%'
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    marginTop: '5px'
                  }}
                >
                  {profile?.total_xp || 0} / {getNextLevelXP()} XP
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '15px'
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 'bold',
                      color: '#667eea'
                    }}
                  >
                    {completedCount}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#666',
                      marginTop: '5px'
                    }}
                  >
                    Tasks Done
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 'bold',
                      color: '#764ba2'
                    }}
                  >
                    {profile?.total_xp || 0}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#666',
                      marginTop: '5px'
                    }}
                  >
                    Total XP
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -4 }}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '30px',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s'
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: '18px', marginBottom: '15px' }}>
                🏆 Level Milestones
              </h3>
              <div style={{ fontSize: '14px', lineHeight: '2.2', opacity: 0.95 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🥉</span> Rookie: 0 - 999 XP
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🥈</span> Prospector: 1,000+ XP
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🥇</span> Closer: 3,000+ XP
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💎</span> Elite: 7,000+ XP
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {currentView === 'activity' && (
        <ActivityTracker supabase={supabase} user={user} />
      )}
      {currentView === 'badges' && (
        <Badges
          supabase={supabase}
          user={user}
          userTasks={userTasks}
          profile={profile}
        />
      )}
      {currentView === 'leaderboard' && (
        <Leaderboard supabase={supabase} currentUserId={user.id} />
      )}
    </div>
  )
}

export default App
