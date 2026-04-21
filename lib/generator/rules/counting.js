import { rand } from '../mathHelpers'

const Counting = {
  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      const start = rand(0, 20)
      const step = rand(1, 3)
      const direction = Math.random() > 0.5 ? 'up' : 'down'

      let sequence = []

      for (let j = 0; j < 5; j++) {
        if (direction === 'up') {
          sequence.push(start + j * step)
        } else {
          sequence.push(start - j * step)
        }
      }

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `أكمل النمط: ${sequence.slice(0, 3).join(' , ')}, __ , __`
            : `Complete the pattern: ${sequence.slice(0, 3).join(', ')}, __ , __`,

        correct_answer: sequence.slice(3).join(','),

        operands: {
          start,
          step,
          direction,
          sequence
        }
      })
    }

    return problems
  }
}

export default Counting
