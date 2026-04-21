import { rand } from '../mathHelpers'

const FriendsOfTwenty = {
  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const a = rand(0, 20)
      const b = 20 - a

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `أكمل: ${a} + ___ = 20`
            : `Complete: ${a} + ___ = 20`,

        correct_answer: String(b),

        operands: { a, b, sum: 20 }
      })
    }

    return problems
  }
}

export default FriendsOfTwenty
