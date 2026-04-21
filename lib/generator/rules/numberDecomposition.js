import { rand } from '../mathHelpers'

const NumberDecomposition = {
  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const num = rand(2, 20)

      const a = rand(1, num - 1)
      const b = num - a

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `فكك العدد ${num}: ${num} = ___ + ___`
            : `Decompose ${num}: ${num} = ___ + ___`,

        correct_answer: `${a},${b}`,

        operands: { num, a, b }
      })
    }

    return problems
  }
}

export default NumberDecomposition
