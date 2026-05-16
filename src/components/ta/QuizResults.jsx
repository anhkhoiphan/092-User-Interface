import React, { useState, useEffect } from 'react';
import * as Icons from 'react-icons/fi';
import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Legend } from 'recharts';
import taService from '../../services/ta.service';

const QuizResults = ({ quizId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [summary, setSummary] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [detailAttempt, setDetailAttempt] = useState(null);

  useEffect(() => {
    if (quizId) {
      fetchQuizData();
    }
  }, [quizId]);

  const fetchQuizData = async () => {
    setLoading(true);
    try {
      const [quizRes, summaryRes] = await Promise.allSettled([
        taService.getQuiz(quizId),
        taService.getQuizSummary(quizId)
      ]);

      if (quizRes.status === 'fulfilled' && quizRes.value.success) {
        setQuiz(quizRes.value.data.quiz);
        setQuestions(quizRes.value.data.questions || []);
      }

      if (summaryRes.status === 'fulfilled' && summaryRes.value.success) {
        setSummary(normalizeSummary(summaryRes.value.data));
        setAttempts(normalizeAttempts(summaryRes.value.data.attempts || []));
      }
    } catch (error) {
      console.error('Failed to fetch quiz data:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeAnswers = (answers) => {
    if (Array.isArray(answers)) return answers;
    if (typeof answers === 'string') {
      try {
        const parsed = JSON.parse(answers);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    if (answers && typeof answers === 'object') {
      const values = Object.values(answers);
      return values.every((item) => item && typeof item === 'object') ? values : [];
    }
    return [];
  };

  const normalizeAttempts = (items = []) => (
    Array.isArray(items)
      ? items.map((attempt) => ({ ...attempt, answers: normalizeAnswers(attempt.answers) }))
      : []
  );

  const normalizeSummary = (data = {}) => ({
    ...data,
    totalAttempts: data.totalAttempts ?? data.total_attempts ?? 0,
    passedCount: data.passedCount ?? data.passed_count ?? 0,
    failedCount: data.failedCount ?? data.failed_count ?? 0,
    passRate: data.passRate ?? data.pass_rate ?? 0,
    averageScore: data.averageScore ?? data.average_score ?? 0,
    topicPerformance: data.topicPerformance ?? data.topic_performance ?? [],
    questionDifficulty: data.questionDifficulty ?? data.question_difficulty ?? []
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Chưa gửi';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAttemptScore = (attempt) => {
    const totalQuestions = questions.length;
    if (totalQuestions === 0) return { score: 0, correctCount: 0 };

    const correctCount = attempt.answers.filter((ans) => {
      const question = questions.find((q) => q.id === ans.question_id);
      return question && ans.selected_option === question.correct_answer;
    }).length;

    return {
      score: Math.round((correctCount / totalQuestions) * 100),
      correctCount
    };
  };

  const getScoreDistributionData = () => {
    const ranges = [
      { label: '0-39%', min: 0, max: 39, count: 0, color: 'var(--ta-red)' },
      { label: '40-59%', min: 40, max: 59, count: 0, color: 'var(--ta-amber)' },
      { label: '60-79%', min: 60, max: 79, count: 0, color: 'var(--primary)' },
      { label: '80-100%', min: 80, max: 100, count: 0, color: 'var(--ta-green)' }
    ];

    attempts.forEach((attempt) => {
      const { score } = getAttemptScore(attempt);
      const range = ranges.find((item) => score >= item.min && score <= item.max);
      if (range) range.count += 1;
    });

    return ranges;
  };

  const getDifficultyData = () => {
    if (!summary?.questionDifficulty) return [];
    const counts = { easy: 0, medium: 0, hard: 0, correct: { easy: 0, medium: 0, hard: 0 } };

    questions.forEach((q) => {
      const qAttempts = attempts.filter((a) => a.answers.some((ans) => ans.question_id === q.id));
      const qCorrect = attempts.filter((a) =>
        a.answers.some((ans) => ans.question_id === q.id && ans.selected_option === q.correct_answer)
      ).length;

      counts[q.difficulty] += qAttempts.length;
      counts.correct[q.difficulty] += qCorrect;
    });

    return Object.keys(counts)
      .filter((k) => k !== 'correct')
      .map((diff) => {
        const total = counts[diff] || 0;
        const correct = counts.correct[diff] || 0;
        return {
          difficulty: diff === 'easy' ? 'Dễ' : diff === 'medium' ? 'Trung bình' : 'Khó',
          correct,
          wrong: Math.max(total - correct, 0),
          total
        };
      })
      .filter((item) => item.total > 0);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <Icons.FiRefreshCw className="spin" size={24} color="var(--primary)" />
        <span style={{ marginLeft: '12px' }}>Đang tải kết quả...</span>
      </div>
    );
  }

  if (!quiz) {
    return <div>Không tìm thấy quiz</div>;
  }

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="ta-btn" onClick={onBack} style={{ padding: '8px 12px' }}>
            <Icons.FiArrowLeft />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px' }}>{quiz.title}</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              Gửi lúc: {formatDate(quiz.sent_to_chat_at)}
            </p>
          </div>
        </div>
        <div className="ta-card-premium" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Điểm TB</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: 'var(--primary)' }}>
            {summary?.averageScore ? Math.round(summary.averageScore) + '%' : '0%'}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="ta-card-premium" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng attempts</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{summary?.totalAttempts || 0}</div>
        </div>
        <div className="ta-card-premium" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Đạt</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: 'var(--ta-green)' }}>
            {summary?.passedCount || 0}
          </div>
        </div>
        <div className="ta-card-premium" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Không đạt</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: 'var(--ta-red)' }}>
            {summary?.failedCount || 0}
          </div>
        </div>
        <div className="ta-card-premium" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tỷ lệ đạt</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: 'var(--primary)' }}>
            {summary?.passRate ? Math.round(summary.passRate) + '%' : '0%'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Score Distribution */}
        <div className="ta-card-premium" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '14px' }}>Phân vùng điểm học viên</h3>
          <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Biểu đồ tròn phân bố điểm của học viên.
          </p>
          {attempts.length > 0 ? (
            <div style={{ height: '250px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={getScoreDistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {getScoreDistributionData().map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip
                    formatter={(value) => [value, 'Học viên']}
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* Difficulty Breakdown */}
        <div className="ta-card-premium" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px' }}>Phân tích độ khó</h3>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Số câu trả lời theo độ khó, không phải số học viên.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--ta-green)', marginRight: 6 }} />Đúng</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--ta-red)', marginRight: 6 }} />Sai</span>
            </div>
          </div>
          {getDifficultyData().length > 0 ? (
            <div style={{ height: '250px' }}>
              <ResponsiveContainer>
                <BarChart
                  data={getDifficultyData()}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
                >
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="difficulty" width={80} />
                  <Tooltip
                    formatter={(value, name) => [value, name === 'correct' ? 'Đúng' : 'Sai']}
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="correct" stackId="answers" fill="var(--ta-green)" radius={[4, 0, 0, 4]} />
                  <Bar dataKey="wrong" stackId="answers" fill="var(--ta-red)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* Student Attempts */}
      <div className="ta-card-premium" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14px' }}>Chi tiết lần làm của học viên</h3>
        {attempts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {attempts.map((attempt, idx) => {
              const totalQuestions = questions.length;
              const { score, correctCount } = getAttemptScore(attempt);
              const passed = score >= (quiz.passing_score || 60);

              return (
                <div
                  key={attempt.id || idx}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-surface-tertiary)',
                    borderRadius: '12px',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => setDetailAttempt(attempt)}
                >
                  <div style={{ fontWeight: 600 }}>{attempt.user?.display_name || 'Học viên'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {new Date(attempt.submitted_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        background: passed ? 'var(--ta-green-bg)' : 'var(--ta-red-bg)',
                        color: passed ? 'var(--ta-green)' : 'var(--ta-red)',
                        fontWeight: 600,
                        fontSize: '12px'
                      }}
                    >
                      {score}% {passed ? 'Đạt' : 'Không đạt'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {correctCount}/{totalQuestions} câu đúng
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Icons.FiChevronRight size={20} color="var(--text-muted)" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Icons.FiUser size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Chưa có học viên nào làm quiz</p>
          </div>
        )}
      </div>

      {/* Attempt Detail Modal */}
      {detailAttempt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setDetailAttempt(null)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              maxWidth: '800px',
              maxHeight: '90vh',
              width: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Chi tiết lần làm</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {detailAttempt.user?.display_name} - Nộp lúc {new Date(detailAttempt.submitted_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <button className="ta-btn" onClick={() => setDetailAttempt(null)} style={{ padding: '4px 8px' }}>
                <Icons.FiX size={16} />
              </button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto' }}>
              {(() => {
                const { score, correctCount } = getAttemptScore(detailAttempt);
                const passed = score >= (quiz.passing_score || 60);
                const totalQuestions = questions.length;

                const getDifficultyColor = (difficulty) => {
                  switch (difficulty) {
                    case 'easy': return 'var(--ta-green)';
                    case 'medium': return 'var(--ta-amber)';
                    case 'hard': return 'var(--ta-red)';
                    default: return 'var(--text-muted)';
                  }
                };

                const getDifficultyBg = (difficulty) => {
                  switch (difficulty) {
                    case 'easy': return 'var(--ta-green-bg)';
                    case 'medium': return 'var(--ta-amber-bg)';
                    case 'hard': return 'var(--ta-red-bg)';
                    default: return 'var(--bg-surface-tertiary)';
                  }
                };

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

                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                      <div style={{ padding: '16px', background: 'var(--bg-surface-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Điểm số</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: 'var(--primary)' }}>{score}%</div>
                      </div>
                      <div style={{ padding: '16px', background: 'var(--bg-surface-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Câu đúng</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: 'var(--ta-green)' }}>{correctCount}/{totalQuestions}</div>
                      </div>
                      <div style={{ padding: '16px', background: 'var(--bg-surface-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Điểm đạt</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: 'var(--ta-amber)' }}>{quiz.passing_score || 60}%</div>
                      </div>
                      <div style={{ padding: '16px', background: 'var(--bg-surface-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kết quả</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: passed ? 'var(--ta-green)' : 'var(--ta-red)' }}>
                          {passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                        </div>
                      </div>
                    </div>

                    <h4 style={{ margin: '0 0 16px', fontSize: '14px' }}>Chi tiết từng câu</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {detailAttempt.answers.map((ans, ansIdx) => {
                        const question = questions.find((q) => q.id === ans.question_id);
                        if (!question) return null;
                        const isCorrect = ans.selected_option === question.correct_answer;
                        const selectedOption = normalizeOptions(question.options).find((o) => o.id === ans.selected_option);
                        const correctOption = normalizeOptions(question.options).find((o) => o.id === question.correct_answer);

                        return (
                          <div
                            key={ans.question_id || ansIdx}
                            style={{
                              padding: '16px',
                              background: 'var(--bg-surface-tertiary)',
                              borderRadius: '8px',
                              border: `2px solid ${isCorrect ? 'var(--ta-green)' : 'var(--ta-red)'}`
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                              <span
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: isCorrect ? 'var(--ta-green-bg)' : 'var(--ta-red-bg)',
                                  color: isCorrect ? 'var(--ta-green)' : 'var(--ta-red)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '12px'
                                }}
                              >
                                {ansIdx + 1}
                              </span>
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: getDifficultyBg(question.difficulty), color: getDifficultyColor(question.difficulty), textTransform: 'uppercase', fontWeight: 600 }}>
                                {question.difficulty === 'easy' ? 'Dễ' : question.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                              </span>
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                                {question.topic}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 500 }}>{question.question_text}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ padding: '12px', background: isCorrect ? 'var(--ta-green-bg)' : 'var(--ta-red-bg)', borderRadius: '6px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: isCorrect ? 'var(--ta-green)' : 'var(--ta-red)' }}>
                                  <Icons.FiCheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                  Câu trả lời của bạn
                                </div>
                                <div style={{ fontSize: '13px' }}>{selectedOption?.text || 'Không có'}</div>
                              </div>
                              {!isCorrect && (
                                <div style={{ padding: '12px', background: 'var(--ta-green-bg)', borderRadius: '6px' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: 'var(--ta-green)' }}>
                                    <Icons.FiInfo size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                    Đáp án đúng
                                  </div>
                                  <div style={{ fontSize: '13px' }}>{correctOption?.text || 'Không có'}</div>
                                </div>
                              )}
                              {question.explanation && (
                                <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '6px', fontSize: '13px', color: 'var(--text-muted)', border: '1px solid var(--border-primary)' }}>
                                  <strong>Giải thích:</strong> {question.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResults;
