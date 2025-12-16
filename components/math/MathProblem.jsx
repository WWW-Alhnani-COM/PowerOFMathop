'use client'

import { useState, useEffect } from 'react'
import { Volume2, Repeat } from 'lucide-react'
import Button from '../ui/Button'
import { playSound } from '@/lib/sounds'

const MathProblem = ({
  problem,
  onAnswer,
  showResult = false,
  language = 'ar',
}) => {
  const [userAnswer, setUserAnswer] = useState('')
  const [isCorrect, setIsCorrect] = useState(null)
  const [showAnimation, setShowAnimation] = useState(false)

  const { num1, num2, operator, answer } = problem

  const handleSubmit = () => {
    const correct = parseInt(userAnswer) === answer
    setIsCorrect(correct)
    setShowAnimation(true)
    
    if (correct) {
      playSound('correct')
    } else {
      playSound('wrong')
    }

    onAnswer?.({
      userAnswer: parseInt(userAnswer),
      isCorrect: correct,
      problem
    })

    setTimeout(() => {
      setShowAnimation(false)
      setUserAnswer('')
      setIsCorrect(null)
    }, 1500)
  }

  const speakNumber = (number) => {
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(
      language === 'ar' ? 
        number.toLocaleString('ar-EG') : 
        number.toString()
    )
    synth.speak(utterance)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Problem Display */}
      <div className={`
        math-problem mb-8 relative
        ${showAnimation ? (isCorrect ? 'animate-correct' : 'animate-wrong') : ''}
        ${isCorrect ? 'ring-4 ring-math-success' : 
          isCorrect === false ? 'ring-4 ring-math-error' : ''}
      `}>
        {/* Numbers with individual styling */}
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="flex flex-col items-center">
            <NumberBubble 
              number={num1} 
              onClick={() => speakNumber(num1)}
            />
            <span className="text-sm mt-2 text-gray-600">العدد الأول</span>
          </div>

          <div className="text-5xl font-bold text-gray-700 mx-4">
            {operator === '+' ? '+' : operator === '-' ? '−' : '×'}
          </div>

          <div className="flex flex-col items-center">
            <NumberBubble 
              number={num2} 
              onClick={() => speakNumber(num2)}
            />
            <span className="text-sm mt-2 text-gray-600">العدد الثاني</span>
          </div>

          <div className="text-5xl font-bold text-gray-700 mx-4">=</div>

          {/* Answer Input */}
          <div className="flex flex-col items-center">
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className={`
                w-32 h-32
                text-5xl font-bold text-center
                border-4 rounded-2xl
                ${isCorrect === true ? 'border-math-success' : 
                  isCorrect === false ? 'border-math-error' : 
                  'border-math-primary'}
                focus:outline-none focus:ring-4 focus:ring-math-primary/30
                transition-all duration-300
              `}
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <span className="text-sm mt-2 text-gray-600">إجابتك</span>
          </div>
        </div>

        {/* Sound Controls */}
        <div className="absolute top-4 left-4 flex gap-2">
          <button
            onClick={() => speakNumber(num1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            title="تكبير الرقم الأول"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => speakNumber(num2)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            title="تكبير الرقم الثاني"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          variant={isCorrect === false ? "error" : "primary"}
          onClick={handleSubmit}
          disabled={!userAnswer}
          className="px-8"
        >
          {isCorrect === null ? 'تحقق من الإجابة' : 
           isCorrect ? '🎉 إجابة صحيحة!' : '❌ حاول مرة أخرى'}
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setUserAnswer('')
            setIsCorrect(null)
          }}
          icon={Repeat}
        >
          مسح
        </Button>
      </div>

      {/* Result Display */}
      {showResult && isCorrect !== null && (
        <div className={`
          mt-6 p-4 rounded-2xl text-center text-xl font-bold
          animate-pulse
          ${isCorrect ? 
            'bg-gradient-to-r from-green-100 to-emerald-100 text-math-success' : 
            'bg-gradient-to-r from-red-100 to-pink-100 text-math-error'}
        `}>
          {isCorrect ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🎉</span>
              <span>ممتاز! الإجابة صحيحة</span>
              <span className="text-2xl">👏</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">💡</span>
              <span>الإجابة الصحيحة هي: {answer}</span>
              <span className="text-2xl">👍</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const NumberBubble = ({ number, onClick }) => (
  <div
    className={`
      number-bubble cursor-pointer
      hover:scale-110 transition-transform duration-300
      active:scale-95
    `}
    onClick={onClick}
  >
    {number}
  </div>
)

export default MathProblem