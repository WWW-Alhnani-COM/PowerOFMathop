import { rand } from '../mathHelpers'

const Improvement = {
  generate({ count = 10, difficulty = 1, language = 'ar' }) {
    const problems = []

    const max = difficulty * 20

    for (let i = 0; i < count; i++) {
      const a = rand(1, max)
      const b = rand(1, max)

      const op = ['+', '-', '*'][rand(0, 2)]

      let question, answer

      if (op === '+') {
        question = `${a} + ${b} = ؟`
        answer = a + b
      }

      if (op === '-') {
        question = `${a} - ${b} = ؟`
        answer = a - b
      }

      if (op === '*') {
        question = `${a} × ${b} = ؟`
        answer = a * b
      }

      problems.push({
        sequence_number: i + 1,
        question,
        correct_answer: String(answer),
        operands: { a, b, op, difficulty }
      })
    }

    return problems
  }
}

export default Improvement
