import { rand } from '../mathHelpers'

const BasicSubtraction = {
  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const a = rand(1, 9)
      const b = rand(1, a) // لضمان عدم ظهور نتائج سالبة

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `${a} - ${b} = ؟`
            : `${a} - ${b} = ?`,

        correct_answer: String(a - b),

        operands: { a, b, operator: '-' }
      })
    }

    return problems
  }
}

export default BasicSubtraction
