import { rand } from '../mathHelpers'

const MultiStep = {
  difficulty: 7,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const a = rand(10, 30)
      const b = rand(2, 10)
      const c = rand(1, 10)

      // خطوة 1: ضرب
      const step1 = a * b

      // خطوة 2: إضافة أو طرح
      const result = step1 + c

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `احسب: (${a} × ${b}) + ${c} = ؟`
            : `Calculate: (${a} × ${b}) + ${c} = ?`,

        correct_answer: String(result),

        operands: { a, b, c, step1 }
      })
    }

    return problems
  }
}

export default MultiStep
