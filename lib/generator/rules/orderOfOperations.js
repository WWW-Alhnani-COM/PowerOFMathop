import { rand } from '../mathHelpers'

const OrderOfOperations = {
  difficulty: 7,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const a = rand(2, 10)
      const b = rand(2, 10)
      const c = rand(1, 20)

      // (a × b) + c
      const result = (a * b) + c

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `أوجد الناتج: ${a} × ${b} + ${c} = ؟`
            : `Solve: ${a} × ${b} + ${c} = ?`,

        correct_answer: String(result),

        operands: { a, b, c }
      })
    }

    return problems
  }
}

export default OrderOfOperations
