// MathProblem.jsx
import ProblemDisplay from '@student/ProblemDisplay';
import NumberPad from '@student/NumberPad';
import Timer from '@student/Timer';
import ProblemGenerator from './ProblemGenerator'; // سيتم استخدامه

const MathProblem = ({ difficulty, rule, timeLimit, onCorrect, onWrong }) => {
  const [problem, setProblem] = useState(ProblemGenerator.generate(rule, difficulty));
  const [userInput, setUserInput] = useState('');
  
  const handleSubmit = () => {
    const isCorrect = problem.answer === Number(userInput);
    if (isCorrect) {
      onCorrect(problem);
    } else {
      onWrong(problem, userInput);
    }
    // الانتقال للمسألة التالية (في التطبيق الحقيقي)
    setUserInput('');
    setProblem(ProblemGenerator.generate(rule, difficulty));
  };

  return (
    <div className="flex flex-col items-center gap-8 p-6 bg-base-200 rounded-3xl shadow-inner">
      <Timer initialTime={timeLimit} direction="down" onTimeUp={onWrong} />
      <ProblemDisplay problem={problem} problemNumber={1} totalProblems={10} userInput={userInput} />
      <NumberPad 
        onNumberClick={(n) => setUserInput(prev => prev + n)}
        onDelete={() => setUserInput(prev => prev.slice(0, -1))}
        onClear={() => setUserInput('')}
        onSubmit={handleSubmit}
        disabled={false}
      />
    </div>
  );
};
export default MathProblem;