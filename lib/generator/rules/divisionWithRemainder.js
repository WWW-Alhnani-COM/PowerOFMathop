import { rand } from '../mathHelpers'

const DivisionWithRemainder = {
  difficulty: 6,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const divisor = rand(2, 10)
      const quotient = rand(2, 10)
      const remainder = rand(1, divisor - 1)

      const dividend = divisor * quotient + remainder

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `${dividend} ÷ ${divisor} = ؟ (مع باقي)`
            : `${dividend} ÷ ${divisor} = ? (with remainder)`,

        correct_answer: `${quotient} r ${remainder}`,

        operands: { dividend, divisor, quotient, remainder }
      })
    }

    return problems
  }
}

export default DivisionWithRemainder
