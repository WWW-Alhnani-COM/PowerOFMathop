import { rand } from '../mathHelpers'

const SubWithBorrow = {
  difficulty: 4,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      let a, b

      // نضمن وجود استلاف
      do {
        a = rand(20, 99)
        b = rand(10, a)
      } while (!hasBorrow(a, b))

      const result = a - b

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `${a} - ${b} = ؟`
            : `${a} - ${b} = ?`,

        correct_answer: String(result),

        operands: { a, b }
      })
    }

    return problems
  }
}

function hasBorrow(a, b) {
  const A = String(a).padStart(2, '0')
  const B = String(b).padStart(2, '0')

  for (let i = 1; i >= 0; i--) {
    if (Number(A[i]) < Number(B[i])) return true
  }
  return false
}

export default SubWithBorrow
