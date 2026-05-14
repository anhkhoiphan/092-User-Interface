import React, { useState, useEffect } from 'react';
import * as Icons from 'react-icons/fi';
import taService from '../../services/ta.service';

const QuizWorkflow = ({ quizId, spaceId, onBack, onSave, onSend, onViewResults }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);

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
    setExpandedCard(newQuestion.id);
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

  const setCorrectAnswer = (qIndex, optionId) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], correct_answer: optionId };
    setQuestions(updated);
  };

  const duplicateQuestion = (index) => {
    const duplicate = {
      ...questions[index],
      id: `temp-${Date.now()}`,
      order: questions.length + 1,
      question_text: questions[index].question_text + ' (copy)'
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicate);
    setQuestions(newQuestions);
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

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa quiz này? Hành động này không thể hoàn tác.')) return;

    setSaving(true);
    try {
      await taService.updateQuiz(quizId, { ...buildPayload(), status: 'archived' });
      onBack?.();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    } finally {
      setSaving(false);
    }
  };

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="ta-btn" onClick={onBack} style={{ padding: '8px 12px' }} title="Quay lại">
            <Icons.FiArrowLeft />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontFamily: 'inherit' }}>{quiz.title || 'Quiz chưa có tiêu đề'}</h2>
            <span className="ta-badge" style={{ backgroundColor: quiz.status === 'published' ? 'var(--ta-green-bg)' : 'var(--bg-surface-tertiary)', color: quiz.status === 'published' ? 'var(--ta-green)' : 'var(--text-muted)' }}>
              {quiz.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="ta-btn" onClick={() => setIsInfoCollapsed(!isInfoCollapsed)} style={{ padding: '10px 16px' }} title={isInfoCollapsed ? 'Mở rộng' : 'Thu gọn'}>
            <Icons.FiChevronUp size={18} style={{ transform: isInfoCollapsed ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
          </button>
          <button className="ta-btn" onClick={handleSave} disabled={saving} style={{ padding: '10px 16px' }}>
            {saving ? <Icons.FiRefreshCw className="spin" /> : <Icons.FiSave />}
          </button>
          <button className="vibrant-btn" onClick={handleSend} disabled={saving} style={{ padding: '10px 16px' }}>
            <Icons.FiSend />
          </button>
          <button className="ta-btn" onClick={handleDelete} disabled={saving} style={{ padding: '10px 16px', color: 'var(--ta-red)' }} title="Xóa quiz">
            <Icons.FiTrash2 size={16} />
          </button>
          {quiz?.status === 'published' && typeof onViewResults === 'function' && (
            <button className="ta-btn" onClick={() => onViewResults(quizId)} style={{ padding: '10px 16px' }}>
              <Icons.FiBarChart2 />
            </button>
          )}
        </div>
      </div>

      {/* Quiz Info Card */}
      {!isInfoCollapsed && (
        <div className="ta-card-premium" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'inherit' }}>Tiêu đề</label>
            <input
              className="ta-input"
              value={quiz.title || ''}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              placeholder="Nhập tiêu đề quiz..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'inherit' }}>Mô tả</label>
            <input
              className="ta-input"
              value={quiz.description || ''}
              onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
              placeholder="Mô tả ngắn..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'inherit' }}>Điểm đạt</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                className="ta-input"
                type="number"
                min="0"
                max="100"
                value={quiz.passing_score || 60}
                onChange={(e) => setQuiz({ ...quiz, passing_score: parseInt(e.target.value) || 0 })}
                style={{ width: '100px' }}
              />
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)', fontFamily: 'inherit' }}>%</span>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'inherit' }}>Trạng thái</label>
            <select
              className="ta-input"
              value={quiz.status || 'draft'}
              onChange={(e) => setQuiz({ ...quiz, status: e.target.value })}
            >
              <option value="draft">Bản nháp</option>
              <option value="published">Đã xuất bản</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>
        </div>
        {isInfoCollapsed && <div style={{ display: 'flex', justifyContent: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <span>Thông tin quiz được thu gọn. Nhấn nút trên để mở rộng.</span>
        </div>}
      </div>
      )}

      {/* Questions List */}
      <div className="ta-card-premium" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.FiList size={16} style={{ verticalAlign: 'middle', color: 'white' }} />
            </div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, fontFamily: 'inherit' }}>
              Danh sách câu hỏi <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '13px' }}>({questions.length} câu)</span>
            </h3>
          </div>
          <button className="ta-btn" onClick={addQuestion} style={{ padding: '10px 18px', color: 'var(--primary)', borderColor: 'var(--primary)', background: 'var(--ta-blue-bg)' }}>
            <Icons.FiPlus size={16} />
            <span style={{ marginLeft: '6px' }}>Thêm câu hỏi</span>
          </button>
        </div>

        {questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'var(--bg-surface-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Icons.FiFileText size={40} style={{ opacity: 0.3 }} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', fontFamily: 'inherit' }}>Chưa có câu hỏi nào</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', fontFamily: 'inherit' }}>Nhấn nút bên dưới để bắt đầu</p>
            <button className="ta-btn" onClick={addQuestion} style={{ padding: '10px 20px', color: 'var(--primary)', borderColor: 'var(--primary)', background: 'var(--ta-blue-bg)' }}>
              <Icons.FiPlus size={16} />
              <span style={{ marginLeft: '6px' }}>Thêm câu hỏi đầu tiên</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {questions.map((q, qIndex) => {
              const isExpanded = expandedCard === q.id;
              const hasContent = q.question_text || q.options.some(o => o.text);

              return (
                <div
                  key={q.id || qIndex}
                  style={{
                    border: `1px solid ${isExpanded ? 'var(--primary)' : 'var(--border-primary)'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    background: isExpanded ? 'var(--bg-surface)' : 'var(--bg-surface-tertiary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Card Header - Always Visible */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px 0' }}
                    onClick={() => setExpandedCard(isExpanded ? null : q.id)}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      borderRadius: '50%',
                      background: 'var(--bg-surface-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: 'var(--primary)',
                      fontFamily: 'inherit'
                    }}>
                      {qIndex + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, fontFamily: 'inherit', color: hasContent ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {q.question_text || 'Chưa có nội dung câu hỏi'}
                      </p>
                    </div>

                    {/* Quick Stats */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: getDifficultyBg(q.difficulty),
                        color: getDifficultyColor(q.difficulty),
                        textTransform: 'uppercase',
                        fontFamily: 'inherit'
                      }}>
                        {q.difficulty === 'easy' ? 'Dễ' : q.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                      </span>
                      <Icons.FiChevronDown
                        size={18}
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                      />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-primary)' }}>
                      {/* Question Text */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'inherit' }}>
                          Nội dung câu hỏi
                        </label>
                        <textarea
                          className="ta-input"
                          value={q.question_text}
                          onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                          placeholder="Nhập nội dung câu hỏi..."
                          rows={2}
                        />
                      </div>

                      {/* Options */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'inherit' }}>
                          Phương án trả lời
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                          {normalizeOptions(q.options).map((opt, oIndex) => {
                            const isSelected = q.correct_answer === opt.id;
                            return (
                              <div
                                key={opt.id}
                                style={{
                                  padding: '14px',
                                  borderRadius: '10px',
                                  border: isSelected ? '2px solid var(--ta-green)' : '1px solid var(--border-primary)',
                                  background: isSelected ? 'var(--ta-green-bg)' : 'var(--bg-surface-tertiary)',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '12px',
                                  transition: 'all 0.2s ease',
                                  cursor: 'pointer',
                                  position: 'relative'
                                }}
                                onClick={() => setCorrectAnswer(qIndex, opt.id)}
                              >
                                <span style={{
                                  width: '28px',
                                  height: '28px',
                                  minWidth: '28px',
                                  borderRadius: '50%',
                                  background: isSelected ? 'var(--ta-green)' : 'var(--bg-surface)',
                                  color: isSelected ? 'white' : 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  fontFamily: 'inherit',
                                  flexShrink: 0
                                }}>
                                  {opt.id.toUpperCase()}
                                </span>
                                <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
                                  <input
                                    className="ta-input"
                                    value={opt.text}
                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                    placeholder={`Phương án ${opt.id.toUpperCase()}`}
                                    style={{ border: 'none', background: 'transparent', padding: '4px 0', width: '100%' }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Nhập phương án..."
                                  />
                                </div>
                                {isSelected && (
                                  <Icons.FiCheckCircle size={20} color="var(--ta-green)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'inherit' }}>Chủ đề</label>
                          <select
                            className="ta-input"
                            value={q.topic}
                            onChange={(e) => updateQuestion(qIndex, 'topic', e.target.value)}
                            style={{ cursor: 'pointer' }}
                          >
                            <option value="Chung">Chung</option>
                            <option value="Lý thuyết">Lý thuyết</option>
                            <option value="Thực hành">Thực hành</option>
                            <option value="Case study">Case study</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'inherit' }}>Độ khó</label>
                          <select
                            className="ta-input"
                            value={q.difficulty}
                            onChange={(e) => updateQuestion(qIndex, 'difficulty', e.target.value)}
                            style={{ cursor: 'pointer' }}
                          >
                            <option value="easy">Dễ</option>
                            <option value="medium">Trung bình</option>
                            <option value="hard">Khó</option>
                          </select>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'inherit' }}>
                          Giải thích đáp án
                        </label>
                        <textarea
                          className="ta-input"
                          value={q.explanation || ''}
                          onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                          placeholder="Giải thích tại sao đáp án này đúng..."
                          rows={2}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-primary)', marginTop: '16px' }}>
                        <button
                          className="ta-btn"
                          onClick={() => moveQuestion(qIndex, -1)}
                          disabled={qIndex === 0}
                          style={{ padding: '8px 12px' }}
                          title="Di chuyển lên"
                        >
                          <Icons.FiChevronUp size={16} />
                        </button>
                        <button
                          className="ta-btn"
                          onClick={() => moveQuestion(qIndex, 1)}
                          disabled={qIndex === questions.length - 1}
                          style={{ padding: '8px 12px' }}
                          title="Di chuyển xuống"
                        >
                          <Icons.FiChevronDown size={16} />
                        </button>
                        <button
                          className="ta-btn"
                          onClick={() => duplicateQuestion(qIndex)}
                          style={{ padding: '8px 12px', color: 'var(--ta-amber)' }}
                          title="Nhân đôi"
                        >
                          <Icons.FiCopy size={16} />
                        </button>
                        <button
                          className="ta-btn"
                          onClick={() => removeQuestion(qIndex)}
                          style={{ padding: '8px 12px', color: 'var(--ta-red)' }}
                          title="Xóa"
                        >
                          <Icons.FiTrash2 size={16} />
                        </button>
                        <div style={{ flex: 1 }} />
                        <button
                          className="ta-btn"
                          onClick={() => setExpandedCard(null)}
                          style={{ padding: '8px 12px' }}
                        >
                          <Icons.FiX size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizWorkflow;