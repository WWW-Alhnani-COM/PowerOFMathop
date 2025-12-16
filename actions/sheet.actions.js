// actions/sheet.actions.js
'use server'

import { prisma } from '@/lib/prisma'
import { validateSession } from './auth.actions'

// ============================================
// 1. جلب معلومات الورقة
// ============================================
export async function getSheetInfo(sheetId) {
  try {
    const sheet = await prisma.sheet.findUnique({
      where: {
        sheet_id: parseInt(sheetId)
      },
      include: {
        level: {
          select: {
            level_name: true,
            color: true,
            icon: true
          }
        },
        rule: {
          select: {
            rule_name: true,
            description: true,
            icon: true
          }
        }
      }
    })

    if (!sheet) {
      return {
        success: false,
        error: 'الورقة غير موجودة'
      }
    }

    return {
      success: true,
      data: sheet
    }

  } catch (error) {
    console.error('خطأ في جلب معلومات الورقة:', error)
    return {
      success: false,
      error: error.message || 'فشل جلب معلومات الورقة'
    }
  }
}

// ============================================
// 2. جلب أوراق التمارين للطالب
// ============================================
export async function getStudentSheets(studentId) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: parseInt(studentId) },
      select: { current_level_id: true }
    })

    if (!student) {
      return {
        success: false,
        error: 'الطالب غير موجود'
      }
    }

    const sheets = await prisma.sheet.findMany({
      where: {
        level_id: student.current_level_id,
        is_active: true
      },
      include: {
        rule: {
          select: {
            rule_name: true,
            icon: true
          }
        },
        level: {
          select: {
            level_name: true,
            color: true
          }
        },
        _count: {
          select: {
            sheetResults: {
              where: {
                student_id: parseInt(studentId),
                status: 'completed'
              }
            }
          }
        }
      },
      orderBy: {
        difficulty_level: 'asc'
      }
    })

    // إضافة حالة التمرين للطالب
    const sheetsWithStatus = await Promise.all(
      sheets.map(async (sheet) => {
        const latestResult = await prisma.sheetResult.findFirst({
          where: {
            student_id: parseInt(studentId),
            sheet_id: sheet.sheet_id
          },
          orderBy: {
            created_at: 'desc'
          },
          select: {
            status: true,
            score: true,
            created_at: true
          }
        })

        return {
          ...sheet,
          student_status: latestResult?.status || 'not_started',
          last_score: latestResult?.score || 0,
          last_attempt: latestResult?.created_at || null,
          attempts_count: sheet._count.sheetResults
        }
      })
    )

    return {
      success: true,
      data: sheetsWithStatus
    }

  } catch (error) {
    console.error('خطأ في جلب أوراق الطالب:', error)
    return {
      success: false,
      error: error.message || 'فشل جلب أوراق التمارين'
    }
  }
}

