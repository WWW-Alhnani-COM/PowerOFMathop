import { rand } from '../mathHelpers'

const MultiplicationTables = {
  difficulty: 5,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const table = rand(1, 10)
      const multiplier = rand(1, 10)

      const result = table * multiplier

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `${table} × ${multiplier} = ؟`
            : `${table} × ${multiplier} = ?`,

        correct_answer: String(result),

        operands: { table, multiplier }
      })
    }

    return problems
  }
}

export default MultiplicationTables
