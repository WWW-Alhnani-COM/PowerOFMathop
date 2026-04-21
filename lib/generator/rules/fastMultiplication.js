import { rand } from '../mathHelpers'

const FastMultiplication = {
  difficulty: 5,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      // أرقام صغيرة لتدريب السرعة
      const a = rand(2, 12)
      const b = rand(2, 12)

      const result = a * b

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `احسب بسرعة: ${a} × ${b} = ؟`
            : `Quick solve: ${a} × ${b} = ?`,

        correct_answer: String(result),

        operands: { a, b }
      })
    }

    return problems
  }
}

export default FastMultiplication
