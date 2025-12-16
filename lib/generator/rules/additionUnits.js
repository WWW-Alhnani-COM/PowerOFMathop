const AdditionUnits = {
  difficulty: 1,
  expected_time: 8,

  generateOperands() {
    return {
      x: rand(1, 9),
      y: rand(1, 9)
    }
  },

  solve({ x, y }) {
    return x + y
  },

  buildTemplate({ x, y }, lang) {
    return lang === 'ar'
      ? `${x} + ${y} = ؟`
      : `${x} + ${y} = ?`
  }
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default AdditionUnits
