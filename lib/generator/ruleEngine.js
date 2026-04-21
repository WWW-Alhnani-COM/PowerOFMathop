import { createClient } from '@supabase/supabase-js'
import { getRuleLogic } from './rules.registry'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function generateByRule({
  rule_id,
  count = 20,
  language = 'ar',
  mode = 'practice'
}) {
  try {
    // 1) فقط تحقق من وجود rule في DB
    const { data: rule, error } = await supabase
      .from('rules')
      .select('*')
      .eq('rule_id', Number(rule_id))
      .single()

    if (error || !rule) {
      return { success: false, error: `Rule not found: ${rule_id}` }
    }

    // 2) جلب المنطق من ruleEngine (المهم)
    const RuleLogic = getRuleLogic(rule_id)

    if (!RuleLogic) {
      throw new Error(`RuleEngine missing rule: ${rule_id}`)
    }

    // 3) توليد الأسئلة
    const problems = RuleLogic.generate({
      count,
      language,
      difficulty: rule.difficulty_level || 1,
      rule
    })

    // 4) تجهيز البيانات
    const enriched = problems.map((p, i) => ({
      ...p,
      rule_id: Number(rule_id),
      sequence_number: i + 1,
      expected_time: rule.expected_time || 10,
      mode
    }))

    return {
      success: true,
      data: {
        rule_id: Number(rule_id),
        rule_name: rule.rule_name,
        total: enriched.length,
        mode,
        language,
        problems: enriched
      }
    }

  } catch (err) {
    return {
      success: false,
      error: err?.message || 'Unexpected error'
    }
  }
}
