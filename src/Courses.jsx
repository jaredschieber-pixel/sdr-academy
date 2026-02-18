import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Courses({ supabase, user, profile, onOpenLesson }) {
  const [courses, setCourses] = useState([])
  const [progress, setProgress] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [modules, setModules] = useState({})
  const [lessons, setLessons] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
    fetchProgress()
  }, [])

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('order_index')
    setCourses(data || [])
    setLoading(false)
  }

  const fetchProgress = async () => {
    const { data } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)
    setProgress(data || [])
  }

  const fetchModulesForCourse = async (courseId) => {
    if (modules[courseId]) return
    const { data: modData } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index')

    setModules((prev) => ({ ...prev, [courseId]: modData || [] }))

    for (const mod of modData || []) {
      const { data: lesData } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', mod.id)
        .order('order_index')
      setLessons((prev) => ({ ...prev, [mod.id]: lesData || [] }))
    }
  }

  const handleExpand = (courseId) => {
    if (expanded === courseId) {
      setExpanded(null)
    } else {
      setExpanded(courseId)
      fetchModulesForCourse(courseId)
    }
  }

  const isLessonCompleted = (lessonId) =>
    progress.some((p) => p.lesson_id === lessonId && p.status === 'completed')

  const isLessonLocked = (courseId, modId, lessonIndex) => {
    if (lessonIndex === 0) {
      const courseMods = modules[courseId] || []
      const modIndex = courseMods.findIndex((m) => m.id === modId)
      if (modIndex === 0) return false
      const prevMod = courseMods[modIndex - 1]
      const prevLessons = lessons[prevMod?.id] || []
      return !prevLessons.every((l) => isLessonCompleted(l.id))
    }
    const modLessons = lessons[modId] || []
    const prevLesson = modLessons[lessonIndex - 1]
    return !isLessonCompleted(prevLesson?.id)
  }

  const getCourseProgress = (courseId) => {
    const courseMods = modules[courseId] || []
    const allLessons = courseMods.flatMap((m) => lessons[m.id] || [])
    if (allLessons.length === 0) return 0
    const completed = allLessons.filter((l) => isLessonCompleted(l.id)).length
    return Math.round((completed / allLessons.length) * 100)
  }

  const getLessonIcon = (type) => {
    const icons = { video: '🎬', document: '📄', quiz: '✏️', roleplay: '🎭', walkthrough: '🔍' }
    return icons[type] || '📝'
  }

  const getLessonTypeLabel = (type) => {
    const labels = { video: 'Video', document: 'Document', quiz: 'Quiz', roleplay: 'Role Play', walkthrough: 'Walkthrough' }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>
        Loading courses...
      </div>
    )
  }

  return (
    <div>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginBottom: '28px' }}>
        <h2 style={{
          fontSize: '28px', marginBottom: '6px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Your Training
        </h2>
        <p style={{ color: '#888', fontSize: '15px', margin: 0 }}>
          Complete each lesson in order to unlock the next
        </p>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {courses.map((course, index) => {
          const isOpen = expanded === course.id
          const pct = getCourseProgress(course.id)
          const courseMods = modules[course.id] || []
          const allLessons = courseMods.flatMap((m) => lessons[m.id] || [])
          const completedCount = allLessons.filter((l) => isLessonCompleted(l.id)).length
          const isFullyComplete = allLessons.length > 0 && completedCount === allLessons.length

          return (
            <motion.div
              key={course.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.07 }}
              style={{
                background: 'white',
                borderRadius: '14px',
                border: `2px solid ${isFullyComplete ? '#52c41a' : isOpen ? '#667eea' : '#e9ecef'}`,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              {/* Course Header */}
              <div
                onClick={() => handleExpand(course.id)}
                style={{
                  padding: '24px 28px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  userSelect: 'none'
                }}
              >
                <div style={{
                  fontSize: '36px',
                  width: '56px', height: '56px',
                  background: 'linear-gradient(135deg, #f0f0ff 0%, #e8e0ff 100%)',
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {course.thumbnail_emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#222', fontWeight: '700' }}>
                      {course.title}
                    </h3>
                    {isFullyComplete && (
                      <span style={{ background: '#f6ffed', color: '#52c41a', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        ✓ Complete
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#888' }}>
                    {course.description}
                  </p>
                  {/* Progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, background: '#f0f0f0', height: '6px', borderRadius: '6px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: isFullyComplete
                            ? '#52c41a'
                            : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', color: '#aaa', whiteSpace: 'nowrap' }}>
                      {completedCount}/{allLessons.length} lessons
                    </span>
                  </div>
                </div>
                <div style={{
                  fontSize: '20px',
                  color: '#aaa',
                  transition: 'transform 0.2s',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0
                }}>
                  ▼
                </div>
              </div>

              {/* Expanded Modules + Lessons */}
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderTop: '2px solid #f0f0f0', padding: '20px 28px', background: '#fafafa' }}
                >
                  {courseMods.length === 0 ? (
                    <p style={{ color: '#aaa', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                      No modules yet — check back soon!
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {courseMods.map((mod) => {
                        const modLessons = lessons[mod.id] || []
                        return (
                          <div key={mod.id}>
                            <div style={{
                              fontSize: '12px', fontWeight: '700', color: '#667eea',
                              textTransform: 'uppercase', letterSpacing: '0.08em',
                              marginBottom: '10px'
                            }}>
                              {mod.title}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {modLessons.map((lesson, lIdx) => {
                                const completed = isLessonCompleted(lesson.id)
                                const locked = isLessonLocked(course.id, mod.id, lIdx)
                                return (
                                  <motion.div
                                    key={lesson.id}
                                    whileHover={!locked ? { x: 4 } : {}}
                                    onClick={() => !locked && onOpenLesson(lesson, course, mod)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '14px',
                                      padding: '14px 18px',
                                      background: locked ? '#f5f5f5' : 'white',
                                      borderRadius: '10px',
                                      border: `1.5px solid ${completed ? '#52c41a' : locked ? '#e9ecef' : '#e0e0ff'}`,
                                      cursor: locked ? 'not-allowed' : 'pointer',
                                      opacity: locked ? 0.5 : 1,
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    <span style={{ fontSize: '20px', flexShrink: 0 }}>
                                      {completed ? '✅' : locked ? '🔒' : getLessonIcon(lesson.type)}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '14px', fontWeight: '600', color: locked ? '#aaa' : '#222' }}>
                                        {lesson.title}
                                      </div>
                                      <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                                        {getLessonTypeLabel(lesson.type)} · {lesson.xp_value} XP
                                      </div>
                                    </div>
                                    {!locked && !completed && (
                                      <span style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white', padding: '4px 12px',
                                        borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                        flexShrink: 0
                                      }}>
                                        Start →
                                      </span>
                                    )}
                                    {completed && (
                                      <span style={{ color: '#52c41a', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
                                        Done
                                      </span>
                                    )}
                                  </motion.div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}