'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ***************************************************************
// 4. إدارة القواعد واختيارها
// ***************************************************************

/**
 * جلب جميع القواعد التابعة لمستوى معين.
 * @param {number} levelId - رقم تعريف المستوى.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getRulesByLevel(levelId) {
  try {
    const rules = await prisma.levelRule.findMany({
      where: { level_id: levelId },
      orderBy: { order_in_level: 'asc' },
      include: {
        rule: {
          select: { rule_id: true, rule_name: true, description: true, icon: true }
        }
      }
    })

    const rulesData = rules.map(lr => lr.rule)
    return { success: true, data: rulesData }
  } catch (error) {
    console.error('Get rules by level error:', error)
    return { success: false, error: 'فشل في جلب القواعد حسب المستوى.' }
  }
}

/**
 * جلب تفاصيل قاعدة معينة.
 * @param {number} ruleId - رقم تعريف القاعدة.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getRuleDetails(ruleId) {
  try {
    const rule = await prisma.rule.findUnique({
      where: { rule_id: ruleId }
    })
    
    if (!rule) {
      return { success: false, error: 'القاعدة غير موجودة.' }
    }
    
    return { success: true, data: rule }
  } catch (error) {
    console.error('Get rule details error:', error)
    return { success: false, error: 'فشل في جلب تفاصيل القاعدة.' }
  }
}

/**
 * جلب أمثلة للقاعدة (يمكن أن تكون ProblemTypes أو بيانات وصفية).
 * هنا نفترض أنها ProblemTypes.
 * @param {number} ruleId - رقم تعريف القاعدة.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getRuleExamples(ruleId) {
  try {
    const examples = await prisma.problemType.findMany({
      where: { rule_id: ruleId, is_active: true },
      select: { template: true, parameters: true, difficulty_weight: true },
      take: 3 // جلب 3 أمثلة
    })
    
    return { success: true, data: examples }
  } catch (error) {
    console.error('Get rule examples error:', error)
    return { success: false, error: 'فشل في جلب أمثلة القاعدة.' }
  }
}

/**
 * جلب الشيتات المتاحة لهذه القاعدة.
 * @param {number} ruleId - رقم تعريف القاعدة.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getAvailableSheets(ruleId) {
  try {
    const sheets = await prisma.sheet.findMany({
      where: { rule_id: ruleId, is_active: true },
      select: { 
        sheet_id: true, 
        sheet_name: true, 
        total_problems: true, 
        time_limit: true, 
        difficulty_level: true 
      },
      orderBy: { difficulty_level: 'asc' }
    })
    
    return { success: true, data: sheets }
  } catch (error) {
    console.error('Get available sheets error:', error)
    return { success: false, error: 'فشل في جلب الشيتات المتاحة.' }
  }
}

/**
 * بدء تدريب على قاعدة معينة (افتراضياً: إنشاء SheetResult مبدئي).
 * (العملية الكاملة تتم في practice.actions)
 * @param {number} studentId - رقم تعريف الطالب.
 * @param {number} ruleId - رقم تعريف القاعدة.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function startRulePractice(studentId, ruleId) {
  try {
    // يمكن هنا اختيار شيت تلقائي لهذا الـ ruleId
    const defaultSheet = await prisma.sheet.findFirst({
      where: { rule_id: ruleId, is_active: true },
      orderBy: { difficulty_level: 'asc' }
    })

    if (!defaultSheet) {
        return { success: false, error: 'لا توجد شيتات متاحة لهذه القاعدة.' }
    }

    // إنشاء نتيجة شيت جديدة
    const newResult = await prisma.sheetResult.create({
      data: {
        student_id: studentId,
        sheet_id: defaultSheet.sheet_id,
        // start_time يُعيّن تلقائياً بواسطة @default(now())
        total_time_spent: defaultSheet.time_limit, // تعيين الحد الأقصى للوقت مبدئياً
        status: 'in_progress'
      }
    })

    revalidatePath('/practice')
    
    return { success: true, data: { resultId: newResult.result_id, sheetId: defaultSheet.sheet_id } }
  } catch (error) {
    console.error('Start rule practice error:', error)
    return { success: false, error: 'فشل في بدء التدريب على القاعدة.' }
  }
}