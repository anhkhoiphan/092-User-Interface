import React from "react";
import * as Icons from "react-icons/fi";
import QuizPlayer from "../components/ta/QuizPlayer";
import "./StudentQuizPage.css";

const StudentQuizPage = ({ quizId: quizIdProp }) => {
  const quizId =
    quizIdProp || window.location.pathname.split("/quiz/")[1]?.split("/")[0];

  const navigateHome = () => {
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="student-quiz-page">
      <header className="student-quiz-topbar">
        <button
          type="button"
          className="student-quiz-icon-btn"
          onClick={navigateHome}
          aria-label="Quay về lớp học"
          title="Quay về lớp học"
        >
          <Icons.FiArrowLeft size={18} />
        </button>

        <div className="student-quiz-brand">
          <div className="student-quiz-mark">
            <Icons.FiCheckSquare size={20} />
          </div>
          <div>
            <p>VinClassroom</p>
            <h1>Bài quiz</h1>
          </div>
        </div>
      </header>

      <main className="student-quiz-main">
        <QuizPlayer
          quizId={quizId}
          displayMode="inline"
          onComplete={() => {}}
        />
      </main>
    </div>
  );
};

export default StudentQuizPage;
