import { rand } from '../mathHelpers'

const CheckDivision = {
  difficulty: 6,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const divisor = rand(2, 10)
      const quotient = rand(2, 12)

      const dividend = divisor * quotient

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `تحقق من الإجابة: هل ${dividend} ÷ ${divisor} = ${quotient} صحيح؟`
            : `Check: is ${dividend} ÷ ${divisor} = ${quotient} correct?`,

        correct_answer: "true",

        operands: { dividend, divisor, quotient }
      })
    }

    return problems
  }
}

export default CheckDivision
