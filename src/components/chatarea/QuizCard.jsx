import React, { useState } from "react";
import * as Icons from "react-icons/fi";
import taService from "../../services/ta.service";
import "./QuizCard.css";

const QuizCard = ({ quizId, quizTitle, questionCount, passingScore, onPlay }) => {
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    setLoading(true);
    try {
      const res = await taService.getQuizForStudent(quizId);
      if (res.success) {
        onPlay?.(quizId);
      } else {
        alert(res.error || "Không thể tải quiz");
      }
    } catch (error) {
      console.error("Failed to load quiz:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi tải quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="chat-quiz-card">
      <div className="chat-quiz-card-header">
        <div className="chat-quiz-icon">
          <Icons.FiCheckSquare size={22} />
        </div>
        <div>
          <span>Quiz ôn tập</span>
          <h4>{quizTitle || "Quiz"}</h4>
        </div>
      </div>

      <div className="chat-quiz-card-stats">
        <div>
          <Icons.FiList size={15} />
          <span>{questionCount || 0} câu hỏi</span>
        </div>
        <div>
          <Icons.FiAward size={15} />
          <span>{passingScore || 60} điểm để đạt</span>
        </div>
        <div>
          <Icons.FiShield size={15} />
          <span>1 lượt nộp</span>
        </div>
      </div>

      <button
        type="button"
        className="chat-quiz-card-action"
        onClick={handlePlay}
        disabled={loading}
      >
        {loading ? (
          <Icons.FiRefreshCw className="quiz-card-spin" size={16} />
        ) : (
          <>
            <Icons.FiPlay size={16} />
            Làm quiz ngay
          </>
        )}
      </button>
    </article>
  );
};

export default QuizCard;
