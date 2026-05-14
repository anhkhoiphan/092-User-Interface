import React, { useEffect, useState } from 'react';
import * as Icons from 'react-icons/fi';
import taService from '../services/ta.service';
import QuizPlayer from '../components/ta/QuizPlayer';

const StudentQuizPage = ({ quizId: quizIdProp }) => {
  const quizId = quizIdProp || window.location.pathname.split('/quiz/')[1]?.split('/')[0];
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    } else {
      setError('Thiếu mã quiz');
      setLoading(false);
    }
  }, [quizId]);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await taService.getQuizForStudent(quizId);
      if (res.success) {
        setQuiz(res.data.quiz);
      } else {
        setError(res.error || 'Không thể tải quiz');
      }
    } catch (fetchError) {
      console.error('Failed to fetch quiz:', fetchError);
      setError(fetchError.response?.data?.message || 'Có lỗi xảy ra khi tải quiz');
    } finally {
      setLoading(false);
    }
  };

  const navigateHome = () => {
    window.history.pushState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleComplete = () => {
    // Results are shown by QuizPlayer.
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <Icons.FiRefreshCw className="spin" size={32} color="var(--primary)" />
          <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Đang tải quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
          <Icons.FiAlertCircle size={48} color="var(--ta-red)" style={{ marginBottom: '16px' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>Không thể tải quiz</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 24px' }}>
            {error || 'Quiz không tồn tại hoặc bạn không có quyền truy cập'}
          </p>
          <button className="vibrant-btn" onClick={navigateHome} style={{ padding: '12px 24px' }}>
            <Icons.FiHome /> Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-primary)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: 'var(--ta-amber-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icons.FiBook size={20} color="var(--ta-amber)" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{quiz.title}</h1>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Bài kiểm tra trắc nghiệm</p>
        </div>
      </div>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '24px' }}>
        <QuizPlayer quizId={quizId} onComplete={handleComplete} displayMode="inline" />
      </div>
    </div>
  );
};

export default StudentQuizPage;
