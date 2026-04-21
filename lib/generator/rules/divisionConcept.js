import { rand } from '../mathHelpers'

const DivisionConcept = {
  difficulty: 6,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const divisor = rand(2, 10)
      const quotient = rand(2, 10)

      const dividend = divisor * quotient

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `${dividend} ÷ ${divisor} = ؟`
            : `${dividend} ÷ ${divisor} = ?`,

        correct_answer: String(quotient),

        operands: { dividend, divisor, quotient }
      })
    }

    return problems
  }
}

export default DivisionConcept
