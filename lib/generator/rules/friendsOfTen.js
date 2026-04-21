// lib/generator/rules/friendsOfTen.js

import { rand, pairSum } from '../mathHelpers'

const FriendsOfTen = {
  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const [a, b] = pairSum(10)

      problems.push({
        sequence_number: i + 1,
        question: language === 'ar'
          ? `${a} + __ = 10`
          : `${a} + __ = 10`,
        correct_answer: String(b),
        operands: { a }
      })
    }

    return problems
  }
}

export default FriendsOfTen
