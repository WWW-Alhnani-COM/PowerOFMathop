import { rand } from '../mathHelpers'

const VerticalAddition = {
  difficulty: 3,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const a = rand(10, 99)
      const b = rand(10, 99)

      const result = a + b

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `${a}\n+ ${b}\n------`
            : `${a}\n+ ${b}\n------`,

        correct_answer: String(result),

        operands: { a, b }
      })
    }

    return problems
  }
}

export default VerticalAddition
