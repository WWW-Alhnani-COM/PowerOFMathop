'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  getChallengeDetails, 
  startChallenge, 
  submitChallengeAnswer,
  completeChallenge
} from '@/actions/challenge.actions'
import { getCurrentStudent } from '@/actions/auth.actions'
import { getProblemsForSheet } from '@/actions/sheet.actions'

// أنواع المسائل
const PROBLEM_TYPES = {
  ADDITION: 'addition',
  SUBTRACTION: 'subtraction',
  MULTIPLICATION: 'multiplication',
  DIVISION: 'division',
  FRACTION: 'fraction',
  DECIMAL: 'decimal',
  EQUATION: 'equation'
}

export default function ChallengePlayPage() {
  const params = useParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [challenge, setChallenge] = useState(null)
  const [currentStudent, setCurrentStudent] = useState(null)
  const [currentProblem, setCurrentProblem] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [results, setResults] = useState({
    correct: 0,
    wrong: 0,
    skipped: 0,
    score: 0,
    totalTime: 0
  })
  const [isStarted, setIsStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [problemsList, setProblemsList] = useState([])
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)

  const timerRef = useRef(null)

  // --------------------------------------------------
  // تحميل البيانات الأولية
  // --------------------------------------------------
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        const studentResult = await getCurrentStudent()
        if (!studentResult.success) {
          router.push('/login')
          return
        }
        setCurrentStudent(studentResult.data)
        
        const challengeId = parseInt(params?.id, 10)
        if (isNaN(challengeId)) {
          setError('معرف التحدي غير صالح')
          return
        }
        
        const challengeResult = await getChallengeDetails(challengeId)
        if (!challengeResult.success) {
          setError(challengeResult.error)
          return
        }
        
        setChallenge(challengeResult.data)
        
        if (challengeResult.data.status === 'pending') {
          router.push(`/challenge/${challengeId}`)
          return
        }
        
        if (challengeResult.data.status === 'accepted') {
          const startResult = await startChallenge(challengeId)
          if (!startResult.success) {
            setError(startResult.error)
            return
          }

          const startedChallenge = startResult.data || challengeResult.data
          setChallenge(startedChallenge)
          setIsStarted(true)
          setTimeLeft(startedChallenge.time_limit || 600)

          await loadProblems(startedChallenge.sheet?.sheet_id)
          return
        }
        
        if (challengeResult.data.status === 'in_progress') {
          setIsStarted(true)
          
          const startTime = new Date(challengeResult.data.start_time).getTime()
          const timeLimitMs = (challengeResult.data.time_limit || 600) * 1000
          const remaining = Math.max(timeLimitMs - (Date.now() - startTime), 0)
          setTimeLeft(Math.floor(remaining / 1000))
          
          await loadProblems(challengeResult.data.sheet?.sheet_id)
          return
        }
        
        if (challengeResult.data.status === 'completed') {
          setIsCompleted(true)
        }
        
      } catch (err) {
        console.error('❌ خطأ في تحميل البيانات:', err)
        setError('حدث خطأ غير متوقع في تحميل الصفحة')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [params?.id, router])

  // --------------------------------------------------
  // جلب المسائل
  // --------------------------------------------------
  const loadProblems = async (sheetId) => {
    if (!sheetId) return
    
    try {
      const problemsResult = await getProblemsForSheet(sheetId)
      if (problemsResult.success && problemsResult.data) {
        setProblemsList(problemsResult.data)

        if (problemsResult.data.length > 0) {
          generateProblemFromList(problemsResult.data)
        } else {
          generateDefaultProblem()
        }
      } else {
        generateDefaultProblem()
      }
    } catch (err) {
      console.error('❌ خطأ في جلب المسائل:', err)
      generateDefaultProblem()
    }
  }

  // توليد مسألة من القائمة
  // دالة توليد رقم بين min و max
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// توليد مسألة من القائمة
const generateProblemFromList = (problems) => {
  if (!problems || problems.length === 0) {
    generateDefaultProblem()
    return
  }

  // اختيار المسألة الحالية حسب الفهرس
  const problemData = problems[currentProblemIndex % problems.length]

  try {
    // تحليل بيانات المسألة
    const parsedParams = typeof problemData.parameters === 'string'
      ? JSON.parse(problemData.parameters)
      : problemData.parameters || {}

    // تحديد العملية
    let operation = parsedParams.operation || 'addition'

    // توليد القيم X و Y من الحدود
    const x = randomBetween(parsedParams.min_x || 1, parsedParams.max_x || 10)
    const y = randomBetween(parsedParams.min_y || 1, parsedParams.max_y || 10)

    // حساب الإجابة الصحيحة
    let correctAnswer = 0

    switch (operation) {
      case 'addition':
        correctAnswer = x + y
        break

      case 'subtraction':
        // ضمان عدم ظهور أرقام سالبة إذا أردت
        correctAnswer = x - y
        break

      case 'multiplication':
        correctAnswer = x * y
        break

      case 'division':
        correctAnswer = y !== 0 ? (x / y) : 0
        break

      default:
        correctAnswer = x + y
    }

    // استبدال X و Y داخل قالب السؤال
    let question = problemData.template || 'X + Y = ?'

    question = question.replace(/X/g, x).replace(/Y/g, y)

    // بناء المسألة النهائية
    const problem = {
      problem_id: problemData.problem_type_id,
      type: operation,
      question: question,
      correctAnswer: correctAnswer.toString(),
      data: {
        ...parsedParams,
        x,
        y,
        operation
      },
      template: problemData.template
    }

    // حفظ المسألة الحالية
    setCurrentProblem(problem)
    setUserAnswer('')

    // التحرك للسؤال التالي
    setCurrentProblemIndex(prev => prev + 1)

  } catch (err) {
    console.error('❌ خطأ في معالجة المسألة:', err)
    generateDefaultProblem()
  }
}

  const getProblemTypeFromTemplate = (template) => {
    if (!template) return PROBLEM_TYPES.ADDITION
    
    const s = template.toLowerCase()
    if (s.includes('+') || s.includes('جمع')) return PROBLEM_TYPES.ADDITION
    if (s.includes('-') || s.includes('طرح')) return PROBLEM_TYPES.SUBTRACTION
    if (s.includes('×') || s.includes('*') || s.includes('ضرب')) return PROBLEM_TYPES.MULTIPLICATION
    if (s.includes('÷') || s.includes('/') || s.includes('قسمة')) return PROBLEM_TYPES.DIVISION
    
    return PROBLEM_TYPES.ADDITION
  }

  const generateDefaultProblem = () => {
    if (!challenge?.sheet?.rule) return null
    
    const ruleName = challenge.sheet.rule.rule_name?.toLowerCase() || 'addition'
    let problem
    
    switch (ruleName) {
      case 'addition':
      case 'الجمع': {
        const n1 = Math.floor(Math.random() * 100) + 1
        const n2 = Math.floor(Math.random() * 100) + 1
        problem = {
          type: PROBLEM_TYPES.ADDITION,
          question: `${n1} + ${n2} = ?`,
          correctAnswer: (n1 + n2).toString(),
          data: { num1: n1, num2: n2, operation: 'addition' }
        }
        break
      }
      case 'subtraction':
      case 'الطرح': {
        const a = Math.floor(Math.random() * 100) + 1
        const b = Math.floor(Math.random() * a) + 1
        problem = {
          type: PROBLEM_TYPES.SUBTRACTION,
          question: `${a} - ${b} = ?`,
          correctAnswer: (a - b).toString(),
          data: { num1: a, num2: b, operation: 'subtraction' }
        }
        break
      }
      case 'multiplication':
      case 'الضرب': {
        const a = Math.floor(Math.random() * 12) + 1
        const b = Math.floor(Math.random() * 12) + 1
        problem = {
          type: PROBLEM_TYPES.MULTIPLICATION,
          question: `${a} × ${b} = ?`,
          correctAnswer: (a * b).toString(),
          data: { num1: a, num2: b, operation: 'multiplication' }
        }
        break
      }
      case 'division':
      case 'القسمة': {
        const divisor = Math.floor(Math.random() * 10) + 2
        const q = Math.floor(Math.random() * 10) + 1
        const dividend = divisor * q
        problem = {
          type: PROBLEM_TYPES.DIVISION,
          question: `${dividend} ÷ ${divisor} = ?`,
          correctAnswer: q.toString(),
          data: { dividend, divisor, operation: 'division' }
        }
        break
      }
      default: {
        const a = Math.floor(Math.random() * 50) + 1
        const b = Math.floor(Math.random() * 50) + 1
        problem = {
          type: PROBLEM_TYPES.ADDITION,
          question: `${a} + ${b} = ?`,
          correctAnswer: (a + b).toString(),
          data: { num1: a, num2: b, operation: 'addition' }
        }
      }
    }
    
    setCurrentProblem(problem)
    setUserAnswer('')
    
    return problem
  }

  const generateQuestionFromData = (data) => {
    const { num1, num2, operation } = data || {}
    switch (operation) {
      case 'addition': return `${num1} + ${num2} = ?`
      case 'subtraction': return `${num1} - ${num2} = ?`
      case 'multiplication': return `${num1} × ${num2} = ?`
      case 'division': return `${num1} ÷ ${num2} = ?`
      default: return `${num1 || 0} + ${num2 || 0} = ?`
    }
  }

  const calculateAnswer = (data) => {
    const { num1, num2, operation } = data || {}
    switch (operation) {
      case 'addition': return (num1 + num2).toString()
      case 'subtraction': return (num1 - num2).toString()
      case 'multiplication': return (num1 * num2).toString()
      case 'division': return (num1 / num2).toString()
      default: return (num1 + num2).toString()
    }
  }
  // --------------------------------------------------
  // مؤقت العد التنازلي
  // --------------------------------------------------
  useEffect(() => {
    if (!isStarted || isCompleted || timeLeft <= 0) return
    
    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          timerRef.current = null
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isStarted, isCompleted, timeLeft])

  // --------------------------------------------------
  // بدء التحدي
  // --------------------------------------------------
  const handleStartChallenge = async () => {
    try {
      if (!challenge) return
      setLoading(true)

      const result = await startChallenge(challenge.challenge_id)
      if (result.success) {
        const newChallenge = result.data || challenge
        setChallenge(newChallenge)
        setIsStarted(true)
        setTimeLeft(newChallenge.time_limit || challenge.time_limit || 600)
        
        await loadProblems(newChallenge.sheet?.sheet_id || challenge.sheet?.sheet_id)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('❌ خطأ في بدء التحدي:', err)
      setError('حدث خطأ في بدء التحدي')
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------------
  // إرسال الإجابة
  // --------------------------------------------------
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || !currentProblem || !challenge) return
    
    try {
      const isCorrect = userAnswer.trim() === currentProblem.correctAnswer.toString().trim()
      
      setResults(prev => ({
        ...prev,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        wrong: !isCorrect ? prev.wrong + 1 : prev.wrong,
        score: isCorrect ? prev.score + 10 : Math.max(prev.score - 2, 0),
        totalTime: prev.totalTime + 1
      }))
      
      if (challenge.status === 'in_progress') {
        await submitChallengeAnswer({
          challenge_id: challenge.challenge_id,
          problem_data: currentProblem.data,
          user_answer: userAnswer.trim(),
          correct_answer: currentProblem.correctAnswer.toString(),
          time_spent: 1,
          is_correct: isCorrect
        })
      }
      
      if (isCorrect) {
        setSuccess('🎉 إجابة صحيحة! +10 نقاط')
        setError('')
      } else {
        setError(`❌ إجابة خاطئة. الجواب الصحيح: ${currentProblem.correctAnswer}`)
        setSuccess('')
      }
      
      setTimeout(() => {
        setSuccess('')
        setError('')
        
        if (problemsList.length > 0) {
          generateProblemFromList(problemsList)
        } else {
          generateDefaultProblem()
        }
      }, 1200)
      
    } catch (err) {
      console.error('❌ خطأ في إرسال الإجابة:', err)
      setError('حدث خطأ في إرسال الإجابة')
    }
  }

  // --------------------------------------------------
  // تخطي السؤال
  // --------------------------------------------------
  const handleSkip = () => {
    if (!currentProblem) return

    setResults(prev => ({
      ...prev,
      skipped: prev.skipped + 1,
      score: Math.max(prev.score - 5, 0)
    }))
    
    setError(`⚠️ تم تخطي السؤال. الجواب الصحيح: ${currentProblem.correctAnswer}`)
    setSuccess('')
    
    setTimeout(() => {
      setError('')
      if (problemsList.length > 0) {
        generateProblemFromList(problemsList)
      } else {
        generateDefaultProblem()
      }
    }, 1200)
  }

  // --------------------------------------------------
  // انتهاء الوقت
  // --------------------------------------------------
  const handleTimeUp = async () => {
    if (!challenge || isCompleted) return

    setIsCompleted(true)
    
    if (timerRef.current) clearInterval(timerRef.current)
    
    try {
      const result = await completeChallenge(challenge.challenge_id, results)
      if (!result.success) setError(result.error)
    } catch (err) {
      console.error('❌ خطأ في إكمال التحدي:', err)
    }
  }

  const handleFinishEarly = async () => {
    if (!challenge || isCompleted) return
    if (!confirm('هل أنت متأكد من إنهاء التحدي الآن؟')) return
    
    setIsCompleted(true)
    if (timerRef.current) clearInterval(timerRef.current)
    
    try {
      const result = await completeChallenge(challenge.challenge_id, results)
      if (!result.success) setError(result.error)
    } catch (err) {
      console.error('❌ خطأ في إنهاء التحدي:', err)
    }
  }

  const handleBackToChallenge = () => {
    router.push(`/challenge/${challenge?.challenge_id || ''}`)
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  // --------------------------------------------------
  // شاشة التحميل
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">⚡</div>
          <p className="text-xl text-gray-700">جاري تحضير التحدي...</p>
        </div>
      </div>
    )
  }

  // --------------------------------------------------
  // شاشة الخطأ
  // --------------------------------------------------
  if (error && !isStarted && !isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">حدث خطأ</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={handleBackToChallenge}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white w-full"
          >
            العودة للتحدي
          </button>
        </div>
      </div>
    )
  }

  // --------------------------------------------------
  // شاشة قبل البدء
  // --------------------------------------------------
  if (!isStarted && !isCompleted && challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-center mb-4">
            {challenge?.sheet?.sheet_name || 'تحدي جديد'}
          </h1>
          <p className="text-gray-600 text-center mb-6">
            القاعدة: {challenge?.sheet?.rule?.rule_name || 'غير محدد'}
          </p>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-blue-50 rounded-xl text-center shadow">
              <div className="text-2xl font-bold text-blue-600">
                {challenge?.sheet?.total_problems || 10}
              </div>
              <p className="text-gray-600">عدد الأسئلة</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-xl text-center shadow">
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor((challenge?.time_limit || 600) / 60)} دقيقة
              </div>
              <p className="text-gray-600">مدة التحدي</p>
            </div>

            <div className="p-4 bg-green-50 rounded-xl text-center shadow">
              <div className="text-2xl font-bold text-green-600">
                {challenge?.sheet?.required_score || 70}%
              </div>
              <p className="text-gray-600">درجة النجاح</p>
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={handleStartChallenge}
              className="px-10 py-4 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg"
            >
              🚀 ابدأ التحدي
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --------------------------------------------------
  // شاشة أثناء التحدي
  // --------------------------------------------------
  if (isStarted && !isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6">

          {/* شريط علوي */}
          <div className="flex justify-between mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {formatTime(timeLeft)}
              </div>
              <p className="text-gray-600 text-sm">الوقت المتبقي</p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {results.score}
              </div>
              <p className="text-gray-600 text-sm">النقاط</p>
            </div>

            <button
              onClick={handleFinishEarly}
              className="px-6 py-2 bg-red-500 text-white rounded-xl shadow hover:bg-red-600"
            >
              إنهاء التحدي
            </button>
          </div>

          {/* السؤال */}
          <div className="text-center text-5xl font-bold text-gray-800 mb-8">
            {currentProblem?.question || 'جاري تحميل السؤال...'}
          </div>

          {/* الإدخال */}
          <div className="max-w-md mx-auto mb-6">
            <input 
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value.replace(/[^0-9.-]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
              className="w-full text-center text-3xl border-2 p-4 rounded-xl"
              placeholder="أدخل الإجابة..."
              autoFocus
            />
          </div>

          {/* رسائل */}
          {success && <div className="p-4 bg-green-100 text-green-700 mb-4 rounded-xl">{success}</div>}
          {error && <div className="p-4 bg-red-100 text-red-700 mb-4 rounded-xl">{error}</div>}

          {/* أزرار */}
          <div className="flex justify-center gap-6">
            <button 
              onClick={handleSubmitAnswer}
              className="px-6 py-3 bg-green-500 text-white rounded-xl shadow hover:bg-green-600"
            >
              تأكيد الإجابة
            </button>

            <button 
              onClick={handleSkip}
              className="px-6 py-3 bg-yellow-500 text-white rounded-xl shadow hover:bg-yellow-600"
            >
              تخطي السؤال
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --------------------------------------------------
  // شاشة النتائج
  // --------------------------------------------------
  if (isCompleted && challenge) {
    const total = results.correct + results.wrong + results.skipped
    const accuracy = total > 0 ? Math.round((results.correct / total) * 100) : 0
    const passed = accuracy >= (challenge?.sheet?.required_score || 70)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">

          <div className="text-center mb-6">
            <div className="text-6xl mb-4">
              {passed ? '🏆' : '💪'}
            </div>
            <h1 className="text-3xl font-bold">
              {passed ? 'مبروك! لقد نجحت' : 'حاول مرة أخرى'}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-green-50 rounded-xl text-center shadow">
              <div className="text-4xl font-bold text-green-600">{accuracy}%</div>
              <p className="text-gray-600">الدقة</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl text-center shadow">
              <div className="text-4xl font-bold text-purple-600">{results.score}</div>
              <p className="text-gray-600">النقاط</p>
            </div>
          </div>

          <button
            onClick={() => router.push(`/challenge/${challenge.challenge_id}`)}
            className="w-full py-3 bg-blue-600 text-white rounded-xl shadow text-lg mb-4"
          >
            عرض تفاصيل التحدي
          </button>

          <button
            onClick={() => router.push('/challenge')}
            className="w-full py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl shadow text-lg"
          >
            العودة للتحديات
          </button>

        </div>
      </div>
    )
  }

  return null
}
