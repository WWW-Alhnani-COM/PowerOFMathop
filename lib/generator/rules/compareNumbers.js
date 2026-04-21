import { rand } from '../mathHelpers'

const CompareNumbers = {
  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const a = rand(0, 50)
      const b = rand(0, 50)

      let correct = '='
      if (a > b) correct = '>'
      else if (a < b) correct = '<'

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `ضع الرمز المناسب: ${a} ___ ${b}`
            : `Put the correct symbol: ${a} ___ ${b}`,

        correct_answer: correct,

        operands: { a, b }
      })
    }

    return problems
  }
}

export default CompareNumbers
