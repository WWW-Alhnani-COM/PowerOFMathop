import { rand } from '../mathHelpers'

const FriendsOfFive = {
  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const a = rand(0, 5)
      const b = 5 - a

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `أكمل: ${a} + ___ = 5`
            : `Complete: ${a} + ___ = 5`,

        correct_answer: String(b),

        operands: { a, b, sum: 5 }
      })
    }

    return problems
  }
}

export default FriendsOfFive
