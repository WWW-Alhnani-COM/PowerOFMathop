import { rand } from '../mathHelpers'

const Multiplication10_100 = {
  difficulty: 5,

  generate({ count = 10, language = 'ar' }) {
    const problems = []
    const factors = [10, 100]

    for (let i = 0; i < count; i++) {
      const num = rand(1, 99)
      const factor = factors[Math.floor(Math.random() * factors.length)]

      const result = num * factor

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `${num} × ${factor} = ؟`
            : `${num} × ${factor} = ?`,

        correct_answer: String(result),

        operands: { num, factor }
      })
    }

    return problems
  }
}

export default Multiplication10_100
