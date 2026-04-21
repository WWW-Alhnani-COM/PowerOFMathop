import { rand } from '../mathHelpers'

const WordProblems = {
  difficulty: 7,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const apples = rand(10, 50)
      const added = rand(5, 20)
      const eaten = rand(1, 10)

      const result = apples + added - eaten

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `لدى أحمد ${apples} تفاحة، اشترى ${added} وتناول ${eaten}. كم تبقى؟`
            : `Ahmed has ${apples} apples, buys ${added}, eats ${eaten}. How many left?`,

        correct_answer: String(result),

        operands: { apples, added, eaten }
      })
    }

    return problems
  }
}

export default WordProblems
