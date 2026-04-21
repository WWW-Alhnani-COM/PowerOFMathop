import { generateByRule } from './ruleEngine'

export async function generateSession({
  rule_id,
  mode = 'practice',
  language = 'ar'
}) {
  return await generateByRule({
    rule_id,
    mode,
    language
  })
}