// ============================================
// 3. جلب نتائج الطالب في ورقة محددة
// ============================================
export async function getStudentSheetResults(studentId, sheetIds) {
  try {
    if (!Array.isArray(sheetIds)) {
      sheetIds = [sheetIds]
    }

    const results = await prisma.sheetResult.findMany({
      where: {
        student_id: parseInt(studentId),
        sheet_id: {
          in: sheetIds.map(id => parseInt(id))
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return {
      success: true,
      data: results
    }

  } catch (error) {
    console.error('خطأ في جلب نتائج الطالب:', error)
    return {
      success: false,
      error: error.message || 'فشل جلب النتائج'
    }
  }
}

// ============================================
// 4. بدء ورقة جديدة (إنشاء SheetResult)
// ============================================
export async function startNewSheet({
  student_id,
  sheet_id
}) {
  try {
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    // التحقق من وجود الورقة
    const sheet = await prisma.sheet.findUnique({
      where: { sheet_id: parseInt(sheet_id) },
      select: { total_problems: true }
    })

    if (!sheet) {
      return {
        success: false,
        error: 'الورقة غير موجودة'
      }
    }

    // إنشاء نتيجة جديدة
    const sheetResult = await prisma.sheetResult.create({
      data: {
        student_id: parseInt(student_id),
        sheet_id: parseInt(sheet_id),
        start_time: new Date(),
        status: 'in_progress',
        total_correct: 0,
        total_wrong: 0,
        score: 0,
        accuracy: 0
      }
    })

    return {
      success: true,
      data: {
        result_id: sheetResult.result_id,
        sheet_id: sheetResult.sheet_id,
        student_id: sheetResult.student_id,
        start_time: sheetResult.start_time,
        total_problems: sheet.total_problems || 0
      }
    }

  } catch (error) {
    console.error('خطأ في بدء ورقة جديدة:', error)
    return {
      success: false,
      error: error.message || 'فشل بدء الورقة'
    }
  }
}

// ============================================
// 5. حفظ نتيجة الورقة (الانتهاء)
// ============================================
export async function saveSheetResult({
  student_id,
  sheet_id,
  result_id,
  problems = [],
  total_time,
  start_time,
  end_time
}) {
  try {
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    // حساب النتائج
    const correctCount = problems.filter(p => p.is_correct).length
    const totalCount = problems.length
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
    const accuracy = score

    // تحديث نتيجة الورقة
    const updatedResult = await prisma.sheetResult.update({
      where: {
        result_id: parseInt(result_id),
        student_id: parseInt(student_id),
        sheet_id: parseInt(sheet_id)
      },
      data: {
        end_time: new Date(end_time),
        total_correct: correctCount,
        total_wrong: totalCount - correctCount,
        total_time_spent: Math.floor(total_time),
        score: score,
        accuracy: accuracy,
        status: score >= 70 ? 'completed' : 'failed'
      }
    })

    // حفظ تفاصيل الإجابات
    if (problems.length > 0) {
      await prisma.answerDetail.createMany({
        data: problems.map(problem => ({
          result_id: parseInt(result_id),
          problem_type_id: problem.problem_type_id,
          problem_data: JSON.stringify({
            question: problem.question,
            operands: problem.operands || {},
            correct_answer: problem.correct_answer,
            expected_time: problem.expected_time
          }),
          user_answer: problem.user_answer || '',
          correct_answer: problem.correct_answer || '',
          time_spent: problem.time_spent || 0,
          is_correct: problem.is_correct || false,
          sequence_number: problem.sequence_number || 0
        }))
      })
    }

    // تحديث إحصائيات الطالب
    await updateStudentStats({
      student_id: parseInt(student_id),
      correct_count: correctCount,
      wrong_count: totalCount - correctCount,
      time_spent: Math.floor(total_time),
      score: score
    })

    // تحديث تحليل الأداء
    await updatePerformanceAnalytics({
      student_id: parseInt(student_id),
      sheet_id: parseInt(sheet_id),
      correct_count: correctCount,
      total_count: totalCount,
      time_spent: Math.floor(total_time)
    })

    return {
      success: true,
      data: {
        result_id: updatedResult.result_id,
        score: updatedResult.score,
        status: updatedResult.status,
        correct_count: updatedResult.total_correct,
        total_count: updatedResult.total_correct + updatedResult.total_wrong,
        time_spent: updatedResult.total_time_spent
      }
    }

  } catch (error) {
    console.error('خطأ في حفظ نتيجة الورقة:', error)
    return {
      success: false,
      error: error.message || 'فشل حفظ النتيجة'
    }
  }
}

// ============================================
// 6. تحديث إحصائيات الطالب (دالة مساعدة)
// ============================================
async function updateStudentStats({
  student_id,
  correct_count,
  wrong_count,
  time_spent,
  score
}) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: parseInt(student_id) }
    })

    if (!student) return

    // حساب المتتالية الحالية
    let currentStreak = student.current_streak || 0
    if (score >= 70) {
      currentStreak += 1
    } else {
      currentStreak = 0
    }

    // تحديث الطالب
    await prisma.student.update({
      where: { student_id: parseInt(student_id) },
      data: {
        total_score: { increment: score },
        total_correct_answers: { increment: correct_count },
        total_wrong_answers: { increment: wrong_count },
        total_time_spent: { increment: time_spent },
        current_streak: currentStreak,
        best_streak: Math.max(student.best_streak || 0, currentStreak),
        updated_at: new Date()
      }
    })

  } catch (error) {
    console.error('خطأ في تحديث إحصائيات الطالب:', error)
  }
}

