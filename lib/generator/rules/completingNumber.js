import { rand } from '../mathHelpers'

const targets = [5, 10, 20]

const CompletingNumber = {
  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const target = targets[Math.floor(Math.random() * targets.length)]
      const a = rand(0, target)
      const b = target - a

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `كم نحتاج لإكمال ${a} إلى ${target}؟`
            : `How much to complete ${a} to ${target}?`,

        correct_answer: String(b),

        operands: { a, b, target }
      })
    }

    return problems
  }
}

export default CompletingNumber
