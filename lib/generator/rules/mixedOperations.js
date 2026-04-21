import { rand } from '../mathHelpers'

const MixedOperations = {
  difficulty: 7,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const a = rand(20, 99)
      const b = rand(10, 50)
      const c = rand(1, b)

      const result = a + b - c

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `${a} + ${b} - ${c} = ؟`
            : `${a} + ${b} - ${c} = ?`,

        correct_answer: String(result),

        operands: { a, b, c }
      })
    }

    return problems
  }
}

export default MixedOperations
