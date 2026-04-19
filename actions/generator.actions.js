
/**
 * توليد جلسة مسائل (Practice / Sheet)
 */'use server'

import { createClient } from '../lib/supabaseServer'

/**
 * توليد جلسة مسائل (Practice / Sheet)
 * مطابق 100% لقاعدة البيانات الحالية
 */
export async function generatePracticeSession({
  rule_id,
  mode = 'practice',
  language = 'ar',
  student_id = null,
  total = null,
}) {
  const supabase = createClient()

  try {
    const ruleId = Number(rule_id)
    if (!ruleId) {
      return { success: false, error: 'rule_id غير صحيح' }
    }

    const count = total ?? (mode === 'sheet' ? 350 : 20)

    // =====================================================
    // 1. جلب problem_types (مطابق للجدول الحقيقي)
    // =====================================================
    const { data: problemTypes, error } = await supabase
      .from('problem_types')
      .select(`
        problem_type_id,
        rule_id,
        template,
        parameters,
        difficulty_weight,
        expected_time
      `)
      .eq('rule_id', ruleId)
      .eq('is_active', true)

    if (error) return { success: false, error: error.message }

    if (!problemTypes || problemTypes.length === 0) {
      return {
        success: false,
        error: 'لا توجد problem_types لهذه القاعدة',
      }
    }

    // =====================================================
    // 2. تحليل أداء الطالب (performance_analytics مطابق 100%)
    // =====================================================
    let weaknessScore = 0
    let masteryLevel = 'beginner'

    if (student_id) {
      const { data: pa } = await supabase
        .from('performance_analytics')
        .select('weakness_score, mastery_level')
        .eq('student_id', student_id)
        .eq('rule_id', ruleId)
        .maybeSingle()

      weaknessScore = pa?.weakness_score ?? 0
      masteryLevel = pa?.mastery_level ?? 'beginner'
    }

    // =====================================================
    // 3. الأوزان الذكية (بدون تغيير منطقك)
    // =====================================================
    const masteryBias =
      masteryLevel === 'advanced'
        ? 1.25
        : masteryLevel === 'intermediate'
        ? 1
        : 0.85

    const weaknessBias =
      weaknessScore >= 70
        ? 0.85
        : weaknessScore >= 40
        ? 0.95
        : 1

    const weighted = problemTypes.map((pt) => ({
      ...pt,
      _w: Math.max(
        0.05,
        Number(pt.difficulty_weight || 1) * masteryBias * weaknessBias
      ),
    }))

    // =====================================================
    // 4. اختيار عشوائي بالوزن
    // =====================================================
    const pickWeighted = () => {
      const sum = weighted.reduce((a, b) => a + b._w, 0)

      let r = Math.random() * sum

      for (const item of weighted) {
        r -= item._w
        if (r <= 0) return item
      }

      return weighted[weighted.length - 1]
    }

    // =====================================================
    // 5. توليد الأسئلة (مطابق problem_types فقط)
    // =====================================================
    const problems = []

    for (let i = 0; i < count; i++) {
      const pt = pickWeighted()

      const generated = fallbackGenerateFromTemplate({
        template: pt.template,
        parametersJson: pt.parameters,
        language,
      })

      problems.push({
        problem_type_id: pt.problem_type_id,
        question: generated.question,
        correct_answer: generated.correct_answer,
        expected_time: pt.expected_time ?? 10,
        problem_data: generated.problem_data,
      })
    }

    return {
      success: true,
      data: {
        rule_id: ruleId,
        mode,
        language,
        total: count,
        problems,
      },
    }
  } catch (e) {
    console.error('generatePracticeSession error:', e)
    return { success: false, error: e.message }
  }
}

/* =====================================================
   Generator Engine (مطابق لقواعدك فقط)
===================================================== */
function fallbackGenerateFromTemplate({
  template,
  parametersJson,
  language,
}) {
  let params = {}

  try {
    params =
      typeof parametersJson === 'string'
        ? JSON.parse(parametersJson)
        : parametersJson || {}
  } catch {
    params = {}
  }

  const op = params.op || detectOp(template) || '+'

  const a = randInt(params?.a?.min ?? 1, params?.a?.max ?? 9)
  const b = randInt(params?.b?.min ?? 1, params?.b?.max ?? 9)

  let correct = 0

  switch (op) {
    case '+':
      correct = a + b
      break
    case '-':
      correct = a - b
      break
    case '×':
    case '*':
      correct = a * b
      break
    case '÷':
    case '/':
      correct = b === 0 ? 0 : Math.floor(a / b)
      break
    default:
      correct = a + b
  }

  const question = template
    .replaceAll('{a}', String(a))
    .replaceAll('{b}', String(b))
    .replaceAll('{op}', String(op))

  return {
    question,
    correct_answer: String(correct),
    problem_data: JSON.stringify({ a, b, op }),
  }
}

/* ===================================================== */
function detectOp(tpl = '') {
  if (tpl.includes('+')) return '+'
  if (tpl.includes('-')) return '-'
  if (tpl.includes('×')) return '×'
  if (tpl.includes('*')) return '*'
  if (tpl.includes('÷')) return '÷'
  if (tpl.includes('/')) return '/'
  return null
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
