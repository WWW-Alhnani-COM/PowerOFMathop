import { rand } from '../mathHelpers'

const MultiplicationConcept = {
  difficulty: 5,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const a = rand(2, 10)
      const b = rand(2, 10)

      const result = a * b

      const repeated = Array.from({ length: b }, () => a)

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `احسب كجمع متكرر: ${a} + ${repeated.slice(1).join(' + ')} = ؟`
            : `Solve as repeated addition: ${repeated.join(' + ')} = ?`,

        correct_answer: String(result),

        operands: { a, b, repeated }
      })
    }

    return problems
  }
}

export default MultiplicationConcept
