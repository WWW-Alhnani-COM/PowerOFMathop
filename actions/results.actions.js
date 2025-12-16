'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ***************************************************************
// 6. نتائج الشيتات وتحليلها
// ***************************************************************

/**
 * جلب تفاصيل نتائج شيت معين.
 * @param {number} resultId - رقم تعريف نتيجة الشيت.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getSheetResults(resultId) {
  try {
    const sheetResult = await prisma.sheetResult.findUnique({
      where: { result_id: resultId, status: 'completed' },
      include: {
        student: { select: { student_name: true } },
        sheet: { select: { sheet_name: true, total_problems: true, required_score: true } },
        answerDetails: {
          select: { sequence_number: true, is_correct: true, time_spent: true, user_answer: true, correct_answer: true },
          orderBy: { sequence_number: 'asc' }
        }
      }
    })

    if (!sheetResult) {
      return { success: false, error: 'نتيجة الشيت غير موجودة أو لم تكتمل بعد.' }
    }

    return { success: true, data: sheetResult }
  } catch (error) {
    console.error('Get sheet results error:', error)
    return { success: false, error: 'فشل في جلب نتائج الشيت.' }
  }
}

/**
 * حساب إحصائيات مفصلة للشيت بناءً على AnswerDetails (للتكرار بعد EndSheetPractice).
 * (يجب أن يتم استدعاؤها في دالة EndSheetPractice)
 * @param {number} resultId - رقم تعريف نتيجة الشيت.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function calculateSheetStats(resultId) {
  try {
    const details = await prisma.answerDetail.findMany({
      where: { result_id: resultId }
    })

    const totalAnswers = details.length
    const totalCorrect = details.filter(d => d.is_correct).length
    const totalWrong = totalAnswers - totalCorrect
    const totalTime = details.reduce((sum, d) => sum + d.time_spent, 0)
    
    const accuracy = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0
    const speedRate = totalTime > 0 ? totalAnswers / totalTime : 0

    return { 
        success: true, 
        data: { totalAnswers, totalCorrect, totalWrong, totalTime, accuracy, speedRate } 
    }
  } catch (error) {
    console.error('Calculate sheet stats error:', error)
    return { success: false, error: 'فشل في حساب إحصائيات الشيت.' }
  }
}

/**
 * حفظ النتائج النهائية (يُفترض أنها جزء من EndSheetPractice).
 * (هذه الدالة تستخدم لتحديث حقول إضافية غير محسوبة في EndSheetPractice)
 * @param {number} resultId - رقم تعريف نتيجة الشيت.
 * @param {object} finalData - البيانات النهائية للحفظ.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function saveSheetResults(resultId, finalData) {
  try {
    const savedResult = await prisma.sheetResult.update({
      where: { result_id: resultId },
      data: { 
        end_time: new Date(), // تحديث إضافي لوقت الانتهاء
        // يمكن إضافة حقول إضافية من finalData
      }
    })
    
    revalidatePath(`/results/${resultId}`)
    
    return { success: true, data: savedResult }
  } catch (error) {
    console.error('Save sheet results error:', error)
    return { success: false, error: 'فشل في حفظ النتائج النهائية.' }
  }
}

/**
 * تحليل أداء الطالب على الشيت واستخراج أنماط الأخطاء (لتحديث PerformanceAnalytic).
 * @param {number} studentId - رقم تعريف الطالب.
 * @param {number} resultId - رقم تعريف نتيجة الشيت.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getPerformanceAnalysis(studentId, resultId) {
  try {
    const answerDetails = await prisma.answerDetail.findMany({
      where: { result_id: resultId, is_correct: false },
      select: { 
        problemType: { 
            select: { 
                rule_id: true, 
                rule: { select: { rule_name: true } } 
            } 
        } 
      }
    })

    const errorsByRule = answerDetails.reduce((acc, detail) => {
      const ruleId = detail.problemType.rule_id
      const ruleName = detail.problemType.rule.rule_name
      acc[ruleId] = acc[ruleId] || { ruleName, count: 0 }
      acc[ruleId].count++
      return acc
    }, {})
    
    // تحديث PerformanceAnalytic لكل قاعدة مخطئة (بشكل بسيط)
    const ruleIds = Object.keys(errorsByRule).map(id => parseInt(id))
    for (const ruleId of ruleIds) {
        await prisma.performanceAnalytic.upsert({
            where: { unique_student_rule: { student_id: studentId, rule_id: ruleId } },
            update: { 
                total_attempts: { increment: errorsByRule[ruleId].count },
                weakness_score: { increment: errorsByRule[ruleId].count * 0.5 } // زيادة الضعف
            },
            create: {
                student_id: studentId,
                rule_id: ruleId,
                total_attempts: errorsByRule[ruleId].count,
                weakness_score: errorsByRule[ruleId].count * 0.5
            }
        })
    }

    return { success: true, data: errorsByRule }
  } catch (error) {
    console.error('Get performance analysis error:', error)
    return { success: false, error: 'فشل في جلب وتحليل الأداء.' }
  }
}

/**
 * جلب توصيات الذكاء الاصطناعي للطالب (تحديث PerformanceAnalytic -> AiSuggestion).
 * @param {number} studentId - رقم تعريف الطالب.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getRecommendations(studentId) {
  try {
    // جلب القواعد ذات أعلى ضعف
    const weakRules = await prisma.performanceAnalytic.findMany({
      where: { student_id: studentId, weakness_score: { gt: 0 } },
      orderBy: { weakness_score: 'desc' },
      take: 3,
      include: { rule: { select: { rule_id: true, rule_name: true } } }
    })

    const suggestions = weakRules.map(wr => ({
      ruleId: wr.rule_id,
      ruleName: wr.rule.rule_name,
      reason: `ضعف في قاعدة ${wr.rule.rule_name} (نقاط الضعف: ${wr.weakness_score.toFixed(2)})`,
      priority: 5 - wr.mastery_level?.length || 1, // منطق افتراضي
    }))
    
    // حفظ التوصيات في AiSuggestion
    for (const suggestion of suggestions) {
        await prisma.aiSuggestion.upsert({
            where: { suggestion_id: 0 }, // استخدام منطق أكثر تعقيداً لتجنب التكرار
            update: {}, // عدم التحديث هنا
            create: {
                student_id: studentId,
                suggested_rule_id: suggestion.ruleId,
                reason: suggestion.reason,
                priority: suggestion.priority
            }
        })
    }
    
    return { success: true, data: suggestions }
  } catch (error) {
    console.error('Get recommendations error:', error)
    return { success: false, error: 'فشل في جلب التوصيات.' }
  }
}