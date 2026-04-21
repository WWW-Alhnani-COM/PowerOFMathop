import { rand } from '../mathHelpers'

const Speed = {
  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const a = rand(1, 20)
      const b = rand(1, 20)
      const op = ['+', '-', '*'][rand(0, 2)]

      let question, answer

      if (op === '+') {
        question = language === 'ar'
          ? `${a} + ${b} = ؟`
          : `${a} + ${b} = ?`
        answer = a + b
      }

      if (op === '-') {
        const max = Math.max(a, b)
        const min = Math.min(a, b)
        question = language === 'ar'
          ? `${max} - ${min} = ؟`
          : `${max} - ${min} = ?`
        answer = max - min
      }

      if (op === '*') {
        question = language === 'ar'
          ? `${a} × ${b} = ؟`
          : `${a} × ${b} = ?`
        answer = a * b
      }

      problems.push({
        sequence_number: i + 1,
        question,
        correct_answer: String(answer),
        operands: { a, b, op }
      })
    }

    return problems
  }
}

export default Speed
