export const LEVELS = [
  {
    id: 1,
    name: 'المستوى الأول',
    description: 'أساسيات الجمع والطرح',
    rules: [
      { id: 'basic-add', name: 'الجمع المباشر', icon: '➕' },
      { id: 'basic-sub', name: 'الطرح المباشر', icon: '➖' }
    ],
    sheets: 5,
    totalProblems: 1750
  },
  {
    id: 2,
    name: 'المستوى الثاني',
    description: 'أصدقاء الخمسة',
    rules: [
      { id: 'friends-5', name: 'أصدقاء الخمسة', icon: '🖐️' },
      { id: 'complement-5', name: 'تكملة الخمسة', icon: '🤝' }
    ],
    sheets: 6,
    totalProblems: 2100
  },
  {
    id: 3,
    name: 'المستوى الثالث',
    description: 'أصدقاء العشرة',
    rules: [
      { id: 'friends-10', name: 'أصدقاء العشرة', icon: '🔟' },
      { id: 'complement-10', name: 'تكملة العشرة', icon: '💯' }
    ],
    sheets: 8,
    totalProblems: 2800
  },
  {
    id: 4,
    name: 'المستوى الرابع',
    description: 'أصدقاء العشرين',
    rules: [
      { id: 'friends-20', name: 'أصدقاء العشرين', icon: '2️⃣0️⃣' },
      { id: 'complement-20', name: 'تكملة العشرين', icon: '🎯' }
    ],
    sheets: 10,
    totalProblems: 3500
  },
  {
    id: 5,
    name: 'المستوى الخامس',
    description: 'قاعدة العائلة',
    rules: [
      { id: 'family-rule', name: 'قاعدة العائلة', icon: '👨‍👩‍👧‍👦' },
      { id: 'family-advanced', name: 'العائلة المتقدمة', icon: '🌟' }
    ],
    sheets: 12,
    totalProblems: 4200
  },
  {
    id: 6,
    name: 'المستوى السادس',
    description: 'الجمع المتقدم',
    rules: [
      { id: 'advanced-add', name: 'الجمع المتقدم', icon: '🚀' },
      { id: 'add-strategies', name: 'استراتيجيات الجمع', icon: '🧠' }
    ],
    sheets: 15,
    totalProblems: 5250
  },
  {
    id: 7,
    name: 'المستوى السابع',
    description: 'الطرح المتقدم',
    rules: [
      { id: 'advanced-sub', name: 'الطرح المتقدم', icon: '⚡' },
      { id: 'sub-strategies', name: 'استراتيجيات الطرح', icon: '🎯' }
    ],
    sheets: 15,
    totalProblems: 5250
  },
  {
    id: 8,
    name: 'المستوى الثامن',
    description: 'التميز في الرياضيات',
    rules: [
      { id: 'mastery', name: 'مرحلة التميز', icon: '👑' },
      { id: 'challenge', name: 'التحديات المتقدمة', icon: '🏆' }
    ],
    sheets: 20,
    totalProblems: 7000
  }
]

export const MATH_OPERATORS = {
  ADD: '+',
  SUBTRACT: '-',
  MULTIPLY: '×'
}

export const SOUNDS = {
  CORRECT: '/sounds/correct.mp3',
  WRONG: '/sounds/wrong.mp3',
  CLICK: '/sounds/click.mp3',
  SUCCESS: '/sounds/success.mp3',
  COMPLETE: '/sounds/complete.mp3'
}

export const COLORS = {
  LEVELS: [
    '#4F46E5', '#8B5CF6', '#EC4899', '#F59E0B',
    '#10B981', '#3B82F6', '#EF4444', '#6366F1'
  ],
  RULES: [
    '#60A5FA', '#34D399', '#FBBF24', '#F472B6',
    '#C084FC', '#F97316', '#06B6D4', '#84CC16'
  ]
}

export const AI_RECOMMENDATIONS = [
  {
    condition: 'accuracy > 90',
    message: 'أداء ممتاز! 👏 أنت على الطريق الصحيح لتكون بطل الرياضيات.',
    suggestion: 'جرب مستوى أعلى أو قاعدة جديدة.'
  },
  {
    condition: 'accuracy > 70 && accuracy <= 90',
    message: 'عمل رائع! 👍 مستواك جيد جداً.',
    suggestion: 'ركز على المسائل التي تحتاج مزيد من التدريب.'
  },
  {
    condition: 'accuracy > 50 && accuracy <= 70',
    message: 'جيد، لكن هناك مجال للتحسين. 💪',
    suggestion: 'كرر التدريب على القواعد الأساسية.'
  },
  {
    condition: 'accuracy <= 50',
    message: 'لا تقلق، الجميع يبدأ من هنا! 🌟',
    suggestion: 'ارجع للمستوى السابق وكرر التدريبات.'
  }
]