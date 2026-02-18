import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function LessonPlayer({ supabase, user, lesson, course, mod, onComplete, onBack }) {
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)
  const [passed, setPassed] = useState(false)
  const [roleplayText, setRoleplayText] = useState('')
  const [roleplaySubmitted, setRoleplaySubmitted] = useState(false)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)

  useEffect(() => {
    checkCompletion()
    if (lesson.type === 'quiz') fetchQuiz()
  }, [lesson.id])

  const checkCompletion = async () => {
    const { data } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .single()
    if (data?.status === 'completed') setAlreadyCompleted(true)
  }

  const fetchQuiz = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lesson.id)
      .single()
    setQuiz(data || null)
  }

  const markComplete = async () => {
    await supabase.from('lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lesson.id,
      status: 'completed',
      completed_at: new Date().toISOString()
    }, { onConflict: 'user_id,lesson_id' })

    // Award XP
    await supabase.rpc('add_xp', { user_id: user.id, xp_amount: lesson.xp_value })
    onComplete()
  }

  const handleQuizSubmit = async () => {
    if (!quiz) return
    const questions = quiz.questions
    let correct = 0
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_index) correct++
    })
    const pct = Math.round((correct / questions.length) * 100)
    const didPass = pct >= quiz.passing_score

    await supabase.from('quiz_attempts').insert({
      user_id: user.id,
      quiz_id: quiz.id,
      answers,
      score: pct,
      passed: didPass
    })

    setScore(pct)
    setPassed(didPass)
    setSubmitted(true)

    if (didPass) await markComplete()
  }

  const handleRoleplaySubmit = async () => {
    if (!roleplayText.trim()) return
    setRoleplaySubmitted(true)
    await markComplete()
  }

  const getYouTubeEmbed = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (match) return `https://www.youtube.com/embed/${match[1]}`
    const loom = url.match(/loom\.com\/share\/([^?\s]+)/)
    if (loom) return `https://www.loom.com/embed/${loom[1]}`
    return url
  }

  return (
    <div style={{ maxWidth: '860px' }}>
      {/* Back button + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          style={{
            background: 'white', border: '1.5px solid #e9ecef',
            padding: '8px 16px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#555'
          }}
        >
          ← Back
        </motion.button>
        <span style={{ fontSize: '13px', color: '#aaa' }}>
          {course.title} → {mod.title}
        </span>
      </div>

      {/* Lesson Header */}
      <div style={{
        background: 'white', padding: '28px', borderRadius: '14px',
        border: '2px solid #e9ecef', marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '28px' }}>
            {{ video: '🎬', document: '📄', quiz: '✏️', roleplay: '🎭', walkthrough: '🔍' }[lesson.type] || '📝'}
          </span>
          <div>
            <div style={{ fontSize: '12px', color: '#667eea', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {lesson.type} · {lesson.xp_value} XP
            </div>
            <h2 style={{ margin: '4px 0 0', fontSize: '22px', color: '#222' }}>{lesson.title}</h2>
          </div>
        </div>
        {alreadyCompleted && (
          <div style={{
            background: '#f6ffed', color: '#52c41a', padding: '8px 14px',
            borderRadius: '8px', fontSize: '13px', fontWeight: '600',
            borderLeft: '4px solid #52c41a', marginTop: '16px'
          }}>
            ✅ You already completed this lesson
          </div>
        )}
      </div>

      {/* ── VIDEO ── */}
      {lesson.type === 'video' && (
        <div style={{ background: 'white', borderRadius: '14px', border: '2px solid #e9ecef', overflow: 'hidden', marginBottom: '20px' }}>
          {lesson.content_url ? (
            <iframe
              src={getYouTubeEmbed(lesson.content_url)}
              style={{ width: '100%', height: '480px', border: 'none', display: 'block' }}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: '#aaa' }}>No video URL set yet</div>
          )}
          {lesson.content_body && (
            <div style={{ padding: '24px', borderTop: '2px solid #f0f0f0', fontSize: '15px', color: '#444', lineHeight: '1.8' }}>
              {lesson.content_body}
            </div>
          )}
          {!alreadyCompleted && (
            <div style={{ padding: '20px 24px', borderTop: '2px solid #f0f0f0' }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={markComplete}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white', padding: '12px 28px', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px'
                }}
              >
                ✓ Mark as Complete — Earn {lesson.xp_value} XP
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* ── DOCUMENT / WALKTHROUGH ── */}
      {(lesson.type === 'document' || lesson.type === 'walkthrough') && (
        <div style={{ background: 'white', borderRadius: '14px', border: '2px solid #e9ecef', marginBottom: '20px' }}>
          {lesson.content_url && (
            <div style={{ padding: '20px 24px', borderBottom: '2px solid #f0f0f0' }}>
              <a
                href={lesson.content_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white', padding: '10px 20px', borderRadius: '8px',
                  textDecoration: 'none', fontWeight: '600', fontSize: '14px'
                }}
              >
                📎 Open Document
              </a>
            </div>
          )}
          {lesson.content_body && (
            <div style={{ padding: '28px', fontSize: '15px', color: '#444', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}>
              {lesson.content_body}
            </div>
          )}
          {!alreadyCompleted && (
            <div style={{ padding: '20px 24px', borderTop: '2px solid #f0f0f0' }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={markComplete}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white', padding: '12px 28px', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px'
                }}
              >
                ✓ Mark as Complete — Earn {lesson.xp_value} XP
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* ── QUIZ ── */}
      {lesson.type === 'quiz' && quiz && (
        <div style={{ background: 'white', borderRadius: '14px', border: '2px solid #e9ecef', marginBottom: '20px' }}>
          <div style={{ padding: '24px 28px', borderBottom: '2px solid #f0f0f0' }}>
            <div style={{ fontSize: '13px', color: '#888' }}>
              {quiz.questions.length} questions · Pass with {quiz.passing_score}%
            </div>
          </div>

          {!submitted ? (
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {quiz.questions.map((q, qi) => (
                  <div key={qi}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#222', marginBottom: '14px' }}>
                      {qi + 1}. {q.question}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: `2px solid ${answers[qi] === oi ? '#667eea' : '#e9ecef'}`,
                            background: answers[qi] === oi ? '#f0f0ff' : 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#333',
                            transition: 'all 0.15s'
                          }}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleQuizSubmit}
                disabled={Object.keys(answers).length < quiz.questions.length}
                style={{
                  marginTop: '28px',
                  background: Object.keys(answers).length < quiz.questions.length
                    ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white', padding: '12px 28px', border: 'none',
                  borderRadius: '8px', cursor: Object.keys(answers).length < quiz.questions.length ? 'not-allowed' : 'pointer',
                  fontWeight: '600', fontSize: '15px'
                }}
              >
                Submit Quiz
              </motion.button>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>
                {passed ? '🎉' : '😅'}
              </div>
              <h3 style={{ fontSize: '24px', margin: '0 0 8px', color: passed ? '#52c41a' : '#fa541c' }}>
                {passed ? 'You Passed!' : 'Not Quite'}
              </h3>
              <p style={{ color: '#888', fontSize: '16px', margin: '0 0 20px' }}>
                You scored {score}% · {passed ? `You earned ${lesson.xp_value} XP!` : `You need ${quiz.passing_score}% to pass`}
              </p>
              {!passed && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  onClick={() => { setSubmitted(false); setAnswers({}) }}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white', padding: '12px 28px', border: 'none',
                    borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px'
                  }}
                >
                  Try Again
                </motion.button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ROLEPLAY ── */}
      {lesson.type === 'roleplay' && (
        <div style={{ background: 'white', borderRadius: '14px', border: '2px solid #e9ecef', marginBottom: '20px' }}>
          {lesson.content_body && (
            <div style={{
              padding: '28px', borderBottom: '2px solid #f0f0f0',
              background: 'linear-gradient(135deg, #f8f0ff 0%, #f0f4ff 100%)',
              borderRadius: '12px 12px 0 0'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#764ba2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                🎭 Scenario / Script
              </div>
              <div style={{ fontSize: '15px', color: '#444', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}>
                {lesson.content_body}
              </div>
            </div>
          )}
          {!roleplaySubmitted && !alreadyCompleted ? (
            <div style={{ padding: '28px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '10px' }}>
                Your Response
              </label>
              <textarea
                value={roleplayText}
                onChange={(e) => setRoleplayText(e.target.value)}
                placeholder="Write your response to the scenario above..."
                style={{
                  width: '100%', minHeight: '160px', padding: '14px',
                  fontSize: '14px', border: '2px solid #ddd', borderRadius: '10px',
                  fontFamily: 'system-ui', boxSizing: 'border-box', resize: 'vertical',
                  transition: 'border 0.2s', outline: 'none'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                onBlur={(e) => (e.target.style.borderColor = '#ddd')}
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRoleplaySubmit}
                style={{
                  marginTop: '14px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white', padding: '12px 28px', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px'
                }}
              >
                Submit Response — Earn {lesson.xp_value} XP
              </motion.button>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
              <h3 style={{ fontSize: '22px', color: '#52c41a', margin: '0 0 8px' }}>Submitted!</h3>
              <p style={{ color: '#888', fontSize: '14px' }}>You earned {lesson.xp_value} XP</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}