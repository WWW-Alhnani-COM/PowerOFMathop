import { rand } from '../mathHelpers'

const SubStrategies = {
  difficulty: 4,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const a = rand(20, 99)
      const b = rand(10, 99)

      const result = a - b

      const strategy = Math.random()

      let question

      if (strategy < 0.5) {
        question =
          language === 'ar'
            ? `احسب بطريقة التفكيك: ${a} - ${b}`
            : `Solve using decomposition: ${a} - ${b}`
      } else {
        question =
          language === 'ar'
            ? `احسب بطريقة التقريب: ${a} - ${b}`
            : `Solve using compensation: ${a} - ${b}`
      }

      problems.push({
        sequence_number: i + 1,
        question,
        correct_answer: String(result),
        operands: { a, b }
      })
    }

    return problems
  }
}

export default SubStrategies
