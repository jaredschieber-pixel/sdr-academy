import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import MDEditor from '@uiw/react-md-editor'

export default function CourseBuilder({ supabase }) {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState({})
  const [view, setView] = useState('courses')
  const [selectedModule, setSelectedModule] = useState(null)
  const [courseForm, setCourseForm] = useState({ title: '', description: '', thumbnail_emoji: '📚' })
  const [moduleForm, setModuleForm] = useState({ title: '' })
  const [lessonForm, setLessonForm] = useState({ title: '', type: 'video', content_url: '', content_body: '', xp_value: 100 })
  const [quizQuestions, setQuizQuestions] = useState([])
  const [passingScore, setPassingScore] = useState(80)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCourses() }, [])

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('order_index')
    setCourses(data || [])
  }

  const fetchModules = async (courseId) => {
    const { data } = await supabase.from('modules').select('*').eq('course_id', courseId).order('order_index')
    setModules(data || [])
    for (const mod of data || []) await fetchLessons(mod.id)
  }

  const fetchLessons = async (moduleId) => {
    const { data } = await supabase.from('lessons').select('*').eq('module_id', moduleId).order('order_index')
    setLessons((prev) => ({ ...prev, [moduleId]: data || [] }))
  }

  const saveCourse = async () => {
    setSaving(true)
    await supabase.from('courses').insert({ ...courseForm, order_index: courses.length + 1 })
    setCourseForm({ title: '', description: '', thumbnail_emoji: '📚' })
    await fetchCourses()
    setSaving(false)
  }

  const saveModule = async () => {
    setSaving(true)
    await supabase.from('modules').insert({ ...moduleForm, course_id: selectedCourse.id, order_index: modules.length + 1 })
    setModuleForm({ title: '' })
    await fetchModules(selectedCourse.id)
    setSaving(false)
  }

  const saveLesson = async () => {
    setSaving(true)
    const modLessons = lessons[selectedModule.id] || []
    const { data: newLesson } = await supabase.from('lessons').insert({
      ...lessonForm,
      xp_value: parseInt(lessonForm.xp_value),
      module_id: selectedModule.id,
      order_index: modLessons.length + 1
    }).select().single()

    if (lessonForm.type === 'quiz' && quizQuestions.length > 0 && newLesson) {
      await supabase.from('quizzes').insert({
        lesson_id: newLesson.id,
        questions: quizQuestions,
        passing_score: passingScore
      })
    }

    setLessonForm({ title: '', type: 'video', content_url: '', content_body: '', xp_value: 100 })
    setQuizQuestions([])
    await fetchLessons(selectedModule.id)
    setView('modules')
    setSaving(false)
  }

  const deleteLesson = async (lessonId, moduleId) => {
    if (!confirm('Delete this lesson?')) return
    await supabase.from('lessons').delete().eq('id', lessonId)
    await fetchLessons(moduleId)
  }

  const deleteModule = async (moduleId) => {
    if (!confirm('Delete this module and all its lessons?')) return
    await supabase.from('modules').delete().eq('id', moduleId)
    await fetchModules(selectedCourse.id)
  }

  const addQuestion = () => {
    setQuizQuestions((prev) => [...prev, { question: '', options: ['', '', '', ''], correct_index: 0 }])
  }

  const updateQuestion = (qi, field, value) => {
    setQuizQuestions((prev) => prev.map((q, i) => i === qi ? { ...q, [field]: value } : q))
  }

  const updateOption = (qi, oi, value) => {
    setQuizQuestions((prev) => prev.map((q, i) => {
      if (i !== qi) return q
      const opts = [...q.options]
      opts[oi] = value
      return { ...q, options: opts }
    }))
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: '14px',
    border: '2px solid #e9ecef', borderRadius: '8px', outline: 'none',
    boxSizing: 'border-box', color: '#222', fontFamily: 'system-ui', transition: 'border 0.2s'
  }
  const btnPrimary = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white', padding: '10px 22px', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px'
  }
  const btnSecondary = {
    background: '#f8f9fa', color: '#555', padding: '10px 22px',
    border: '1.5px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px'
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: '900px' }} data-color-mode="light">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        {view !== 'courses' && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { if (view === 'lesson-form') setView('modules'); else { setView('courses'); setSelectedCourse(null) } }}
            style={btnSecondary}>
            ← Back
          </motion.button>
        )}
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#222' }}>
            {view === 'courses' && '📚 Course Builder'}
            {view === 'modules' && `📦 ${selectedCourse?.title}`}
            {view === 'lesson-form' && `✏️ Add Lesson to ${selectedModule?.title}`}
          </h2>
        </div>
      </div>

      {/* COURSES LIST */}
      {view === 'courses' && (
        <>
          <div style={{ background: 'white', padding: '24px', borderRadius: '14px', border: '2px solid #e9ecef', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#667eea', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>+ Add New Course</div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <input value={courseForm.thumbnail_emoji} onChange={(e) => setCourseForm({ ...courseForm, thumbnail_emoji: e.target.value })}
                style={{ ...inputStyle, width: '70px', textAlign: 'center', fontSize: '22px' }} placeholder="📚" />
              <input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                style={{ ...inputStyle, flex: 1 }} placeholder="Course title"
                onFocus={(e) => (e.target.style.borderColor = '#667eea')} onBlur={(e) => (e.target.style.borderColor = '#e9ecef')} />
            </div>
            <textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical', marginBottom: '12px' }} placeholder="Course description"
              onFocus={(e) => (e.target.style.borderColor = '#667eea')} onBlur={(e) => (e.target.style.borderColor = '#e9ecef')} />
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={saveCourse}
              disabled={!courseForm.title || saving} style={{ ...btnPrimary, opacity: !courseForm.title ? 0.5 : 1 }}>
              {saving ? 'Saving...' : '+ Add Course'}
            </motion.button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {courses.map((course) => (
              <motion.div key={course.id} whileHover={{ y: -2 }}
                style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', border: '2px solid #e9ecef', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: '28px' }}>{course.thumbnail_emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: '#222', fontSize: '16px' }}>{course.title}</div>
                  <div style={{ color: '#888', fontSize: '13px', marginTop: '2px' }}>{course.description}</div>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setSelectedCourse(course); fetchModules(course.id); setView('modules') }}
                  style={btnPrimary}>Manage →</motion.button>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* MODULES VIEW */}
      {view === 'modules' && selectedCourse && (
        <>
          <div style={{ background: 'white', padding: '20px 24px', borderRadius: '14px', border: '2px solid #e9ecef', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#667eea', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>+ Add Module</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input value={moduleForm.title} onChange={(e) => setModuleForm({ title: e.target.value })}
                style={{ ...inputStyle, flex: 1 }} placeholder="Module title (e.g. Getting Started)"
                onFocus={(e) => (e.target.style.borderColor = '#667eea')} onBlur={(e) => (e.target.style.borderColor = '#e9ecef')} />
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={saveModule}
                disabled={!moduleForm.title || saving} style={{ ...btnPrimary, whiteSpace: 'nowrap', opacity: !moduleForm.title ? 0.5 : 1 }}>
                {saving ? 'Saving...' : '+ Add'}
              </motion.button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {modules.map((mod) => {
              const modLessons = lessons[mod.id] || []
              return (
                <div key={mod.id} style={{ background: 'white', borderRadius: '14px', border: '2px solid #e9ecef', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', background: '#fafafa', borderBottom: '2px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '700', color: '#333', fontSize: '15px' }}>📦 {mod.title}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <motion.button whileHover={{ scale: 1.05 }}
                        onClick={() => { setSelectedModule(mod); setView('lesson-form') }}
                        style={{ ...btnPrimary, padding: '7px 14px', fontSize: '13px' }}>+ Add Lesson</motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} onClick={() => deleteModule(mod.id)}
                        style={{ background: '#fff0f0', color: '#ff4d4f', padding: '7px 14px', fontSize: '13px', border: '1.5px solid #ffccc7', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Delete</motion.button>
                    </div>
                  </div>
                  <div style={{ padding: '12px' }}>
                    {modLessons.length === 0 ? (
                      <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '16px' }}>No lessons yet</p>
                    ) : modLessons.map((lesson) => (
                      <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #f0f0f0', marginBottom: '8px', background: '#fafafa' }}>
                        <span style={{ fontSize: '18px' }}>{{ video: '🎬', document: '📄', quiz: '✏️', roleplay: '🎭', walkthrough: '🔍' }[lesson.type]}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#222' }}>{lesson.title}</div>
                          <div style={{ fontSize: '12px', color: '#aaa' }}>{lesson.type} · {lesson.xp_value} XP</div>
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => deleteLesson(lesson.id, mod.id)}
                          style={{ background: '#fff0f0', color: '#ff4d4f', padding: '5px 12px', fontSize: '12px', border: '1.5px solid #ffccc7', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Delete</motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* LESSON FORM */}
      {view === 'lesson-form' && (
        <div style={{ background: 'white', padding: '28px', borderRadius: '14px', border: '2px solid #e9ecef' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Lesson Title</label>
              <input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                style={inputStyle} placeholder="e.g. What is an ICP?"
                onFocus={(e) => (e.target.style.borderColor = '#667eea')} onBlur={(e) => (e.target.style.borderColor = '#e9ecef')} />
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Type</label>
                <select value={lessonForm.type} onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value })}
                  style={{ ...inputStyle, background: 'white' }}>
                  <option value="video">🎬 Video</option>
                  <option value="document">📄 Document</option>
                  <option value="quiz">✏️ Quiz</option>
                  <option value="roleplay">🎭 Role Play</option>
                  <option value="walkthrough">🔍 Walkthrough</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>XP Reward</label>
                <input type="number" value={lessonForm.xp_value} onChange={(e) => setLessonForm({ ...lessonForm, xp_value: e.target.value })}
                  style={inputStyle} onFocus={(e) => (e.target.style.borderColor = '#667eea')} onBlur={(e) => (e.target.style.borderColor = '#e9ecef')} />
              </div>
            </div>

            {(lessonForm.type === 'video' || lessonForm.type === 'document' || lessonForm.type === 'walkthrough') && (
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>
                  {lessonForm.type === 'video' ? 'YouTube / Loom URL' : 'Document URL (optional)'}
                </label>
                <input value={lessonForm.content_url} onChange={(e) => setLessonForm({ ...lessonForm, content_url: e.target.value })}
                  style={inputStyle} placeholder="https://..."
                  onFocus={(e) => (e.target.style.borderColor = '#667eea')} onBlur={(e) => (e.target.style.borderColor = '#e9ecef')} />
              </div>
            )}

            {/* Rich text editor for non-quiz lessons */}
            {lessonForm.type !== 'quiz' && (
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>
                  {lessonForm.type === 'roleplay' ? '🎭 Scenario / Script' : '📝 Content — paste your Notion content here'}
                </label>
                <div style={{ border: '2px solid #e9ecef', borderRadius: '8px', overflow: 'hidden' }}>
                  <MDEditor
                    value={lessonForm.content_body}
                    onChange={(val) => setLessonForm({ ...lessonForm, content_body: val || '' })}
                    height={320}
                    preview="edit"
                    hideToolbar={false}
                  />
                </div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '6px' }}>
                  Supports **bold**, *italic*, # headings, - bullet lists, and more
                </div>
              </div>
            )}

            {/* Quiz Builder */}
            {lessonForm.type === 'quiz' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#555' }}>Quiz Questions</label>
                  <label style={{ fontSize: '13px', color: '#555', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Pass %:
                    <input type="number" value={passingScore} onChange={(e) => setPassingScore(parseInt(e.target.value))}
                      style={{ ...inputStyle, width: '70px' }} />
                  </label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '16px' }}>
                  {quizQuestions.map((q, qi) => (
                    <div key={qi} style={{ background: '#fafafa', padding: '18px', borderRadius: '10px', border: '1.5px solid #e9ecef' }}>
                      <input value={q.question} onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                        style={{ ...inputStyle, marginBottom: '12px' }} placeholder={`Question ${qi + 1}`}
                        onFocus={(e) => (e.target.style.borderColor = '#667eea')} onBlur={(e) => (e.target.style.borderColor = '#e9ecef')} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {q.options.map((opt, oi) => (
                          <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="radio" name={`correct-${qi}`} checked={q.correct_index === oi}
                              onChange={() => updateQuestion(qi, 'correct_index', oi)}
                              style={{ accentColor: '#667eea', width: '16px', height: '16px' }} />
                            <input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)}
                              style={{ ...inputStyle, flex: 1 }} placeholder={`Option ${oi + 1}`}
                              onFocus={(e) => (e.target.style.borderColor = '#667eea')} onBlur={(e) => (e.target.style.borderColor = '#e9ecef')} />
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>● Select the correct answer with the radio button</div>
                    </div>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.03 }} onClick={addQuestion} style={{ ...btnSecondary, width: '100%', textAlign: 'center' }}>
                  + Add Question
                </motion.button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={saveLesson}
                disabled={!lessonForm.title || saving} style={{ ...btnPrimary, opacity: !lessonForm.title ? 0.5 : 1 }}>
                {saving ? 'Saving...' : '✓ Save Lesson'}
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} onClick={() => setView('modules')} style={btnSecondary}>
                Cancel
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}