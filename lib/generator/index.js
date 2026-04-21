// lib/generator/index.js

import { getRuleLogic } from './rules.registry'

export async function generateSession({
  rule_id,
  mode = 'practice',
  language = 'ar'
}) {
  const rule = getRuleLogic(Number(rule_id))

  const count = mode === 'sheet' ? 20 : 10

  const problems = rule.generate({
    count,
    language
  })

  return {
    rule_id,
    mode,
    language,
    total: problems.length,
    problems
  }
}
