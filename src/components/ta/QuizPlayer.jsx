import React, { useEffect, useMemo, useState, useRef } from 'react';
import * as Icons from 'react-icons/fi';
import taService from '../../services/ta.service';

const QuizPlayer = ({
  quizId,
  onComplete,
  isOpen = true,
  onClose = () => {},
  displayMode = 'inline'
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  // Countdown state - only update display every 5 seconds to avoid re-render
  const [displayTimeRemaining, setDisplayTimeRemaining] = useState(null);
  const [displayIsDeadlinePassed, setDisplayIsDeadlinePassed] = useState(false);
  const countdownRef = useRef({ timeRemaining: null, isDeadlinePassed: false });
  const cacheRef = useRef({});
  // Track answered count for progress
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id] !== undefined).length,
    [answers, questions]
  );

  const isModal = displayMode === 'modal';
  const shouldRender = !isModal || isOpen;

  useEffect(() => {
    if (!quizId || !shouldRender) return;

    let cancelled = false;
    const fetchQuiz = async () => {
      setLoading(true);
      setError('');

      // Check cache first to avoid re-render
      if (cacheRef.current[quizId] && !error) {
        const cached = cacheRef.current[quizId];
        setQuiz(cached.quiz);
        setQuestions(cached.questions);
        // Initialize countdown from cached due_at
        if (cached.quiz?.due_at) {
          const now = new Date();
          const deadline = new Date(cached.quiz.due_at);
          // Add 1 second buffer for potential clock skew between client and server
          const remaining = deadline.getTime() - now.getTime() - 1000;
          if (remaining > 0) {
            setDisplayTimeRemaining(remaining);
            setDisplayIsDeadlinePassed(false);
            countdownRef.current = { timeRemaining: remaining, isDeadlinePassed: false };
          } else {
            setDisplayTimeRemaining(null);
            setDisplayIsDeadlinePassed(true);
            countdownRef.current = { timeRemaining: null, isDeadlinePassed: true };
          }
        }
        setLoading(false);
      } else {
        // Fetch from API
        setQuiz(null);
        setQuestions([]);
        setAnswers({});
        setSubmitted(false);
        setResult(null);

        try {
          const res = await taService.getQuizForStudent(quizId);
          if (cancelled) return;

          if (res.success) {
            const quizData = res.data.quiz;
            setQuiz(quizData);
            setQuestions((res.data.questions || []).map(normalizeQuestion));
            // Cache the data
            cacheRef.current[quizId] = { quiz: quizData, questions: (res.data.questions || []).map(normalizeQuestion) };
            // Initialize countdown
            if (quizData?.due_at) {
              const now = new Date();
              const deadline = new Date(quizData.due_at);
              // Add 1 second buffer for potential clock skew between client and server
              const remaining = deadline.getTime() - now.getTime() - 1000;
              if (remaining > 0) {
                setTimeRemaining(remaining);
                setIsDeadlinePassed(false);
                countdownRef.current = { timeRemaining: remaining, isDeadlinePassed: false };
              } else {
                setTimeRemaining(null);
                setIsDeadlinePassed(true);
                countdownRef.current = { timeRemaining: null, isDeadlinePassed: true };
              }
            }
          } else {
            setError(res.error || 'Không thể tải quiz');
          }
        } catch (fetchError) {
          if (!cancelled) {
            console.error('Failed to fetch quiz:', fetchError);
            setError(fetchError.response?.data?.message || 'Có lỗi xảy ra khi tải quiz');
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    };

    fetchQuiz();

    return () => {
      cancelled = true;
    };
  }, [quizId, shouldRender]);

  const progress = questions.length ? (answeredCount / questions.length) * 100 : 0;

  // NEW: Format time remaining for display
  const formatTimeRemaining = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // NEW: Countdown timer effect - only update display every 5 seconds to avoid re-renders
  useEffect(() => {
    if (!quiz?.due_at) {
      // No deadline - reset countdown state
      countdownRef.current = { timeRemaining: null, isDeadlinePassed: false };
      setDisplayTimeRemaining(null);
      setDisplayIsDeadlinePassed(false);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const deadline = new Date(quiz.due_at);
      const remaining = deadline.getTime() - now.getTime() - 1000; // 1 second buffer for clock skew

      if (remaining <= 0) {
        // Deadline passed - block all interactions
        if (countdownRef.current.isDeadlinePassed !== true) {
          countdownRef.current = { timeRemaining: null, isDeadlinePassed: true };
          setDisplayIsDeadlinePassed(true);
          setError('Đã quá hạn nộp bài. Bạn không thể nộp quiz này nữa.');
        }
      } else {
        // Update display state - this triggers re-render but only every 5 seconds (interval)
        countdownRef.current = { timeRemaining: remaining, isDeadlinePassed: false };
        setDisplayTimeRemaining(remaining);
        setDisplayIsDeadlinePassed(false);
      }
    };

    // Initial update
    updateCountdown();
    // Update every 5 seconds
    const interval = setInterval(updateCountdown, 5000);

    return () => clearInterval(interval);
  }, [quiz?.due_at]);

  const normalizeOptions = (options) => {
    if (Array.isArray(options)) return options;
    if (typeof options === 'string') {
      try {
        const parsed = JSON.parse(options);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const normalizeQuestion = (question) => ({
    ...question,
    options: normalizeOptions(question.options)
  });

  if (!shouldRender) return null;

  const handleSelectAnswer = (questionId, optionId) => {
    // NEW: Block answer selection if deadline passed (check ref for real-time status)
    if (countdownRef.current.isDeadlinePassed) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async () => {
    if (!questions.length || submitting) return;
    // NEW: Block submit if deadline passed (check ref for real-time status)
    if (countdownRef.current.isDeadlinePassed) {
      setError('Đã quá hạn nộp bài');
      return;
    }

    setSubmitting(true);
    try {
      const answersArray = questions.map((q) => ({
        question_id: q.id,
        selected_option: answers[q.id],
        time_spent_seconds: 0
      }));

      const res = await taService.submitQuizAttempt(quizId, { answers: answersArray });
      if (res.success) {
        setResult(res.data || res);
        setSubmitted(true);
        onComplete?.(res.data || res);
      } else {
        setError(res.error || 'Không thể nộp quiz');
      }
    } catch (submitError) {
      console.error('Failed to submit quiz:', submitError);
      const errorMessage = submitError.response?.data?.message || submitError.message;

      // Handle deadline-specific error (race condition protection)
      if (errorMessage?.includes('quá hạn') || submitError.response?.status === 403) {
        setDisplayIsDeadlinePassed(true);
        countdownRef.current = { timeRemaining: null, isDeadlinePassed: true };
        setError('Đã quá hạn nộp bài.');
      } else {
        setError(errorMessage || 'Không thể nộp quiz');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const Shell = ({ children }) => {
    if (!isModal) {
      return <div className="animate-fade">{children}</div>;
    }

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px 12px 0 0',
          maxWidth: '100%',
          maxHeight: '100vh',
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {children}
        </div>
      </div>
    );
  };

  const Header = ({ title, subtitle }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isModal ? '16px 24px' : '0 0 16px',
      borderBottom: isModal ? '1px solid var(--border-primary)' : 'none',
      background: isModal ? 'var(--bg-surface)' : 'transparent'
    }}>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>{title}</h3>
        {subtitle && (
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
            {subtitle}
          </p>
        )}
        {/* NEW: Deadline badge in header */}
        {quiz?.due_at && !submitted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span className="ta-badge" style={{
              backgroundColor: countdownRef.current.isDeadlinePassed ? 'var(--ta-red-bg)' : 'var(--ta-purple-bg)',
              color: countdownRef.current.isDeadlinePassed ? 'var(--ta-red)' : 'var(--ta-purple)',
              fontSize: '10px',
              padding: '2px 6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Icons.FiClock size={10} />
              {countdownRef.current.isDeadlinePassed ? 'Đã quá hạn' : `Nộp trước: ${new Date(quiz.due_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`}
            </span>
          </div>
        )}
      </div>
      {isModal && (
        <button className="ta-btn" onClick={onClose} style={{ padding: '4px 8px' }}>
          <Icons.FiX size={16} />
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <Shell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <Icons.FiRefreshCw className="spin" size={32} color="var(--primary)" />
          <span style={{ marginLeft: '16px', fontSize: '15px' }}>Đang tải quiz...</span>
        </div>
      </Shell>
    );
  }

  if (error || !quiz) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Icons.FiAlertCircle size={48} color="var(--ta-red)" />
          <p style={{ marginTop: '16px', fontSize: '15px' }}>{error || 'Không thể tải quiz'}</p>
          {isModal && (
            <button className="ta-btn" onClick={onClose} style={{ marginTop: '16px', padding: '10px 18px' }}>
              Đóng
            </button>
          )}
        </div>
      </Shell>
    );
  }

  if (!questions.length) {
    return (
      <Shell>
        <Header title={quiz.title || 'Quiz'} subtitle="Chưa có câu hỏi" />
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <Icons.FiFileText size={48} style={{ opacity: 0.35, marginBottom: '12px' }} />
          <p>Quiz này chưa có câu hỏi.</p>
        </div>
      </Shell>
    );
  }

  if (submitted && result) {
    return (
      <Shell>
        <Header title="Kết quả Quiz" subtitle={quiz.title} />
        <div style={{ padding: '40px', textAlign: 'center', overflowY: 'auto' }}>
          <div style={{
            width: '112px',
            height: '112px',
            borderRadius: '50%',
            background: result.passed ? 'var(--ta-green-bg)' : 'var(--ta-red-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            {result.passed ? (
              <Icons.FiCheckCircle size={60} color="var(--ta-green)" />
            ) : (
              <Icons.FiXCircle size={60} color="var(--ta-red)" />
            )}
          </div>

          <h2 style={{ margin: '0 0 8px' }}>
            {result.passed ? 'Bạn đã vượt qua' : 'Bạn chưa đạt yêu cầu'}
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 24px' }}>
            {result.passed ? 'Bạn đã hoàn thành tốt bài quiz.' : 'Hãy ôn tập và thử lại ở bài sau.'}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '16px',
            maxWidth: '520px',
            margin: '0 auto 24px'
          }}>
            <div style={{ padding: '18px', background: 'var(--bg-surface-tertiary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Điểm số</div>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{result.total_score ?? result.score}%</div>
            </div>
            <div style={{ padding: '18px', background: 'var(--bg-surface-tertiary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng câu</div>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{result.total_questions || questions.length}</div>
            </div>
            <div style={{ padding: '18px', background: 'var(--bg-surface-tertiary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Điểm đạt</div>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{quiz.passing_score || 60}%</div>
            </div>
          </div>

          {isModal && (
            <button className="vibrant-btn" onClick={onClose} style={{ padding: '12px 24px' }}>
              <Icons.FiCheck /> Đóng
            </button>
          )}
        </div>
      </Shell>
    );
  }

  // Single-page scroll mode - show all questions
  return (
    <Shell>
      <Header title={quiz.title || 'Quiz'} subtitle={`${questions.length} câu hỏi`} />

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isModal ? '24px' : '0' }}>
        {/* NEW: Countdown timer display */}
        {quiz?.due_at && !submitted && (
          <div style={{
            padding: '12px 16px',
            background: displayIsDeadlinePassed ? 'var(--ta-red-bg)' :
                        displayTimeRemaining < 300000 ? 'var(--ta-red-bg)' : // < 5 minutes
                        displayTimeRemaining < 3600000 ? 'var(--ta-red-bg)' : // < 1 hour
                        displayTimeRemaining < 86400000 ? 'var(--ta-amber-bg)' : // < 1 day
                        'var(--bg-surface-tertiary)',
            color: displayIsDeadlinePassed ? 'var(--ta-red)' :
                   displayTimeRemaining < 3600000 ? 'var(--ta-red)' :
                   'var(--ta-amber)',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '14px',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            {displayIsDeadlinePassed ? (
              <>⏰ Đã quá hạn nộp bài</>
            ) : (
              <>
                ⏱️ Thời gian còn lại: {formatTimeRemaining(displayTimeRemaining)}
                {displayTimeRemaining < 300000 && (
                  <span style={{ marginLeft: '8px', fontWeight: 700 }}>⚠️ Cảnh báo: Còn ít hơn {Math.ceil(displayTimeRemaining / 60000)} phút!</span>
                )}
              </>
            )}
          </div>
        )}

        <div style={{ height: '8px', background: 'var(--bg-surface-tertiary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Đã trả lời {answeredCount}/{questions.length} câu
        </div>

        {/* Render all questions in a scrollable list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {questions.map((q, qIndex) => {
            const normalizedOptions = normalizeOptions(q.options);
            const selectedAnswer = answers[q.id];
            return (
              <div key={q.id} className="ta-card-premium" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span className="ta-badge" style={{ fontSize: '11px', padding: '4px 8px' }}>Câu {qIndex + 1}</span>
                  <span className="ta-badge" style={{ fontSize: '11px', padding: '4px 8px' }}>{q.topic}</span>
                  <span className="ta-badge" style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    backgroundColor: q.difficulty === 'easy' ? 'var(--ta-green-bg)' :
                      q.difficulty === 'medium' ? 'var(--ta-amber-bg)' : 'var(--ta-red-bg)',
                    color: q.difficulty === 'easy' ? 'var(--ta-green)' :
                      q.difficulty === 'medium' ? 'var(--ta-amber)' : 'var(--ta-red)'
                  }}>
                    {q.difficulty === 'easy' ? 'Dễ' : q.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 600, lineHeight: 1.5 }}>
                  {q.question_text}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {q.options.map((opt, optIdx) => {
                    const selected = selectedAnswer === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectAnswer(q.id, opt.id)}
                        style={{
                          padding: '16px 20px',
                          borderRadius: '8px',
                          border: selected ? '2px solid var(--primary)' : '2px solid var(--border-primary)',
                          background: selected ? 'var(--bg-surface-tertiary)' : 'var(--bg-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'left',
                          fontFamily: 'inherit'
                        }}
                      >
                        <span style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: selected ? 'var(--primary)' : 'var(--bg-surface-tertiary)',
                          color: selected ? 'white' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '13px',
                          flexShrink: 0
                        }}>
                          {String(opt.id).toUpperCase()}
                        </span>
                        <span style={{ fontSize: '14px', flex: 1 }}>{opt.text}</span>
                        {selected && <Icons.FiCheckCircle size={20} color="var(--primary)" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit button at the bottom */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '32px', marginBottom: '40px' }}>
          <button
            className={answeredCount > 0 && !countdownRef.current.isDeadlinePassed ? 'vibrant-btn' : 'ta-btn'}
            onClick={handleSubmit}
            disabled={submitting || countdownRef.current.isDeadlinePassed}
            style={{ padding: '16px 32px', fontSize: '15px' }}
          >
            {submitting ? <Icons.FiRefreshCw className="spin" /> : countdownRef.current.isDeadlinePassed ? 'Đã quá hạn' : <><Icons.FiCheckSquare /> Nộp bài</>}
          </button>
        </div>
      </div>
    </Shell>
  );
};

export default QuizPlayer;
