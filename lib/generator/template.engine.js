// lib/generator/template.engine.js

// قوالب باللغتين
const TEMPLATES_TRANSLATION = {
  'ar': {
    'plus': 'زائد',
    'minus': 'ناقص',
    'multiply': 'ضرب',
    'divide': 'قسمة',
    'equals': 'يساوي',
    'what': '؟'
  },
  'en': {
    'plus': 'plus',
    'minus': 'minus',
    'multiply': 'times',
    'divide': 'divided by',
    'equals': 'equals',
    'what': '?'
  }
};

function translateTemplate(template, language) {
  if (language === 'en') {
    // تحويل القالب العربي إلى إنجليزي
    return template
      .replace(/\+/g, ' plus ')
      .replace(/-/g, ' minus ')
      .replace(/×/g, ' times ')
      .replace(/÷/g, ' divided by ')
      .replace(/=/g, ' equals ')
      .replace(/؟/g, '?')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return template; // إرجاع القالب العربي كما هو
}

function calculateExpression(expression) {
  // استبدال الرموز العربية
  let cleanExpr = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/＋/g, '+')
  
  try {
    // حساب التعبير الرياضي بطريقة آمنة
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${cleanExpr})`)()
  } catch (error) {
    console.error('خطأ في الحساب:', expression)
    return 0
  }
}

export function buildProblem({
  template,
  operands,
  language = 'ar',
  index,
  problem_type_id,
  expected_time
}) {
  // ترجمة القالب حسب اللغة
  let translatedTemplate = translateTemplate(template, language)
  
  // استبدال المتغيرات في القالب
  let question = translatedTemplate
  Object.keys(operands).forEach(key => {
    const regex = new RegExp(`\\b${key.toUpperCase()}\\b`, 'g')
    question = question.replace(regex, operands[key])
  })

  // استخراج التعبير الرياضي
  let mathExpression = question
    .replace(/equals\s*\?/gi, '')  // إزالة equals ?
    .replace(/يساوي\s*\؟/gi, '')   // إزالة يساوي ؟
    .replace(/\s+/g, ' ')          // إزالة المسافات الزائدة
    .replace(/plus/gi, '+')
    .replace(/minus/gi, '-')
    .replace(/times/gi, '*')
    .replace(/divided by/gi, '/')
    .replace(/زائد/gi, '+')
    .replace(/ناقص/gi, '-')
    .replace(/ضرب/gi, '*')
    .replace(/قسمة/gi, '/')
  
  // حساب الإجابة الصحيحة
  const correct_answer = calculateExpression(mathExpression)

  return {
    sequence_number: index,
    problem_type_id,
    question,
    correct_answer: String(correct_answer),
    language,
    expected_time
  }
}