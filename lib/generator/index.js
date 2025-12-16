// lib/generator/index.js
import { prisma } from '@/lib/prisma'
import { generateOperands } from './parameters.engine'
import { buildProblem } from './template.engine'

export async function generateSession({
  rule_id,
  mode = 'practice',
  language = 'ar'
}) {
  // جلب أنواع المسائل من قاعدة البيانات
  const problemTypes = await prisma.problemType.findMany({
    where: {
      rule_id: parseInt(rule_id),
      is_active: true
    }
  })

  if (!problemTypes.length) {
    throw new Error('لا توجد أنواع مسائل لهذه القاعدة')
  }

  // تحديد عدد المسائل بناءً على النوع
  const count = mode === 'sheet' ? 350 : 20
  const problems = []

  // توليد كل مسألة
  for (let i = 0; i < count; i++) {
    // اختيار نوع مسألة عشوائي
    const randomIndex = Math.floor(Math.random() * problemTypes.length)
    const problemType = problemTypes[randomIndex]
    
    // تحويل parameters من JSON
    const params = problemType.parameters 
      ? JSON.parse(problemType.parameters)
      : {}
    
    // توليد القيم
    const operands = generateOperands(params)
    
    // بناء المسألة مع اللغة المحددة
    const problem = buildProblem({
      template: problemType.template,
      operands: operands,
      language: language, // ✅ إضافة اللغة هنا
      index: i + 1,
      problem_type_id: problemType.problem_type_id,
      expected_time: problemType.expected_time || 10
    })
    
    problems.push(problem)
  }

  return {
    mode,
    language,
    total: problems.length,
    problems
  }
}