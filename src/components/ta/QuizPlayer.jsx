import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Icons from "react-icons/fi";
import taService from "../../services/ta.service";
import "./QuizPlayer.css";

const difficultyLabel = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

const optionLetters = ["A", "B", "C", "D", "E", "F"];

const normalizeOptions = (options) => {
  if (Array.isArray(options)) return options;
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const formatDeadline = (value) => {
  if (!value) return "Không giới hạn";
  return new Date(value).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatRemaining = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const getResultScore = (result) => result?.total_score ?? result?.score ?? 0;

const QuizPlayer = ({
  quizId,
  onComplete,
  isOpen = true,
  onClose = () => {},
  displayMode = "inline",
}) => {
  const [state, setState] = useState({
    loading: true,
    submitting: false,
    started: false,
    quiz: null,
    questions: [],
    answers: {},
    submitted: false,
    result: null,
    error: "",
    canAttempt: true,
    alreadyAttempted: false,
    timeRemaining: null,
    isDeadlinePassed: false,
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const startedAtRef = useRef(null);
  const cacheRef = useRef({});

  const isModal = displayMode === "modal";
  const shouldRender = !isModal || isOpen;
  const totalQuestions = state.questions.length;
  const answeredCount = Object.keys(state.answers).length;
  const unansweredCount = Math.max(totalQuestions - answeredCount, 0);
  const currentQuestion = state.questions[currentIndex];
  const progress = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const canSubmit =
    state.canAttempt &&
    !state.isDeadlinePassed &&
    answeredCount === totalQuestions &&
    totalQuestions > 0 &&
    !state.submitting;

  const topics = useMemo(() => {
    const unique = new Set(state.questions.map((q) => q.topic).filter(Boolean));
    return Array.from(unique);
  }, [state.questions]);

  useEffect(() => {
    if (!quizId || !shouldRender) {
      if (!quizId) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Thiếu mã quiz.",
        }));
      }
      return;
    }

    let cancelled = false;

    const fetchQuiz = async () => {
      setState((prev) => ({ ...prev, loading: true, error: "" }));

      if (cacheRef.current[quizId]) {
        const cached = cacheRef.current[quizId];
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false, ...cached }));
          setCurrentIndex(0);
        }
        return;
      }

      try {
        const res = await taService.getQuizForStudent(quizId);
        if (cancelled) return;

        if (!res.success) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: res.error || "Không thể tải quiz.",
          }));
          return;
        }

        const nextState = {
          quiz: res.data.quiz,
          questions: (res.data.questions || []).map((question) => ({
            ...question,
            options: normalizeOptions(question.options),
          })),
          canAttempt: res.data.can_attempt !== false,
          alreadyAttempted: Boolean(res.data.already_attempted),
        };

        cacheRef.current[quizId] = nextState;
        setState((prev) => ({
          ...prev,
          loading: false,
          answers: {},
          submitted: false,
          result: null,
          started: false,
          ...nextState,
        }));
        setCurrentIndex(0);
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error:
              err.response?.data?.message ||
              err.message ||
              "Có lỗi xảy ra khi tải quiz.",
          }));
        }
      }
    };

    fetchQuiz();
    return () => {
      cancelled = true;
    };
  }, [quizId, shouldRender]);

  useEffect(() => {
    if (!state.quiz?.due_at || state.submitted || state.alreadyAttempted) {
      setState((prev) => ({
        ...prev,
        timeRemaining: null,
        isDeadlinePassed: false,
      }));
      return;
    }

    const update = () => {
      const remaining = new Date(state.quiz.due_at).getTime() - Date.now();
      setState((prev) => ({
        ...prev,
        timeRemaining: remaining > 0 ? remaining : null,
        isDeadlinePassed: remaining <= 0,
      }));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [state.quiz?.due_at, state.submitted, state.alreadyAttempted]);

  const startQuiz = () => {
    if (!state.canAttempt || state.isDeadlinePassed || state.alreadyAttempted) return;
    startedAtRef.current = Date.now();
    setState((prev) => ({ ...prev, started: true }));
  };

  const selectAnswer = (questionId, optionId) => {
    if (!state.canAttempt || state.isDeadlinePassed || state.submitted) return;
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: optionId },
    }));
  };

  const goToQuestion = (index) => {
    if (index < 0 || index >= totalQuestions) return;
    setCurrentIndex(index);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setState((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      const elapsedSeconds = startedAtRef.current
        ? Math.max(Math.round((Date.now() - startedAtRef.current) / 1000), 1)
        : 0;
      const perQuestionSeconds = Math.max(
        Math.round(elapsedSeconds / totalQuestions),
        1,
      );

      const answers = state.questions.map((question) => ({
        question_id: question.id,
        selected_option: state.answers[question.id],
        time_spent_seconds: perQuestionSeconds,
      }));

      const res = await taService.submitQuizAttempt(quizId, { answers });
      if (res.success) {
        const result = res.data || res;
        setState((prev) => ({
          ...prev,
          submitting: false,
          submitted: true,
          result,
          canAttempt: false,
        }));
        onComplete?.(result);
      } else {
        setState((prev) => ({
          ...prev,
          submitting: false,
          error: res.error || "Không thể nộp quiz.",
        }));
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Không thể nộp quiz.";
      setState((prev) => ({
        ...prev,
        submitting: false,
        isDeadlinePassed: message.includes("quá hạn"),
        error: message,
      }));
    }
  };

  const Shell = ({ children, className = "" }) => {
    if (!isModal) {
      return <section className={`quiz-player ${className}`}>{children}</section>;
    }

    return (
      <div className="quiz-modal-backdrop">
        <section className={`quiz-player quiz-player-modal ${className}`}>
          <button
            type="button"
            className="quiz-modal-close"
            onClick={onClose}
            aria-label="Đóng quiz"
            title="Đóng"
          >
            <Icons.FiX size={18} />
          </button>
          {children}
        </section>
      </div>
    );
  };

  if (!shouldRender) return null;

  if (state.loading) {
    return (
      <Shell className="quiz-player-center">
        <Icons.FiRefreshCw className="quiz-spin" size={30} />
        <p>Đang tải quiz...</p>
      </Shell>
    );
  }

  if (state.error && !state.quiz) {
    return (
      <Shell className="quiz-player-center">
        <div className="quiz-empty-icon quiz-empty-danger">
          <Icons.FiAlertCircle size={28} />
        </div>
        <h2>Không thể tải quiz</h2>
        <p>{state.error}</p>
        {isModal && (
          <button type="button" className="quiz-secondary-btn" onClick={onClose}>
            Đóng
          </button>
        )}
      </Shell>
    );
  }

  if (!state.quiz || !totalQuestions) {
    return (
      <Shell className="quiz-player-center">
        <div className="quiz-empty-icon">
          <Icons.FiFileText size={28} />
        </div>
        <h2>Quiz chưa có câu hỏi</h2>
        <p>TA có thể đang chỉnh sửa nội dung trước khi mở cho học viên.</p>
      </Shell>
    );
  }

  if (state.alreadyAttempted && !state.submitted) {
    return (
      <Shell>
        <div className="quiz-locked">
          <div className="quiz-empty-icon quiz-empty-success">
            <Icons.FiCheckCircle size={30} />
          </div>
          <p className="quiz-eyebrow">Đã hoàn thành</p>
          <h2>{state.quiz.title || "Quiz"}</h2>
          <p>
            Bạn đã làm quiz này rồi. Mỗi học viên chỉ có một lượt nộp để kết quả
            được công bằng.
          </p>
          {isModal && (
            <button type="button" className="quiz-primary-btn" onClick={onClose}>
              Xong
            </button>
          )}
        </div>
      </Shell>
    );
  }

  if (state.submitted && state.result) {
    const score = getResultScore(state.result);
    const passed = Boolean(state.result.passed);

    return (
      <Shell>
        <div className="quiz-result">
          <div className={`quiz-result-ring ${passed ? "is-pass" : "is-fail"}`}>
            <span>{score}</span>
            <small>điểm</small>
          </div>

          <p className="quiz-eyebrow">Kết quả bài làm</p>
          <h2>{passed ? "Bạn đã vượt qua" : "Bạn chưa đạt yêu cầu"}</h2>
          <p>
            {passed
              ? "Bài làm đã được ghi nhận. Bạn có thể quay lại lớp học để tiếp tục."
              : "Bài làm đã được ghi nhận. Hãy xem lại phần bài giảng liên quan trước quiz tiếp theo."}
          </p>

          <div className="quiz-result-grid">
            <div>
              <span>Số câu đúng</span>
              <strong>
                {state.result.correct_count ?? "-"} /{" "}
                {state.result.total_questions || totalQuestions}
              </strong>
            </div>
            <div>
              <span>Điểm cần đạt</span>
              <strong>{state.quiz.passing_score || 60}</strong>
            </div>
            <div>
              <span>Số lượt làm</span>
              <strong>1</strong>
            </div>
          </div>

          {isModal && (
            <button type="button" className="quiz-primary-btn" onClick={onClose}>
              <Icons.FiCheck size={17} />
              Hoàn tất
            </button>
          )}
        </div>
      </Shell>
    );
  }

  if (!state.started) {
    return (
      <Shell>
        <div className="quiz-start">
          <div className="quiz-start-content">
            <p className="quiz-eyebrow">Sẵn sàng làm bài</p>
            <h2>{state.quiz.title || "Quiz"}</h2>
            {state.quiz.description && <p>{state.quiz.description}</p>}

            <div className="quiz-start-meta">
              <div>
                <Icons.FiList size={18} />
                <span>{totalQuestions} câu hỏi</span>
              </div>
              <div>
                <Icons.FiAward size={18} />
                <span>Cần {state.quiz.passing_score || 60} điểm</span>
              </div>
              <div>
                <Icons.FiClock size={18} />
                <span>{formatDeadline(state.quiz.due_at)}</span>
              </div>
            </div>

            {topics.length > 0 && (
              <div className="quiz-topic-strip">
                {topics.slice(0, 5).map((topic) => (
                  <span key={topic}>{topic}</span>
                ))}
              </div>
            )}

            {state.error && <div className="quiz-inline-error">{state.error}</div>}

            <button
              type="button"
              className="quiz-primary-btn"
              onClick={startQuiz}
              disabled={!state.canAttempt || state.isDeadlinePassed}
            >
              <Icons.FiPlay size={18} />
              Bắt đầu làm quiz
            </button>
          </div>

          <aside className="quiz-start-panel">
            <div className="quiz-rule">
              <Icons.FiShield size={18} />
              <div>
                <strong>Một lượt nộp</strong>
                <span>Sau khi nộp, bạn không thể làm lại.</span>
              </div>
            </div>
            <div className="quiz-rule">
              <Icons.FiCheckSquare size={18} />
              <div>
                <strong>Trắc nghiệm</strong>
                <span>Chọn một đáp án cho mỗi câu.</span>
              </div>
            </div>
            <div className="quiz-rule">
              <Icons.FiBarChart2 size={18} />
              <div>
                <strong>Kết quả ngay</strong>
                <span>Điểm số sẽ hiện sau khi nộp bài.</span>
              </div>
            </div>
          </aside>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="quiz-session">
        <aside className="quiz-sidebar">
          <p className="quiz-eyebrow">Tiến độ</p>
          <strong>{progress}%</strong>
          <div className="quiz-progress-track" aria-hidden="true">
            <div style={{ width: `${progress}%` }} />
          </div>
          <span>
            Đã trả lời {answeredCount}/{totalQuestions} câu
          </span>

          {state.quiz.due_at && (
            <div
              className={`quiz-deadline ${
                state.isDeadlinePassed || (state.timeRemaining ?? Infinity) < 3600000
                  ? "is-urgent"
                  : ""
              }`}
            >
              <Icons.FiClock size={16} />
              <div>
                <small>{state.isDeadlinePassed ? "Đã quá hạn" : "Còn lại"}</small>
                <b>
                  {state.isDeadlinePassed
                    ? "Không thể nộp"
                    : formatRemaining(state.timeRemaining)}
                </b>
              </div>
            </div>
          )}

          <div className="quiz-question-map">
            {state.questions.map((question, index) => {
              const answered = Boolean(state.answers[question.id]);
              const current = index === currentIndex;
              return (
                <button
                  key={question.id}
                  type="button"
                  className={`${answered ? "is-answered" : ""} ${
                    current ? "is-current" : ""
                  }`}
                  onClick={() => goToQuestion(index)}
                  aria-label={`Câu ${index + 1}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="quiz-question-card">
          <div className="quiz-question-header">
            <div>
              <span>Câu {currentIndex + 1}</span>
              <span>{currentQuestion.topic || "Chung"}</span>
              <span data-difficulty={currentQuestion.difficulty || "medium"}>
                {difficultyLabel[currentQuestion.difficulty] || "Trung bình"}
              </span>
            </div>
            <strong>
              {currentIndex + 1}/{totalQuestions}
            </strong>
          </div>

          <h2>{currentQuestion.question_text}</h2>

          <div className="quiz-options">
            {normalizeOptions(currentQuestion.options).map((option, optionIndex) => {
              const selected = state.answers[currentQuestion.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={selected ? "is-selected" : ""}
                  onClick={() => selectAnswer(currentQuestion.id, option.id)}
                >
                  <span>{optionLetters[optionIndex] || option.id}</span>
                  <p>{option.text}</p>
                  {selected && <Icons.FiCheckCircle size={20} />}
                </button>
              );
            })}
          </div>

          {state.error && <div className="quiz-inline-error">{state.error}</div>}

          <footer className="quiz-footer">
            <button
              type="button"
              className="quiz-secondary-btn"
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <Icons.FiChevronLeft size={18} />
              Câu trước
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                className="quiz-primary-btn"
                onClick={() => goToQuestion(currentIndex + 1)}
              >
                Câu tiếp
                <Icons.FiChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                className="quiz-primary-btn"
                onClick={handleSubmit}
                disabled={!canSubmit}
                title={
                  unansweredCount > 0
                    ? `Còn ${unansweredCount} câu chưa trả lời`
                    : "Nộp bài"
                }
              >
                {state.submitting ? (
                  <Icons.FiRefreshCw className="quiz-spin" size={18} />
                ) : (
                  <Icons.FiSend size={18} />
                )}
                {unansweredCount > 0
                  ? `Còn ${unansweredCount} câu`
                  : state.isDeadlinePassed
                    ? "Đã quá hạn"
                    : "Nộp bài"}
              </button>
            )}
          </footer>
        </section>
      </div>
    </Shell>
  );
};

export default QuizPlayer;
