import React, { useState, useEffect } from 'react';
import * as Icons from 'react-icons/fi';
import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import taService from '../../services/ta.service';

const QuizResults = ({ quizId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [summary, setSummary] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);

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
            Mỗi cột là số học viên nằm trong khoảng điểm tương ứng.
          </p>
          {attempts.length > 0 ? (
            <div style={{ height: '250px' }}>
              <ResponsiveContainer>
                <BarChart data={getScoreDistributionData()} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value) => [value, 'Học viên']}
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {getScoreDistributionData().map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
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
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{attempt.user?.display_name || 'Học viên'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {new Date(attempt.submitted_at).toLocaleDateString('vi-VN')}
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
    </div>
  );
};

export default QuizResults;
