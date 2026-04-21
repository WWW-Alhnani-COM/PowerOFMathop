import { rand } from '../mathHelpers'

const NumbersRecognition = {
  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const num = rand(0, 10)

      problems.push({
        sequence_number: i + 1,
        question: language === 'ar'
          ? `ما هذا الرقم؟ ${num}`
          : `What is this number? ${num}?`,
        correct_answer: String(num),
        operands: { num }
      })
    }

    return problems
  }
}

export default NumbersRecognition
