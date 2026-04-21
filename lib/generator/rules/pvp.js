import { rand } from '../mathHelpers'

const PvP = {
  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const a = rand(1, 50)
      const b = rand(1, 50)

      const question =
        language === 'ar'
          ? `من الأسرع في الحل؟ ${a} + ${b} = ؟`
          : `Who is faster? ${a} + ${b} = ?`

      problems.push({
        sequence_number: i + 1,
        question,
        correct_answer: String(a + b),
        operands: { a, b }
      })
    }

    return problems
  }
}

export default PvP
