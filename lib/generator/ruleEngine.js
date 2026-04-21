import { createClient } from '@supabase/supabase-js'
import { getRuleLogic } from './rules.registry'

// =====================================================
// Supabase Client
// =====================================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * 🔥 توليد جلسة كاملة بناءً على rule_id
 */
export async function generateByRule({
  rule_id,
  count = 20,
  language = 'ar',
  mode = 'practice'
}) {
  // =====================================================
  // 1) جلب بيانات القاعدة من Supabase
  // =====================================================
  const { data: rule, error } = await supabase
    .from('level_rules')
    .select(`
      rule_id,
      rule_name,
      difficulty_level,
      level_id
    `)
    .eq('rule_id', Number(rule_id))
    .single()

  if (error || !rule) {
    throw new Error(`Rule not found: ${rule_id}`)
  }

  // =====================================================
  // 2) جلب منطق القاعدة (Rule Logic)
  // =====================================================
  const RuleLogic = getRuleLogic(rule_id)

  if (!RuleLogic || typeof RuleLogic.generate !== 'function') {
    throw new Error(`Rule logic missing for rule: ${rule_id}`)
  }

  // =====================================================
  // 3) توليد الأسئلة
  // =====================================================
  const problems = RuleLogic.generate({
    count,
    language,
    difficulty: rule.difficulty_level || 1,
    rule
  })

  // =====================================================
  // 4) إضافة metadata موحد
  // =====================================================
  const enriched = problems.map((p, i) => ({
    ...p,
    rule_id: Number(rule_id),
    sequence_number: i + 1,
    expected_time: rule.expected_time || 10,
    mode
  }))

  // =====================================================
  // 5) النتيجة النهائية
  // =====================================================
  return {
    rule_id: Number(rule_id),
    rule_name: rule.rule_name,
    total: enriched.length,
    mode,
    language,
    problems: enriched
  }
}
