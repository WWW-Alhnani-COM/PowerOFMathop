// actions/generator.actions.js
'use server';

import prisma from '@/lib/prisma';

/**
 * توليد مسائل بناءً على:
 * - rule_id
 * - mode (practice=20 | sheet=350)
 * - language (ar|en)
 * - student_id + rule weakness (اختياري/مستحسن)
 *
 * يرجع: problems[]
 */
export async function generatePracticeSession({
  rule_id,
  mode = 'practice',
  language = 'ar',
  student_id = null,
  total = null,
}) {
  try {
    const ruleId = Number(rule_id);
    if (!ruleId) return { success: false, error: 'rule_id غير صحيح' };

    const count = total ?? (mode === 'sheet' ? 350 : 20);

    // 1) جلب ProblemTypes للقاعدة
    const problemTypes = await prisma.problemType.findMany({
      where: { rule_id: ruleId, is_active: true },
      select: {
        problem_type_id: true,
        template: true,
        parameters: true,
        difficulty_weight: true,
        expected_time: true,
      },
    });

    if (!problemTypes.length) {
      return { success: false, error: 'لا توجد ProblemTypes مفعّلة لهذه القاعدة' };
    }

    // 2) (اختياري) قراءة ضعف الطالب من performance_analytics
    let weaknessScore = 0;
    let masteryLevel = 'beginner';

    if (student_id) {
      const pa = await prisma.performanceAnalytic.findUnique({
        where: { unique_student_rule: { student_id: Number(student_id), rule_id: ruleId } },
        select: { weakness_score: true, mastery_level: true },
      });
      weaknessScore = Number(pa?.weakness_score ?? 0);
      masteryLevel = pa?.mastery_level ?? 'beginner';
    }

    // 3) اختيار ذكي لأوزان الصعوبة (Difficulty scaling بسيط وفعّال)
    // - beginner: يميل للأسهل
    // - intermediate: متوازن
    // - advanced: يميل للأصعب
    // - weaknessScore أعلى => تقليل الصعوبة قليلًا لتثبيت الفهم (يمكن عكسها حسب فلسفتك)
    const masteryBias =
      masteryLevel === 'advanced' ? 1.25 : masteryLevel === 'intermediate' ? 1.0 : 0.85;

    const weaknessBias = weaknessScore >= 70 ? 0.85 : weaknessScore >= 40 ? 0.95 : 1.0;

    const weighted = problemTypes.map((pt) => {
      const w = Number(pt.difficulty_weight ?? 1);
      const finalW = Math.max(0.05, w * masteryBias * weaknessBias);
      return { ...pt, _w: finalW };
    });

    // 4) helper: سحب عنصر حسب وزن
    const pickWeighted = () => {
      const sum = weighted.reduce((a, b) => a + b._w, 0);
      let r = Math.random() * sum;
      for (const it of weighted) {
        r -= it._w;
        if (r <= 0) return it;
      }
      return weighted[weighted.length - 1];
    };

    // 5) توليد problem_data + question/correct_answer (مبدئيًا: template-driven)
    // ملاحظة: أنت عندك lib/generator (template.engine/parameters.engine)
    // لو موجودة عندك فعلاً، اربطها هنا بدل الـ fallback.
    const problems = [];
    for (let i = 0; i < count; i++) {
      const pt = pickWeighted();

      const generated = fallbackGenerateFromTemplate({
        template: pt.template,
        parametersJson: pt.parameters,
        language,
      });

      problems.push({
        problem_type_id: pt.problem_type_id,
        question: generated.question,
        correct_answer: generated.correct_answer,
        expected_time: pt.expected_time ?? 10,
        problem_data: generated.problem_data, // JSON string
      });
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
    };
  } catch (e) {
    console.error('generatePracticeSession error:', e);
    return { success: false, error: 'فشل توليد الجلسة' };
  }
}

/**
 * Fallback Generator (قابل للاستبدال بمحركك الحقيقي lib/generator)
 * - يدعم قوالب بسيطة مثل: "{a} + {b}" أو "{a} - {b}"
 * - parameters: JSON مثل:
 *   { "a": {"min":1,"max":9}, "b":{"min":1,"max":9}, "op":"+" }
 */
function fallbackGenerateFromTemplate({ template, parametersJson, language }) {
  let params = {};
  try {
    params = parametersJson ? JSON.parse(parametersJson) : {};
  } catch {
    params = {};
  }

  const op = params.op || detectOp(template) || '+';

  const a = randInt(params?.a?.min ?? 1, params?.a?.max ?? 9);
  const b = randInt(params?.b?.min ?? 1, params?.b?.max ?? 9);

  let correct = 0;
  if (op === '+') correct = a + b;
  else if (op === '-') correct = a - b;
  else if (op === '×' || op === '*' ) correct = a * b;
  else if (op === '÷' || op === '/') correct = b === 0 ? 0 : Math.floor(a / b);
  else correct = a + b;

  const q = template
    .replaceAll('{a}', String(a))
    .replaceAll('{b}', String(b))
    .replaceAll('{op}', String(op));

  const question =
    language === 'en'
      ? q
      : q; // هنا يمكنك لاحقًا ترجمة الصياغات النصية إن وجدت

  const problem_data = JSON.stringify({ a, b, op, template });

  return { question, correct_answer: String(correct), problem_data };
}

function detectOp(tpl = '') {
  if (tpl.includes('+')) return '+';
  if (tpl.includes('-')) return '-';
  if (tpl.includes('×')) return '×';
  if (tpl.includes('*')) return '*';
  if (tpl.includes('÷')) return '÷';
  if (tpl.includes('/')) return '/';
  return null;
}

function randInt(min, max) {
  const a = Number(min);
  const b = Number(max);
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
