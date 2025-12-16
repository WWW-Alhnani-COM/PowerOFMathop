// lib/generator/parameters.engine.js

export function generateOperands(parameters = {}) {
  const operands = {}

  // معالجة كل معلمة في الـ parameters
  for (const key of Object.keys(parameters)) {
    if (key.startsWith('min_')) {
      const operandName = key.replace('min_', '')
      const min = parameters[key]
      const max = parameters[`max_${operandName}`] || min
      
      // توليد قيمة عشوائية بين min و max
      operands[operandName] = Math.floor(
        Math.random() * (max - min + 1)
      ) + min
    }
  }

  // إذا لم يكن هناك معاملات، نستخدم قيم افتراضية
  if (Object.keys(operands).length === 0) {
    operands.A = Math.floor(Math.random() * 10) + 1
    operands.B = Math.floor(Math.random() * 10) + 1
  }

  return operands
}