import React, { useState } from 'react';
import * as Icons from 'react-icons/fi';
import taService from '../../services/ta.service';

const QuizCard = ({ quizId, quizTitle, questionCount, passingScore, onPlay }) => {
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    setLoading(true);
    try {
      const res = await taService.getQuizForStudent(quizId);
      if (res.success) {
        onPlay?.(quizId);
      } else {
        alert(res.error || 'Không thể tải quiz');
      }
    } catch (error) {
      console.error('Failed to load quiz:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tải quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-primary)',
      borderRadius: '8px',
      padding: '16px',
      maxWidth: '400px',
      fontFamily: 'inherit'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          background: 'var(--ta-amber-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icons.FiBook size={24} color="var(--ta-amber)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, lineHeight: 1.35 }}>
            {quizTitle || 'Quiz'}
          </h4>
          <p style={{ margin: '6px 0 8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {questionCount || 0} câu hỏi · {passingScore || 60}% để đạt
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--bg-surface-tertiary)',
              color: 'var(--text-muted)'
            }}>
              Trắc nghiệm
            </span>
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--bg-surface-tertiary)',
              color: 'var(--text-muted)'
            }}>
              1 lần làm
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePlay}
        disabled={loading}
        style={{
          width: '100%',
          marginTop: '12px',
          padding: '10px 16px',
          borderRadius: '8px',
          border: 'none',
          background: 'var(--primary)',
          color: 'white',
          fontSize: '13px',
          fontWeight: 600,
          cursor: loading ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontFamily: 'inherit',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? (
          <Icons.FiRefreshCw className="spin" size={16} />
        ) : (
          <>
            <Icons.FiPlay size={16} /> Làm quiz ngay
          </>
        )}
      </button>

      <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Chỉ được làm 1 lần duy nhất
      </p>
    </div>
  );
};

export default QuizCard;