// ============================================
// 7. تحديث تحليل الأداء (دالة مساعدة)
// ============================================
async function updatePerformanceAnalytics({
  student_id,
  sheet_id,
  correct_count,
  total_count,
  time_spent
}) {
  try {
    // جلب rule_id من الورقة
    const sheet = await prisma.sheet.findUnique({
      where: { sheet_id: parseInt(sheet_id) },
      select: { rule_id: true }
    })

    if (!sheet || !sheet.rule_id) return

    const ruleId = sheet.rule_id
    const success = correct_count / total_count >= 0.7 // 70% نجاح

    // البحث عن تحليل سابق
    const existingAnalytic = await prisma.performanceAnalytic.findUnique({
      where: {
        student_id_rule_id: {
          student_id: parseInt(student_id),
          rule_id: ruleId
        }
      }
    })

    if (existingAnalytic) {
      // تحديث التحليل الحالي
      const newTotalAttempts = existingAnalytic.total_attempts + 1
      const newCorrectAttempts = existingAnalytic.correct_attempts + (success ? 1 : 0)
      
      await prisma.performanceAnalytic.update({
        where: {
          student_id_rule_id: {
            student_id: parseInt(student_id),
            rule_id: ruleId
          }
        },
        data: {
          total_attempts: newTotalAttempts,
          correct_attempts: newCorrectAttempts,
          average_time: calculateNewAverage(
            existingAnalytic.average_time,
            existingAnalytic.total_attempts,
            time_spent
          ),
          weakness_score: calculateWeaknessScore(
            correct_count,
            total_count,
            existingAnalytic.weakness_score
          ),
          last_practiced: new Date(),
          mastery_level: calculateMasteryLevel(newCorrectAttempts / newTotalAttempts),
          updated_at: new Date()
        }
      })
    } else {
      // إنشاء تحليل جديد
      await prisma.performanceAnalytic.create({
        data: {
          student_id: parseInt(student_id),
          rule_id: ruleId,
          total_attempts: 1,
          correct_attempts: success ? 1 : 0,
          average_time: time_spent,
          weakness_score: calculateWeaknessScore(correct_count, total_count, 0),
          last_practiced: new Date(),
          mastery_level: success ? 'beginner' : 'needs_practice'
        }
      })
    }

  } catch (error) {
    console.error('خطأ في تحديث تحليل الأداء:', error)
  }
}

// ============================================
// 8. دوال مساعدة للحسابات
// ============================================

// حساب المتوسط الجديد
function calculateNewAverage(oldAverage, oldCount, newValue) {
  if (!oldAverage) return newValue
  return (oldAverage * oldCount + newValue) / (oldCount + 1)
}

// حساب نقاط الضعف
function calculateWeaknessScore(correctCount, totalCount, oldScore) {
  if (totalCount === 0) return oldScore
  
  const accuracy = correctCount / totalCount
  const newScore = 1 - accuracy // 0 = ممتاز, 1 = ضعيف
  
  // متوسط مرجح مع الدرجة القديمة
  return oldScore ? (oldScore * 0.7 + newScore * 0.3) : newScore
}

// حساب مستوى الإتقان
function calculateMasteryLevel(successRate) {
  if (successRate >= 0.9) return 'master'
  if (successRate >= 0.7) return 'advanced'
  if (successRate >= 0.5) return 'intermediate'
  if (successRate >= 0.3) return 'beginner'
  return 'needs_practice'
}

// ============================================
// 9. جلب نتائج مفصلة لورقة
// ============================================
export async function getSheetResultDetails(resultId) {
  try {
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    const result = await prisma.sheetResult.findUnique({
      where: {
        result_id: parseInt(resultId)
      },
      include: {
        sheet: {
          include: {
            rule: true,
            level: true
          }
        },
        answerDetails: {
          orderBy: {
            sequence_number: 'asc'
          }
        }
      }
    })

    if (!result) {
      return {
        success: false,
        error: 'النتيجة غير موجودة'
      }
    }

    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('خطأ في جلب تفاصيل النتيجة:', error)
    return {
      success: false,
      error: error.message || 'فشل جلب التفاصيل'
    }
  }
}

