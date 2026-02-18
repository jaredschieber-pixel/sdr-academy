import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import ManagerDashboard from './ManagerDashboard'
import Leaderboard from './Leaderboard'
import ActivityTracker from './ActivityTracker'
import Badges from './Badges'
import Courses from './Courses'
import LessonPlayer from './LessonPlayer'
import CourseBuilder from './CourseBuilder'
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
  const [userTasks, setUserTasks] = useState([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [currentView, setCurrentView] = useState('courses')

  const [activeLesson, setActiveLesson] = useState(null)
  const [activeCourse, setActiveCourse] = useState(null)
  const [activeMod, setActiveMod] = useState(null)
  const [managerTab, setManagerTab] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) fetchUserTasks()
  }, [user])

  const fetchProfile = async (userId) => {
    let { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (!data) {
      const { data: newProfile } = await supabase
        .from('profiles').insert({ id: userId, email: user?.email || '' }).select().single()
      data = newProfile
    }
    setProfile(data)
  }

  const fetchUserTasks = async () => {
    const { data } = await supabase.from('user_tasks').select('*').eq('user_email', user.email)
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

  const handleOpenLesson = (lesson, course, mod) => {
    setActiveLesson(lesson)
    setActiveCourse(course)
    setActiveMod(mod)
  }

  const handleLessonComplete = () => {
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
    if (user) fetchProfile(user.id)
    setActiveLesson(null)
    setActiveCourse(null)
    setActiveMod(null)
  }

  const getLevelProgress = () => {
    if (!profile) return 0
    const xp = profile.total_xp || 0
    const level = profile.level || 'rookie'
    const thresholds = { rookie: 1000, prospector: 3000, closer: 7000, elite: 15000 }
    return Math.min((xp / (thresholds[level] || 1000)) * 100, 100)
  }

  const getNextLevelXP = () => {
    const level = profile?.level || 'rookie'
    return { rookie: 1000, prospector: 3000, closer: 7000, elite: 15000 }[level] || 1000
  }

  const getLevelIcon = (level) => ({ rookie: '🥉', prospector: '🥈', closer: '🥇', elite: '💎' }[level] || '🥉')
  const completedCount = userTasks.filter((ut) => ut.status === 'completed').length

  const ProgressSidebar = () => (
    <div style={{ width: '300px', flexShrink: 0 }}>
      <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '2px solid #e9ecef', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '18px', color: '#333', fontWeight: '700' }}>Your Progress</h3>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#888' }}>Level</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#667eea', textTransform: 'capitalize' }}>
                {getLevelIcon(profile?.level)} {profile?.level || 'rookie'}
              </span>
            </div>
            <div style={{ background: '#f0f0f0', height: '8px', borderRadius: '8px', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${getLevelProgress()}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', height: '100%' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#bbb', marginTop: '4px' }}>
              {profile?.total_xp || 0} / {getNextLevelXP()} XP
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[{ value: profile?.total_xp || 0, label: 'Total XP', color: '#667eea' }, { value: completedCount, label: 'Completed', color: '#764ba2' }].map((stat) => (
              <div key={stat.label} style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '22px', borderRadius: '16px', color: 'white', boxShadow: '0 8px 24px rgba(102,126,234,0.3)' }}>
          <h3 style={{ marginTop: 0, fontSize: '15px', marginBottom: '12px' }}>🏆 Level Milestones</h3>
          <div style={{ fontSize: '13px', lineHeight: '2.1', opacity: 0.95 }}>
            {[['🥉', 'Rookie', '0–999 XP'], ['🥈', 'Prospector', '1,000+'], ['🥇', 'Closer', '3,000+'], ['💎', 'Elite', '7,000+']].map(([icon, name, xp]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{icon}</span><span style={{ fontWeight: '600' }}>{name}</span><span style={{ opacity: 0.7, fontSize: '12px' }}>{xp}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontFamily: 'system-ui' }}>
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ fontSize: '24px', color: 'white' }}>
          Loading...
        </motion.div>
      </div>
    )
  }

  if (profile?.role === 'manager') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui', color: 'black' }}>
        <div style={{ background: 'white', borderBottom: '2px solid #e9ecef', padding: '0 40px', height: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'black' }}>🎯 SDR Academy</h1>
            <nav style={{ display: 'flex', gap: '4px' }}>
              {[['dashboard', '📊 Dashboard'], ['builder', '📚 Course Builder']].map(([tab, label]) => (
                <button key={tab} onClick={() => setManagerTab(tab)} style={{ background: 'none', border: 'none', padding: '6px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: managerTab === tab ? '700' : '500', color: managerTab === tab ? '#667eea' : '#555', borderBottom: managerTab === tab ? '2px solid #667eea' : '2px solid transparent', borderRadius: '4px 4px 0 0', transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <button onClick={handleSignOut} style={{ padding: '8px 16px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '13px', color: 'black' }}>
            Sign Out
          </button>
        </div>
        {managerTab === 'dashboard' && <ManagerDashboard supabase={supabase} user={user} />}
        {managerTab === 'builder' && <CourseBuilder supabase={supabase} />}
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui', width: '100%', overflow: 'hidden' }}>
        <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }}
          style={{ flex: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 40px' }}>
          <motion.h1 animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }}
            style={{ fontSize: '52px', marginBottom: '20px', color: 'white' }}>
            🎯 SDR Academy
          </motion.h1>
          <p style={{ fontSize: '20px', opacity: 0.9, textAlign: 'center', maxWidth: '400px', color: 'white' }}>
            Level up your sales skills with gamified training
          </p>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
            style={{ marginTop: '60px', fontSize: '64px', opacity: 0.3 }}>
            📞 💼 📊
          </motion.div>
        </motion.div>
        <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }}
          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8f9fa', padding: '60px 40px' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '32px', marginBottom: '10px', color: 'black' }}>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p style={{ color: '#666', marginBottom: '40px', fontSize: '16px' }}>
              {isSignUp ? 'Sign up to start your journey' : 'Sign in to continue your progress'}
            </p>
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[['Email', 'email', 'you@company.com', email, setEmail], ['Password', 'password', '••••••••', password, setPassword]].map(([label, type, ph, val, setter]) => (
                <div key={label}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'black', fontWeight: '500' }}>{label}</label>
                  <input type={type} placeholder={ph} value={val} onChange={(e) => setter(e.target.value)} required
                    style={{ width: '100%', padding: '14px', fontSize: '16px', border: '2px solid #ddd', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: 'black', transition: 'border 0.2s' }}
                    onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                    onBlur={(e) => (e.target.style.borderColor = '#ddd')} />
                </div>
              ))}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                style={{ padding: '14px', fontSize: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </motion.button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button onClick={() => setIsSignUp(!isSignUp)}
                style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '15px', textDecoration: 'underline' }}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)', fontFamily: 'system-ui', color: 'black' }}>
      <AnimatePresence>
        {showCelebration && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '40px 60px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', zIndex: 1000, textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '26px', margin: '0 0 8px', color: '#222' }}>Lesson Complete!</h2>
            <p style={{ color: '#888', fontSize: '15px', margin: 0 }}>XP added to your profile</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ background: 'white', borderBottom: '2px solid #e9ecef', padding: '0 40px', height: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'black' }}>🎯 SDR Academy</h1>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {[['courses', 'Training'], ['activity', 'Activity'], ['badges', 'Badges'], ['leaderboard', 'Leaderboard']].map(([view, label]) => (
              <button key={view} onClick={() => { setCurrentView(view); setActiveLesson(null) }}
                style={{ background: 'none', border: 'none', padding: '6px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: currentView === view ? '700' : '500', color: currentView === view ? '#667eea' : '#555', borderBottom: currentView === view ? '2px solid #667eea' : '2px solid transparent', borderRadius: '4px 4px 0 0', transition: 'all 0.15s' }}>
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'black', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'capitalize' }}>
              {getLevelIcon(profile?.level)} {profile?.level || 'rookie'} · {profile?.total_xp || 0} XP
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSignOut}
            style={{ padding: '8px 16px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '13px', color: 'black' }}>
            Sign Out
          </motion.button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', padding: '36px 40px', maxWidth: '1400px', margin: '0 auto', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {currentView === 'courses' && !activeLesson && (
            <Courses supabase={supabase} user={user} profile={profile} onOpenLesson={handleOpenLesson} />
          )}
          {currentView === 'courses' && activeLesson && (
            <LessonPlayer supabase={supabase} user={user} lesson={activeLesson} course={activeCourse} mod={activeMod}
              onComplete={handleLessonComplete}
              onBack={() => { setActiveLesson(null); setActiveCourse(null); setActiveMod(null) }} />
          )}
          {currentView === 'activity' && <ActivityTracker supabase={supabase} user={user} />}
          {currentView === 'badges' && <Badges supabase={supabase} user={user} userTasks={userTasks} profile={profile} />}
          {currentView === 'leaderboard' && <Leaderboard supabase={supabase} currentUserId={user.id} />}
        </div>
        <ProgressSidebar />
      </div>
    </div>
  )
}

export default App