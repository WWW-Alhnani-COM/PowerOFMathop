// AnswerChecker.jsx (وظيفة مساعدة وليست مكون React)
const AnswerChecker = {
  check: (problem, userAnswer) => {
    const isCorrect = problem.answer === Number(userAnswer);
    const timeSpent = 5; // يتم قياسه فعلياً من مؤقت البداية

    return {
      isCorrect,
      timeSpent,
      points: isCorrect ? 10 : 0,
    };
  },
};
export default AnswerChecker;