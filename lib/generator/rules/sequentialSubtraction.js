import { rand } from '../mathHelpers'

const SequentialSubtraction = {
  difficulty: 4,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const start = rand(50, 150)
      const stepsCount = rand(2, 4)

      const steps = Array.from({ length: stepsCount }, () =>
        rand(1, 20)
      )

      const result = steps.reduce((acc, val) => acc - val, start)

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `${start} - ${steps.join(' - ')} = ؟`
            : `${start} - ${steps.join(' - ')} = ?`,

        correct_answer: String(result),

        operands: { start, steps }
      })
    }

    return problems
  }
}

export default SequentialSubtraction
