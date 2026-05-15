import React, { useEffect, useState, useRef } from 'react';
import * as Icons from 'react-icons/fi';
import taService from '../../services/ta.service';

const QuizPlayer = ({ quizId, onComplete, isOpen = true, onClose = () => {}, displayMode = 'inline' }) => {
  const [state, setState] = useState({
    loading: false,
    submitting: false,
    quiz: null,
    questions: [],
    answers: {},
    submitted: false,
    result: null,
    error: '',
    timeRemaining: null,
    isDeadlinePassed: false
  });

  const cacheRef = useRef({});
  const isModal = displayMode === 'modal';
  const shouldRender = !isModal || isOpen;

  // Format time for display
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h ${minutes}m`;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // Fetch quiz data
  useEffect(() => {
    if (!quizId || !shouldRender) return;

    let cancelled = false;
    const fetchQuiz = async () => {
      setState(prev => ({ ...prev, loading: true, error: '' }));

      // Use cache if available
      if (cacheRef.current[quizId]) {
        const cached = cacheRef.current[quizId];
        setState(prev => ({
          ...prev,
          loading: false,
          quiz: cached.quiz,
          questions: cached.questions
        }));
        return;
      }

      try {
        const res = await taService.getQuizForStudent(quizId);
        if (cancelled) return;

        if (res.success) {
          const questions = (res.data.questions || []).map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
          }));
          cacheRef.current[quizId] = { quiz: res.data.quiz, questions };
          setState(prev => ({
            ...prev,
            loading: false,
            quiz: res.data.quiz,
            questions
          }));
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            error: res.error || 'Không thể tải quiz',
            isDeadlinePassed: false,
            timeRemaining: null
          }));
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err.response?.data?.message || err.message || 'Có lỗi xảy ra',
            isDeadlinePassed: false,
            timeRemaining: null
          }));
        }
      }
    };

    fetchQuiz();
    return () => { cancelled = true; };
  }, [quizId, shouldRender]);

  // Countdown timer
  useEffect(() => {
    if (!state.quiz?.due_at || state.submitted) {
      setState(prev => ({ ...prev, timeRemaining: null, isDeadlinePassed: false }));
      return;
    }

    const update = () => {
      const remaining = new Date(state.quiz.due_at).getTime() - Date.now();
      if (remaining <= 0) {
        setState(prev => ({ ...prev, timeRemaining: null, isDeadlinePassed: true }));
      } else {
        setState(prev => ({ ...prev, timeRemaining: remaining, isDeadlinePassed: false }));
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [state.quiz?.due_at, state.submitted]);

  const answeredCount = Object.keys(state.answers).length;
  const progress = state.questions.length ? (answeredCount / state.questions.length) * 100 : 0;

  const handleSelectAnswer = (questionId, optionId) => {
    if (state.isDeadlinePassed) return;
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: optionId }
    }));
  };

  const handleSubmit = async () => {
    if (!state.questions.length || state.submitting || state.isDeadlinePassed) return;

    setState(prev => ({ ...prev, submitting: true }));
    try {
      const answers = state.questions.map(q => ({
        question_id: q.id,
        selected_option: state.answers[q.id],
        time_spent_seconds: 0
      }));

      const res = await taService.submitQuizAttempt(quizId, { answers });
      if (res.success) {
        setState(prev => ({
          ...prev,
          submitted: true,
          result: res.data || res
        }));
        onComplete?.(res.data || res);
      } else {
        setState(prev => ({ ...prev, error: res.error || 'Không thể nộp quiz' }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (msg?.includes('quá hạn')) {
        setState(prev => ({ ...prev, isDeadlinePassed: true, error: 'Đã quá hạn nộp bài.' }));
      } else {
        setState(prev => ({ ...prev, error: msg || 'Không thể nộp quiz' }));
      }
    } finally {
      setState(prev => ({ ...prev, submitting: false }));
    }
  };

  // Shell component
  const Shell = ({ children }) => {
    if (!isModal) return <div className="animate-fade">{children}</div>;
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}>
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '900px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}>{children}</div>
      </div>
    );
  };

  // Loading state
  if (!shouldRender) return null;
  if (state.loading) {
    return (
      <Shell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <Icons.FiRefreshCw className="spin" size={32} color="var(--primary)" />
          <span style={{ marginLeft: '16px' }}>Đang tải quiz...</span>
        </div>
      </Shell>
    );
  }

  // Error state
  if (state.error || !state.quiz) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Icons.FiAlertCircle size={48} color="var(--ta-red)" />
          <p style={{ marginTop: '16px' }}>{state.error || 'Không thể tải quiz'}</p>
          {isModal && <button className="ta-btn" onClick={onClose} style={{ marginTop: '16px' }}>Đóng</button>}
        </div>
      </Shell>
    );
  }

  // No questions
  if (!state.questions.length) {
    return (
      <Shell>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-primary)' }}>
          <h3 style={{ margin: 0 }}>{state.quiz.title || 'Quiz'}</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <Icons.FiFileText size={48} style={{ opacity: 0.35, marginBottom: '12px' }} />
          <p>Quiz này chưa có câu hỏi.</p>
        </div>
      </Shell>
    );
  }

  // Results view
  if (state.submitted && state.result) {
    return (
      <Shell>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-primary)' }}>
          <h3 style={{ margin: 0 }}>Kết quả Quiz</h3>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{
            width: '112px', height: '112px', borderRadius: '50%',
            background: state.result.passed ? 'var(--ta-green-bg)' : 'var(--ta-red-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
          }}>
            {state.result.passed ? <Icons.FiCheckCircle size={60} color="var(--ta-green)" /> : <Icons.FiXCircle size={60} color="var(--ta-red)" />}
          </div>
          <h2 style={{ margin: '0 0 8px' }}>{state.result.passed ? 'Bạn đã vượt qua' : 'Bạn chưa đạt yêu cầu'}</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 24px' }}>
            {state.result.passed ? 'Bạn đã hoàn thành tốt bài quiz.' : 'Hãy ôn tập và thử lại ở bài sau.'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '520px', margin: '0 auto 24px' }}>
            <div style={{ padding: '18px', background: 'var(--bg-surface-tertiary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Điểm số</div>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{state.result.total_score ?? state.result.score}%</div>
            </div>
            <div style={{ padding: '18px', background: 'var(--bg-surface-tertiary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng câu</div>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{state.result.total_questions || state.questions.length}</div>
            </div>
            <div style={{ padding: '18px', background: 'var(--bg-surface-tertiary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Điểm đạt</div>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{state.quiz.passing_score || 60}%</div>
            </div>
          </div>
          {isModal && <button className="vibrant-btn" onClick={onClose} style={{ padding: '12px 24px' }}><Icons.FiCheck /> Đóng</button>}
        </div>
      </Shell>
    );
  }

  // Quiz player view - single page scroll
  return (
    <Shell>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h3 style={{ margin: 0, flex: 1 }}>{state.quiz.title || 'Quiz'}</h3>
        {state.quiz.due_at && (
          <span style={{
            fontSize: '11px', padding: '4px 8px', borderRadius: '4px',
            background: state.isDeadlinePassed ? 'var(--ta-red-bg)' : 'var(--ta-purple-bg)',
            color: state.isDeadlinePassed ? 'var(--ta-red)' : 'var(--ta-purple)',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <Icons.FiClock size={10} />
            {state.isDeadlinePassed ? 'Đã quá hạn' : `Nộp trước: ${new Date(state.quiz.due_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`}
          </span>
        )}
        {isModal && <button className="ta-btn" onClick={onClose}><Icons.FiX size={16} /></button>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {/* Countdown timer */}
        {state.quiz.due_at && !state.submitted && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 600, fontSize: '14px',
            position: 'sticky', top: 0, zIndex: 10,
            background: state.isDeadlinePassed ? 'var(--ta-red-bg)' : state.timeRemaining < 3600000 ? 'var(--ta-red-bg)' : 'var(--bg-surface-tertiary)',
            color: state.isDeadlinePassed ? 'var(--ta-red)' : state.timeRemaining < 3600000 ? 'var(--ta-red)' : 'var(--ta-amber)'
          }}>
            {state.isDeadlinePassed ? '⏰ Đã quá hạn nộp bài' : `⏱️ Còn lại: ${formatTime(state.timeRemaining)}`}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ height: '8px', background: 'var(--bg-surface-tertiary)', borderRadius: '4px', marginBottom: '20px' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Đã trả lời {answeredCount}/{state.questions.length} câu
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {state.questions.map((q, idx) => (
            <div key={q.id} className="ta-card-premium" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span className="ta-badge" style={{ fontSize: '11px', padding: '4px 8px' }}>Câu {idx + 1}</span>
                <span className="ta-badge" style={{ fontSize: '11px', padding: '4px 8px' }}>{q.topic}</span>
                <span className="ta-badge" style={{
                  fontSize: '11px', padding: '4px 8px',
                  backgroundColor: q.difficulty === 'easy' ? 'var(--ta-green-bg)' : q.difficulty === 'medium' ? 'var(--ta-amber-bg)' : 'var(--ta-red-bg)',
                  color: q.difficulty === 'easy' ? 'var(--ta-green)' : q.difficulty === 'medium' ? 'var(--ta-amber)' : 'var(--ta-red)'
                }}>
                  {q.difficulty === 'easy' ? 'Dễ' : q.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                </span>
              </div>

              <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 600, lineHeight: 1.5 }}>{q.question_text}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map((opt, optIdx) => {
                  const selected = state.answers[q.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectAnswer(q.id, opt.id)}
                      style={{
                        padding: '16px 20px', borderRadius: '8px',
                        border: selected ? '2px solid var(--primary)' : '2px solid var(--border-primary)',
                        background: selected ? 'var(--bg-surface-tertiary)' : 'var(--bg-surface)',
                        display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left'
                      }}
                    >
                      <span style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: selected ? 'var(--primary)' : 'var(--bg-surface-tertiary)',
                        color: selected ? 'white' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0
                      }}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span style={{ fontSize: '14px', flex: 1 }}>{opt.text}</span>
                      {selected && <Icons.FiCheckCircle size={20} color="var(--primary)" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit button */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '32px', marginBottom: '40px' }}>
          <button
            className={answeredCount > 0 && !state.isDeadlinePassed ? 'vibrant-btn' : 'ta-btn'}
            onClick={handleSubmit}
            disabled={state.submitting || state.isDeadlinePassed}
            style={{ padding: '16px 32px', fontSize: '15px' }}
          >
            {state.submitting ? <Icons.FiRefreshCw className="spin" /> : state.isDeadlinePassed ? 'Đã quá hạn' : <><Icons.FiCheckSquare /> Nộp bài</>}
          </button>
        </div>
      </div>
    </Shell>
  );
};

export default QuizPlayer;