'use server'

import { prisma } from '@/lib/prisma'

// ***************************************************************
// 9. التقارير والتحليلات
// ***************************************************************

/**
 * جلب تقرير شامل للطالب لفترة زمنية محددة.
 * @param {number} studentId - رقم تعريف الطالب.
 * @param {string} period - الفترة الزمنية ('week', 'month', 'all').
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getStudentReport(studentId, period = 'month') {
  try {
    let startDate;
    const now = new Date();
    if (period === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    } else {
      startDate = new Date(0); // منذ البداية
    }

    const student = await prisma.student.findUnique({
      where: { student_id: studentId },
      select: { student_name: true, total_score: true, current_level_id: true }
    })
    
    if (!student) {
        return { success: false, error: 'الطالب غير موجود.' }
    }

    // جلب نتائج الشيتات في الفترة المحددة
    const sheetResults = await prisma.sheetResult.findMany({
      where: {
        student_id: studentId,
        created_at: { gte: startDate },
        status: 'completed'
      },
      select: { score: true, total_correct: true, total_wrong: true, total_time_spent: true }
    })
    
    // حساب المتوسطات
    const totalSheets = sheetResults.length
    const avgScore = totalSheets > 0 ? sheetResults.reduce((sum, r) => sum + (r.score || 0), 0) / totalSheets : 0
    const totalCorrect = sheetResults.reduce((sum, r) => sum + (r.total_correct || 0), 0)
    const totalWrong = sheetResults.reduce((sum, r) => sum + (r.total_wrong || 0), 0)
    const avgAccuracy = (totalCorrect + totalWrong) > 0 ? (totalCorrect / (totalCorrect + totalWrong)) * 100 : 0
    
    return {
      success: true,
      data: { 
          studentName: student.student_name,
          totalScore: student.total_score,
          period,
          totalSheets,
          avgScore: parseFloat(avgScore.toFixed(2)),
          avgAccuracy: parseFloat(avgAccuracy.toFixed(2))
      }
    }
  } catch (error) {
    console.error('Get student report error:', error)
    return { success: false, error: 'فشل في جلب تقرير الطالب.' }
  }
}

/**
 * تقرير مفصل عن تقدم الطالب في جميع القواعد والمستويات.
 * @param {number} studentId - رقم تعريف الطالب.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getProgressReport(studentId) {
  try {
    const progress = await prisma.performanceAnalytic.findMany({
      where: { student_id: studentId },
      include: {
        rule: { select: { rule_name: true, rule_id: true } }
      },
      orderBy: { mastery_level: 'asc' }
    })
    
    // يمكن تجميع البيانات حسب المستوى هنا أيضاً
    
    return { success: true, data: progress }
  } catch (error) {
    console.error('Get progress report error:', error)
    return { success: false, error: 'فشل في جلب تقرير التقدم.' }
  }
}

/**
 * تحليل أنماط الأخطاء الأكثر شيوعًا للطالب (حسب ProblemType/Rule).
 * @param {number} studentId - رقم تعريف الطالب.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getErrorPatterns(studentId) {
  try {
    const wrongAnswers = await prisma.answerDetail.findMany({
      where: {
        sheetResult: { student_id: studentId },
        is_correct: false,
        // استبعاد الإجابات المخطوطة
        user_answer: { not: 'SKIPPED' } 
      },
      select: { 
        problemType: { 
            select: { 
                rule_id: true, 
                rule: { select: { rule_name: true } },
                problem_type_id: true
            } 
        } 
      }
    })

    const errorCounts = wrongAnswers.reduce((acc, detail) => {
      const ruleId = detail.problemType.rule_id
      acc[ruleId] = acc[ruleId] || { ruleName: detail.problemType.rule.rule_name, count: 0 }
      acc[ruleId].count++
      return acc
    }, {})

    // تحويل الكائن إلى مصفوفة وفرزها
    const errorPatterns = Object.values(errorCounts).sort((a, b) => b.count - a.count)
    
    return { success: true, data: errorPatterns }
  } catch (error) {
    console.error('Get error patterns error:', error)
    return { success: false, error: 'فشل في جلب أنماط الأخطاء.' }
  }
}

/**
 * جلب جميع توصيات الذكاء الاصطناعي التي تم توليدها للطالب.
 * @param {number} studentId - رقم تعريف الطالب.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getAiRecommendations(studentId) {
  try {
    const recommendations = await prisma.aiSuggestion.findMany({
      where: { student_id: studentId },
      include: {
        suggestedRule: { select: { rule_name: true } },
        suggestedLevel: { select: { level_name: true } }
      },
      orderBy: [{ is_applied: 'asc' }, { priority: 'desc' }, { created_at: 'desc' }]
    })

    return { success: true, data: recommendations }
  } catch (error) {
    console.error('Get AI recommendations error:', error)
    return { success: false, error: 'فشل في جلب توصيات الذكاء الاصطناعي.' }
  }
}

/**
 * جلب تعليقات المشرفين (افتراض وجود جدول Comments).
 * (في هذا النموذج، هذه الدالة للواجهة الأمامية فقط، بدون تنفيذ DB).
 * @param {number} studentId - رقم تعريف الطالب.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getSupervisorComments(studentId) {
  try {
    // يجب وجود جدول SupervisorComment
    // const comments = await prisma.supervisorComment.findMany({ where: { student_id: studentId } })
    
    // محاكاة لعدم وجود جدول
    const comments = [
        { id: 1, text: "تقدم ممتاز في قواعد الجمع والطرح المركبة.", date: new Date() },
        { id: 2, text: "يجب التركيز على السرعة في المستوى الحالي.", date: new Date() },
    ]

    return { success: true, data: comments }
  } catch (error) {
    console.error('Get supervisor comments error:', error)
    return { success: false, error: 'فشل في جلب تعليقات المشرفين.' }
  }
}

/**
 * توليد تقرير دوري (ربع سنوي، نصف سنوي) شامل.
 * (محاكاة تجميع البيانات لتقرير PDF/Doc)
 * @param {number} studentId - رقم تعريف الطالب.
 * @param {string} periodType - نوع الفترة ('quarterly', 'biannual').
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function generatePeriodicReport(studentId, periodType) {
    try {
        const reportData = await getStudentReport(studentId, periodType === 'quarterly' ? '3month' : '6month');
        const progressData = await getProgressReport(studentId);
        const errorData = await getErrorPatterns(studentId);
        
        // تجميع وتنسيق البيانات لتقرير شامل
        const comprehensiveReport = {
            summary: reportData.data,
            detailedProgress: progressData.data,
            topErrorPatterns: errorData.data,
            generationDate: new Date(),
            periodType
        }

        // في تطبيق حقيقي: استدعاء خدمة لتوليد ملف PDF
        return { success: true, data: comprehensiveReport }
    } catch (error) {
        console.error('Generate periodic report error:', error)
        return { success: false, error: 'فشل في توليد التقرير الدوري.' }
    }
}