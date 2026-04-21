import { rand } from '../mathHelpers'

const LongDivision = {
  difficulty: 6,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const divisor = rand(2, 9)
      const quotient = rand(10, 30)

      const dividend = divisor * quotient

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `اقسم باستخدام القسمة الطويلة:\n${dividend} ÷ ${divisor}`
            : `Solve using long division:\n${dividend} ÷ ${divisor}`,

        correct_answer: String(quotient),

        operands: { dividend, divisor }
      })
    }

    return problems
  }
}

export default LongDivision
