import { rand } from '../mathHelpers'

const AddNoCarry = {
  difficulty: 3,

  generate({ count = 10, language = 'ar' }) {
    const problems = []

    for (let i = 0; i < count; i++) {
      let a, b

      // نضمن عدم وجود حمل (sum لكل خانة < 10)
      do {
        a = rand(10, 49)
        b = rand(10, 49)
      } while (hasCarry(a, b))

      const result = a + b

      problems.push({
        sequence_number: i + 1,

        question:
          language === 'ar'
            ? `${a} + ${b} = ؟`
            : `${a} + ${b} = ?`,

        correct_answer: String(result),

        operands: { a, b }
      })
    }

    return problems
  }
}

// يتحقق هل يوجد Carry في الجمع
function hasCarry(a, b) {
  const aStr = String(a).padStart(2, '0')
  const bStr = String(b).padStart(2, '0')

  for (let i = 1; i >= 0; i--) {
    if (Number(aStr[i]) + Number(bStr[i]) >= 10) {
      return true
    }
  }
  return false
}

export default AddNoCarry
