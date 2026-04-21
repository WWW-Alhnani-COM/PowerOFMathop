import { rand } from '../mathHelpers'

const Challenge = {
  generate({ count = 350, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const a = rand(1, 100)
      const b = rand(1, 100)
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
        operands: { a, b, op }
      })
    }

    return problems
  }
}

export default Challenge
