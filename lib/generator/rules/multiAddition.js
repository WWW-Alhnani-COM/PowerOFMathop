import { rand } from '../mathHelpers'

const MultiAddition = {
  difficulty: 3,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const numbersCount = rand(3, 5)

      const numbers = Array.from({ length: numbersCount }, () =>
        rand(1, 20)
      )

      const sum = numbers.reduce((a, b) => a + b, 0)

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `${numbers.join(' + ')} = ؟`
            : `${numbers.join(' + ')} = ?`,

        correct_answer: String(sum),

        operands: { numbers }
      })
    }

    return problems
  }
}

export default MultiAddition
