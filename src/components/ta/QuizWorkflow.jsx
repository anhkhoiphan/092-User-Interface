import React, { useState, useEffect } from 'react';
import * as Icons from 'react-icons/fi';
import taService from '../../services/ta.service';

const QuizWorkflow = ({ quizId, spaceId, onBack, onSave, onSend, onViewResults }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [mode, setMode] = useState('edit'); // 'view' or 'edit'

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const res = await taService.getQuiz(quizId);
      if (res.success) {
        setQuiz(res.data.quiz);
        setQuestions((res.data.questions || []).map(normalizeQuestion));
      }
    } catch (error) {
      console.error('Failed to fetch quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: `temp-${Date.now()}`,
      order: questions.length + 1,
      topic: 'Chung',
      difficulty: 'medium',
      question_text: '',
      options: [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' }
      ],
      correct_answer: 'a',
      explanation: ''
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    const options = normalizeOptions(updated[qIndex].options);
    options[oIndex] = { ...options[oIndex], text: value };
    updated[qIndex] = { ...updated[qIndex], options };
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const moveQuestion = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const updated = [...questions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setQuestions(updated.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await taService.updateQuiz(quizId, buildPayload());
      if (res.success) {
        onSave?.(res.data);
      }
    } catch (error) {
      console.error('Failed to save quiz:', error);
    } finally {
      setSaving(false);
    }
  };

  const buildPayload = () => ({
    title: quiz.title,
    description: quiz.description,
    status: quiz.status,
    passing_score: quiz.passing_score || 60,
    questions: questions.map(toQuestionPayload)
  });

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

  const toQuestionPayload = (question, index) => {
    const normalized = normalizeQuestion(question);
    return {
      order: Number(normalized.order || index + 1),
      topic: normalized.topic || 'Chung',
      difficulty: normalized.difficulty || 'medium',
      question_text: normalized.question_text || '',
      options: normalizeOptions(normalized.options).map((option, optionIndex) => ({
        id: String(option.id || ['a', 'b', 'c', 'd'][optionIndex] || optionIndex + 1),
        text: String(option.text || '')
      })),
      correct_answer: normalized.correct_answer || 'a',
      explanation: normalized.explanation || ''
    };
  };

  const handleSend = async () => {
    setSaving(true);
    try {
      const saveRes = await taService.updateQuiz(quizId, buildPayload());
      if (!saveRes.success) return;

      const res = await taService.sendQuiz(quizId, { space_id: spaceId });
      if (res.success) {
        onSend?.(res.data);
      }
    } catch (error) {
      console.error('Failed to send quiz:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <Icons.FiRefreshCw className="spin" size={24} color="var(--primary)" />
        <span style={{ marginLeft: '12px' }}>Đang tải quiz...</span>
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
            <h2 style={{ margin: 0, fontSize: '18px' }}>{quiz.title || 'Quiz chưa có tiêu đề'}</h2>
            <span className="ta-badge" style={{ backgroundColor: quiz.status === 'published' ? 'var(--ta-green)' : 'var(--bg-surface-tertiary)' }}>
              {quiz.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="ta-btn"
            onClick={() => setMode(mode === 'view' ? 'edit' : 'view')}
            style={{ padding: '8px 16px' }}
          >
            {mode === 'view' ? <><Icons.FiEdit3 size={14} /> Sửa</> : <><Icons.FiEye size={14} /> Xem</>}
          </button>
          {mode === 'edit' && (
            <>
              <button className="ta-btn" onClick={handleSave} disabled={saving} style={{ padding: '8px 16px' }}>
                {saving ? <Icons.FiRefreshCw className="spin" /> : <Icons.FiSave />}
                Lưu
              </button>
              <button className="vibrant-btn" onClick={handleSend} disabled={saving} style={{ padding: '8px 16px' }}>
                <Icons.FiSend /> Gửi vào chat
              </button>
            </>
          )}
          {quiz?.status === 'published' && typeof onViewResults === 'function' && (
            <button className="ta-btn" onClick={() => onViewResults(quizId)} style={{ padding: '8px 16px' }}>
              <Icons.FiBarChart2 /> Xem kết quả
            </button>
          )}
        </div>
      </div>

      {/* Quiz Info */}
      <div className="ta-card-premium" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tiêu đề</label>
            {mode === 'edit' ? (
              <input
                className="ta-input"
                value={quiz.title || ''}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                style={{ marginTop: '4px' }}
              />
            ) : (
              <div style={{ marginTop: '4px', fontWeight: 500 }}>{quiz.title || 'Chưa có tiêu đề'}</div>
            )}
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Số câu</label>
            <div style={{ marginTop: '4px', fontWeight: 500 }}>{questions.length} câu</div>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Điểm đạt</label>
            {mode === 'edit' ? (
              <input
                className="ta-input"
                type="number"
                value={quiz.passing_score || 60}
                onChange={(e) => setQuiz({ ...quiz, passing_score: parseInt(e.target.value) })}
                style={{ marginTop: '4px' }}
              />
            ) : (
              <div style={{ marginTop: '4px', fontWeight: 500 }}>{quiz.passing_score || 60}%</div>
            )}
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trạng thái</label>
            {mode === 'edit' ? (
              <select
                className="ta-input"
                value={quiz.status || 'draft'}
                onChange={(e) => setQuiz({ ...quiz, status: e.target.value })}
                style={{ marginTop: '4px' }}
              >
                <option value="draft">Bản nháp</option>
                <option value="published">Đã xuất bản</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            ) : (
              <div style={{ marginTop: '4px', fontWeight: 500 }}>
                {quiz.status === 'draft' ? 'Bản nháp' : quiz.status === 'published' ? 'Đã xuất bản' : 'Đã lưu trữ'}
              </div>
            )}
          </div>
        </div>
        {mode === 'edit' && (
          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mô tả</label>
            <textarea
              className="ta-input"
              value={quiz.description || ''}
              onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
              style={{ marginTop: '4px', minHeight: '80px' }}
              placeholder="Mô tả quiz..."
            />
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="ta-card-premium">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '15px' }}>Danh sách câu hỏi</h3>
          {mode === 'edit' && (
            <button className="ta-btn" onClick={addQuestion} style={{ padding: '8px 16px' }}>
              <Icons.FiPlus size={14} /> Thêm câu
            </button>
          )}
        </div>

        {questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Icons.FiFileText size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Chưa có câu hỏi nào</p>
            {mode === 'edit' && <button className="ta-btn" onClick={addQuestion}><Icons.FiPlus /> Thêm câu đầu tiên</button>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {questions.map((q, qIndex) => (
              <div key={q.id || qIndex} style={{ border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '16px', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                    {qIndex + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    {mode === 'edit' ? (
                      <input
                        className="ta-input"
                        value={q.question_text}
                        onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                        placeholder="Nhập nội dung câu hỏi..."
                        style={{ marginBottom: '12px' }}
                      />
                    ) : (
                      <p style={{ margin: '0 0 12px 0', fontWeight: 500 }}>{q.question_text}</p>
                    )}

                    {/* Options */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {normalizeOptions(q.options).map((opt, oIndex) => (
                        <div
                          key={opt.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: q.correct_answer === opt.id ? '2px solid var(--ta-green)' : '1px solid var(--border-primary)',
                            background: q.correct_answer === opt.id ? 'var(--ta-green-bg)' : 'var(--bg-surface-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: q.correct_answer === opt.id ? 'var(--ta-green)' : 'var(--bg-surface)',
                            color: q.correct_answer === opt.id ? 'white' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700
                          }}>
                            {opt.id.toUpperCase()}
                          </span>
                          {mode === 'edit' ? (
                            <input
                              className="ta-input"
                              value={opt.text}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Phương án ${opt.id.toUpperCase()}`}
                              style={{ border: 'none', padding: '4px 8px' }}
                            />
                          ) : (
                            <span style={{ fontSize: '13px' }}>{opt.text}</span>
                          )}
                          {q.correct_answer === opt.id && (
                            <Icons.FiCheckCircle size={16} color="var(--ta-green)" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                      {mode === 'edit' ? (
                        <>
                          <select
                            className="ta-input"
                            value={q.topic}
                            onChange={(e) => updateQuestion(qIndex, 'topic', e.target.value)}
                            style={{ padding: '6px 10px', fontSize: '12px', width: '120px' }}
                          >
                            <option value="Chung">Chung</option>
                            <option value="Lý thuyết">Lý thuyết</option>
                            <option value="Thực hành">Thực hành</option>
                            <option value="Case study">Case study</option>
                          </select>
                          <select
                            className="ta-input"
                            value={q.difficulty}
                            onChange={(e) => updateQuestion(qIndex, 'difficulty', e.target.value)}
                            style={{ padding: '6px 10px', fontSize: '12px', width: '100px' }}
                          >
                            <option value="easy">Dễ</option>
                            <option value="medium">Trung bình</option>
                            <option value="hard">Khó</option>
                          </select>
                        </>
                      ) : (
                        <>
                          <span className="ta-badge" style={{ fontSize: '11px', padding: '4px 8px' }}>
                            {q.topic}
                          </span>
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
                        </>
                      )}
                      {q.explanation && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Có giải thích
                        </span>
                      )}
                    </div>
                  </div>

                  {mode === 'edit' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button className="ta-btn" onClick={() => moveQuestion(qIndex, -1)} disabled={qIndex === 0} style={{ padding: '4px 8px' }}>
                        <Icons.FiChevronUp />
                      </button>
                      <button className="ta-btn" onClick={() => moveQuestion(qIndex, 1)} disabled={qIndex === questions.length - 1} style={{ padding: '4px 8px' }}>
                        <Icons.FiChevronDown />
                      </button>
                      <button className="ta-btn" onClick={() => removeQuestion(qIndex)} style={{ padding: '4px 8px', color: 'var(--ta-red)' }}>
                        <Icons.FiTrash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizWorkflow;