// ============================================
// 10. جلب تاريخ التمارين للطالب
// ============================================
export async function getStudentPracticeHistory(studentId, limit = 20) {
  try {
    const history = await prisma.sheetResult.findMany({
      where: {
        student_id: parseInt(studentId)
      },
      include: {
        sheet: {
          include: {
            rule: {
              select: {
                rule_name: true,
                icon: true
              }
            },
            level: {
              select: {
                level_name: true,
                color: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit
    })

    return {
      success: true,
      data: history
    }

  } catch (error) {
    console.error('خطأ في جلب تاريخ التمارين:', error)
    return {
      success: false,
      error: error.message || 'فشل جلب التاريخ'
    }
  }
}

// ============================================
// 11. جلب أفضل النتائج
// ============================================
export async function getTopSheetResults(sheetId, limit = 10) {
  try {
    const topResults = await prisma.sheetResult.findMany({
      where: {
        sheet_id: parseInt(sheetId),
        status: 'completed'
      },
      include: {
        student: {
          select: {
            student_name: true
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { total_time_spent: 'asc' }
      ],
      take: limit
    })

    return {
      success: true,
      data: topResults
    }

  } catch (error) {
    console.error('خطأ في جلب أفضل النتائج:', error)
    return {
      success: false,
      error: error.message || 'فشل جلب أفضل النتائج'
    }
  }
}

// ============================================
// 12. إعادة محاولة ورقة
// ============================================
export async function retrySheet(resultId) {
  try {
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    const oldResult = await prisma.sheetResult.findUnique({
      where: {
        result_id: parseInt(resultId)
      },
      include: {
        sheet: true
      }
    })

    if (!oldResult) {
      return {
        success: false,
        error: 'النتيجة الأصلية غير موجودة'
      }
    }

    // إنشاء نتيجة جديدة
    const newResult = await prisma.sheetResult.create({
      data: {
        student_id: oldResult.student_id,
        sheet_id: oldResult.sheet_id,
        start_time: new Date(),
        status: 'in_progress',
        total_correct: 0,
        total_wrong: 0,
        score: 0,
        accuracy: 0
      }
    })

    return {
      success: true,
      data: {
        new_result_id: newResult.result_id,
        sheet_id: newResult.sheet_id,
        student_id: newResult.student_id,
        total_problems: oldResult.sheet.total_problems || 0
      }
    }

  } catch (error) {
    console.error('خطأ في إعادة المحاولة:', error)
    return {
      success: false,
      error: error.message || 'فشل إعادة المحاولة'
    }
  }
}

// ============================================
// 13. حذف نتيجة (للمسؤول فقط)
// ============================================
export async function deleteSheetResult(resultId) {
  try {
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    // التحقق من الصلاحيات (يمكن إضافة منطق للمسؤولين)
    
    await prisma.answerDetail.deleteMany({
      where: {
        result_id: parseInt(resultId)
      }
    })

    await prisma.sheetResult.delete({
      where: {
        result_id: parseInt(resultId)
      }
    })

    return {
      success: true,
      message: 'تم حذف النتيجة بنجاح'
    }

  } catch (error) {
    console.error('خطأ في حذف النتيجة:', error)
    return {
      success: false,
      error: error.message || 'فشل حذف النتيجة'
    }
  }
}

// ============================================
// 14. تصدير النتائج (PDF/Excel)
// ============================================
export async function exportSheetResults(studentId, format = 'json') {
  try {
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    const results = await prisma.sheetResult.findMany({
      where: {
        student_id: parseInt(studentId)
      },
      include: {
        sheet: {
          include: {
            rule: true,
            level: true
          }
        },
        answerDetails: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    if (format === 'json') {
      return {
        success: true,
        data: results,
        format: 'json'
      }
    }

    // هنا يمكن إضافة منطق لتصدير PDF أو Excel
    return {
      success: false,
      error: 'التنسيق غير مدعوم حالياً'
    }

  } catch (error) {
    console.error('خطأ في تصدير النتائج:', error)
    return {
      success: false,
      error: error.message || 'فشل تصدير النتائج'
    }
  }
}

// ============================================
// 15. جلب إحصائيات الشيت
// ============================================
export async function getSheetStatistics(sheetId) {
  try {
    const statistics = await prisma.sheetResult.groupBy({
      by: ['status'],
      where: {
        sheet_id: parseInt(sheetId)
      },
      _count: true,
      _avg: {
        score: true,
        total_time_spent: true,
        accuracy: true
      }
    })

    const totalAttempts = statistics.reduce((sum, stat) => sum + stat._count, 0)
    const completedAttempts = statistics.find(s => s.status === 'completed')?._count || 0
    const averageScore = statistics.reduce((sum, stat) => sum + (stat._avg.score || 0) * stat._count, 0) / totalAttempts

    return {
      success: true,
      data: {
        total_attempts: totalAttempts,
        completed_attempts: completedAttempts,
        completion_rate: totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0,
        average_score: Math.round(averageScore) || 0,
        statistics_by_status: statistics
      }
    }

  } catch (error) {
    console.error('خطأ في جلب إحصائيات الشيت:', error)
    return {
      success: false,
      error: error.message || 'فشل جلب الإحصائيات'
    }
  }
}

// ============================================
// 16. جلب إحصائيات تقدم الطالب في قاعدة
// ============================================
export async function getStudentProgressInRule(studentId, ruleId) {
  try {
    const progress = await prisma.performanceAnalytic.findUnique({
      where: {
        student_id_rule_id: {
          student_id: parseInt(studentId),
          rule_id: parseInt(ruleId)
        }
      }
    })

    if (!progress) {
      return {
        success: true,
        data: {
          total_attempts: 0,
          correct_attempts: 0,
          mastery_level: 'not_started',
          weakness_score: 0
        }
      }
    }

    return {
      success: true,
      data: progress
    }

  } catch (error) {
    console.error('خطأ في جلب تقدم الطالب:', error)
    return {
      success: false,
      error: error.message || 'فشل جلب التقدم'
    }
  }
}

// ============================================
// 17. جلب أفضل 5 نتائج للطالب
// ============================================
export async function getStudentBestResults(studentId, limit = 5) {
  try {
    const bestResults = await prisma.sheetResult.findMany({
      where: {
        student_id: parseInt(studentId),
        status: 'completed'
      },
      include: {
        sheet: {
          include: {
            rule: {
              select: {
                rule_name: true
              }
            }
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { total_time_spent: 'asc' }
      ],
      take: limit
    })

    return {
      success: true,
      data: bestResults
    }

  } catch (error) {
    console.error('خطأ في جلب أفضل النتائج:', error)
    return {
      success: false,
      error: error.message || 'فشل جلب أفضل النتائج'
    }
  }
}

// ============================================
// 18. التحقق مما إذا كان الطالب قد أكمل الورقة
// ============================================
export async function hasStudentCompletedSheet(studentId, sheetId) {
  try {
    const completedResult = await prisma.sheetResult.findFirst({
      where: {
        student_id: parseInt(studentId),
        sheet_id: parseInt(sheetId),
        status: 'completed'
      },
      select: {
        result_id: true,
        score: true,
        created_at: true
      }
    })

    return {
      success: true,
      data: {
        completed: !!completedResult,
        result: completedResult
      }
    }

  } catch (error) {
    console.error('خطأ في التحقق من إكمال الورقة:', error)
    return {
      success: false,
      error: error.message || 'فشل التحقق'
    }
  }
}

// ============================================
// 19. جلب أوراق مقترحة بناءً على أداء الطالب
// ============================================
export async function getSuggestedSheets(studentId, limit = 3) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: parseInt(studentId) },
      select: { current_level_id: true }
    })

    if (!student) {
      return {
        success: false,
        error: 'الطالب غير موجود'
      }
    }

    // جلب القواعد التي يحتاج الطالب لتحسينها
    const weakRules = await prisma.performanceAnalytic.findMany({
      where: {
        student_id: parseInt(studentId),
        weakness_score: { gt: 0.5 }
      },
      orderBy: {
        weakness_score: 'desc'
      },
      take: 2
    })

    let suggestedSheets = []

    if (weakRules.length > 0) {
      // اقتراح أوراق للقواعد الضعيفة
      for (const rule of weakRules) {
        const sheets = await prisma.sheet.findMany({
          where: {
            rule_id: rule.rule_id,
            level_id: student.current_level_id,
            is_active: true,
            difficulty_level: { lte: 2 } // أوراق سهلة
          },
          take: 2
        })
        suggestedSheets.push(...sheets)
      }
    }

    // إذا لم توجد قواعد ضعيفة، اقترح أوراق عشوائية
    if (suggestedSheets.length === 0) {
      suggestedSheets = await prisma.sheet.findMany({
        where: {
          level_id: student.current_level_id,
          is_active: true
        },
        take: limit
      })
    }

    return {
      success: true,
      data: suggestedSheets.slice(0, limit)
    }

  } catch (error) {
    console.error('خطأ في جلب الأوراق المقترحة:', error)
    return {
      success: false,
      error: error.message || 'فشل جلب المقترحات'
    }
  }
}
// أضف هذه الدالة في ملف actions/sheet.actions.js (قبل نهاية الملف)

// ============================================
// 20. جلب تقدم الطالب في القاعدة
// ============================================
// في actions/sheet.actions.js - تحديث الدالة
export async function getStudentSheetsProgress(studentId, ruleId) {
  try {
    const ruleExists = await prisma.rule.findUnique({
      where: { rule_id: parseInt(ruleId) }
    });

    if (!ruleExists) {
      return {
        success: false,
        error: 'القاعدة غير موجودة'
      };
    }

    // ✅ التغيير الجوهري: حتى لو لم توجد أوراق، نسمح بالتدريب
    // لأن النظام سيولد تمارين تلقائياً
    
    const sheets = await prisma.sheet.findMany({
      where: {
        rule_id: parseInt(ruleId),
        is_active: true
      },
      include: {
        level: { select: { level_name: true, color: true } },
        rule: { select: { rule_name: true, icon: true } }
      },
      orderBy: [{ difficulty_level: 'asc' }, { sheet_id: 'asc' }]
    });

    // ✅ جلب نتائج الطالب
    const sheetIds = sheets.map(sheet => sheet.sheet_id);
    const results = await prisma.sheetResult.findMany({
      where: {
        student_id: parseInt(studentId),
        sheet_id: { in: sheetIds }
      },
      select: {
        sheet_id: true,
        status: true,
        score: true,
        total_time_spent: true,
        created_at: true
      }
    });

    // ✅ حساب التقدم
    let totalSheets = sheets.length;
    let completedSheets = 0;
    let totalPoints = 0;

    sheets.forEach(sheet => {
      const result = results.find(r => r.sheet_id === sheet.sheet_id);
      if (result?.status === 'completed') {
        completedSheets++;
        totalPoints += result.score || 0;
      }
    });

    // ✅ التحقق من وجود أنواع مسائل (للتوليد التلقائي)
    const hasProblemTypes = await prisma.problemType.count({
      where: {
        rule_id: parseInt(ruleId),
        is_active: true
      }
    }) > 0;

    return {
      success: true,
      data: {
        totalSheets,
        completedSheets,
        progressPercentage: totalSheets > 0 ? Math.round((completedSheets / totalSheets) * 100) : 0,
        totalPoints,
        averageScore: completedSheets > 0 ? Math.round(totalPoints / completedSheets) : 0,
        hasSheets: totalSheets > 0,
        canPractice: hasProblemTypes, // ✅ يمكن التدريب إذا كان هناك أنواع مسائل
        hasProblemTypes,
        ruleInfo: ruleExists,
        sheets: sheets.map(sheet => ({
          ...sheet,
          result: results.find(r => r.sheet_id === sheet.sheet_id) || null
        }))
      }
    };

  } catch (error) {
    console.error('خطأ في جلب تقدم الطالب:', error);
    return {
      success: true, // ✅ نرجع success حتى مع الخطأ
      data: {
        totalSheets: 0,
        completedSheets: 0,
        progressPercentage: 0,
        totalPoints: 0,
        averageScore: 0,
        hasSheets: false,
        canPractice: true, // ✅ نسمح بالتدريب دائماً
        hasProblemTypes: true,
        sheets: []
      }
    };
  }
}
// في actions/sheet.actions.js - دالة جديدة
export async function createAutoSheetIfNeeded(ruleId, studentId) {
  try {
    // التحقق من وجود أوراق للقاعدة
    const existingSheets = await prisma.sheet.findMany({
      where: {
        rule_id: parseInt(ruleId),
        is_active: true
      },
      take: 1
    });

    // إذا لم توجد أوراق، ننشئ ورقة تلقائية
    if (existingSheets.length === 0) {
      const rule = await prisma.rule.findUnique({
        where: { rule_id: parseInt(ruleId) },
        select: { rule_name: true }
      });

      // إنشاء ورقة تلقائية
      const autoSheet = await prisma.sheet.create({
        data: {
          sheet_name: `${rule?.rule_name || 'تدريب'} تلقائي`,
          level_id: 1, // مستوى افتراضي
          rule_id: parseInt(ruleId),
          total_problems: 20,
          time_limit: 600,
          required_score: 70,
          difficulty_level: 1,
          is_active: true,
          is_auto_generated: true // ✅ علامة على أنها ورقة مولدة تلقائياً
        }
      });

      return {
        success: true,
        data: autoSheet,
        isAutoGenerated: true
      };
    }

    return {
      success: true,
      data: existingSheets[0],
      isAutoGenerated: false
    };

  } catch (error) {
    console.error('خطأ في إنشاء ورقة تلقائية:', error);
    return {
      success: false,
      error: error.message
    };
  }
}