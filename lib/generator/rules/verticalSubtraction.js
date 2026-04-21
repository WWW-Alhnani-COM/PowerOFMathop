import { rand } from '../mathHelpers'

const VerticalSubtraction = {
  difficulty: 4,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      let a = rand(20, 99)
      let b = rand(10, a)

      const result = a - b

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `${a}\n- ${b}\n------`
            : `${a}\n- ${b}\n------`,

        correct_answer: String(result),

        operands: { a, b }
      })
    }

    return problems
  }
}

export default VerticalSubtraction
