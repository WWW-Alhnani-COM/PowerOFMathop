// src/actions/sheet.actions.js
'use server';

import { prisma } from '@/lib/prisma';
import { validateSession } from './auth.actions';

// دالة عامة لتحويل كائنات Prisma (التي تحتوي Decimal/Date) إلى كائنات عادية
function toPlain(data) {
  return data == null ? data : JSON.parse(JSON.stringify(data));
}

// ============================================
// 1. جلب معلومات الورقة
// ============================================
export async function getSheetInfo(sheetId) {
  try {
    const sheet = await prisma.sheet.findUnique({
      where: {
        sheet_id: parseInt(sheetId),
      },
      include: {
        level: {
          select: {
            level_name: true,
            color: true,
            icon: true,
          },
        },
        rule: {
          select: {
            rule_name: true,
            description: true,
            icon: true,
          },
        },
      },
    });

    if (!sheet) {
      return {
        success: false,
        error: 'الورقة غير موجودة',
      };
    }

    return {
      success: true,
      data: toPlain(sheet),
    };
  } catch (error) {
    console.error('خطأ في جلب معلومات الورقة:', error);
    return {
      success: false,
      error: error.message || 'فشل جلب معلومات الورقة',
    };
  }
}

// ============================================
// 2. جلب أوراق التمارين للطالب
// ============================================
export async function getStudentSheets(studentId) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: parseInt(studentId) },
      select: { current_level_id: true },
    });

    if (!student) {
      return {
        success: false,
        error: 'الطالب غير موجود',
      };
    }

    const sheets = await prisma.sheet.findMany({
      where: {
        level_id: student.current_level_id,
        is_active: true,
      },
      include: {
        rule: {
          select: {
            rule_name: true,
            icon: true,
          },
        },
        level: {
          select: {
            level_name: true,
            color: true,
          },
        },
        _count: {
          select: {
            sheetResults: {
              where: {
                student_id: parseInt(studentId),
                status: 'completed',
              },
            },
          },
        },
      },
      orderBy: {
        difficulty_level: 'asc',
      },
    });

    // إضافة حالة التمرين للطالب
    const sheetsWithStatus = await Promise.all(
      sheets.map(async (sheet) => {
        const latestResult = await prisma.sheetResult.findFirst({
          where: {
            student_id: parseInt(studentId),
            sheet_id: sheet.sheet_id,
          },
          orderBy: {
            created_at: 'desc',
          },
          select: {
            status: true,
            score: true,
            created_at: true,
          },
        });

        return {
          ...sheet,
          student_status: latestResult?.status || 'not_started',
          last_score: latestResult?.score ?? 0,
          last_attempt: latestResult?.created_at || null,
          attempts_count: sheet._count.sheetResults,
        };
      })
    );

    return {
      success: true,
      data: toPlain(sheetsWithStatus),
    };
  } catch (error) {
    console.error('خطأ في جلب أوراق الطالب:', error);
    return {
      success: false,
      error: error.message || 'فشل جلب أوراق التمارين',
    };
  }
}

// ============================================
// 3. جلب نتائج الطالب في ورقة محددة
// ============================================
export async function getStudentSheetResults(studentId, sheetIds) {
  try {
    if (!Array.isArray(sheetIds)) {
      sheetIds = [sheetIds];
    }

    const results = await prisma.sheetResult.findMany({
      where: {
        student_id: parseInt(studentId),
        sheet_id: {
          in: sheetIds.map((id) => parseInt(id)),
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return {
      success: true,
      data: toPlain(results),
    };
  } catch (error) {
    console.error('خطأ في جلب نتائج الطالب:', error);
    return {
      success: false,
      error: error.message || 'فشل جلب النتائج',
    };
  }
}

// ============================================
// 4. بدء ورقة جديدة (إنشاء SheetResult)
// ============================================
export async function startNewSheet({ student_id, sheet_id }) {
  try {
    const session = await validateSession();
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect,
      };
    }

    // التحقق من وجود الورقة
    const sheet = await prisma.sheet.findUnique({
      where: { sheet_id: parseInt(sheet_id) },
      select: { total_problems: true },
    });

    if (!sheet) {
      return {
        success: false,
        error: 'الورقة غير موجودة',
      };
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
        accuracy: 0,
      },
    });

    return {
      success: true,
      data: {
        result_id: sheetResult.result_id,
        sheet_id: sheetResult.sheet_id,
        student_id: sheetResult.student_id,
        start_time: sheetResult.start_time,
        total_problems: sheet.total_problems || 0,
      },
    };
  } catch (error) {
    console.error('خطأ في بدء ورقة جديدة:', error);
    return {
      success: false,
      error: error.message || 'فشل بدء الورقة',
    };
  }
}

// ============================================
// X. جلسة تدريب تلقائية للقاعدة (للـ PracticePage)
// ============================================
export async function startPracticeSession({
  student_id,
  rule_id,
  mode = 'practice',
  language = 'ar',
}) {
  try {
    // التحقق من الجلسة
    const session = await validateSession();
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect,
      };
    }

    const studentIdInt = parseInt(student_id);
    const ruleIdInt = parseInt(rule_id);

    if (isNaN(studentIdInt) || isNaN(ruleIdInt)) {
      return {
        success: false,
        error: 'بيانات الطالب أو القاعدة غير صحيحة.',
      };
    }

    // التأكد أن القاعدة موجودة
    const rule = await prisma.rule.findUnique({
      where: { rule_id: ruleIdInt },
    });

    if (!rule) {
      return {
        success: false,
        error: 'القاعدة غير موجودة.',
      };
    }

    // الحصول على ورقة (أو إنشاء ورقة تلقائية للقاعدة)
    const sheetRes = await createAutoSheetIfNeeded(ruleIdInt, studentIdInt);
    if (!sheetRes.success || !sheetRes.data) {
      return {
        success: false,
        error: sheetRes.error || 'فشل تجهيز ورقة التدريب.',
      };
    }

    const sheet = sheetRes.data;

    // إنشاء SheetResult جديد للجلسة
    const sheetResult = await prisma.sheetResult.create({
      data: {
        student_id: studentIdInt,
        sheet_id: sheet.sheet_id,
        start_time: new Date(),
        status: 'in_progress',
        total_correct: 0,
        total_wrong: 0,
        score: 0,
        accuracy: 0,
      },
    });

    // جلب أنواع المسائل المرتبطة بالقاعدة
    const problemTypes = await prisma.problemType.findMany({
      where: {
        rule_id: ruleIdInt,
        is_active: true,
      },
    });

    if (problemTypes.length === 0) {
      return {
        success: false,
        error:
          'لا توجد أنواع مسائل مضبوطة لهذه القاعدة بعد. يرجى إضافة Problem Types من لوحة التحكم.',
      };
    }

    const totalProblems = sheet.total_problems || 20;
    const problems = [];

    for (let i = 0; i < totalProblems; i++) {
      const type = problemTypes[i % problemTypes.length];
      problems.push(generateProblemFromType(type, i));
    }

    const safeResult = toPlain(sheetResult);
    const safeSheet = toPlain(sheet);

    return {
      success: true,
      data: {
        result: safeResult,
        sheet: safeSheet,
        session: {
          rule_id: ruleIdInt,
          mode,
          language,
          problems,
        },
      },
    };
  } catch (error) {
    console.error('خطأ في startPracticeSession:', error);
    return {
      success: false,
      error: error.message || 'فشل بدء جلسة التدريب.',
    };
  }
}

// توليد مسألة واحدة من نوع مسألة
function generateProblemFromType(problemType, index) {
  // في الـ schema الحالي لا يوجد min/max/operator، لذلك نستخدم قيم عامة
  const min = Number(problemType.min_value ?? 0) || 0;
  const max = Number(problemType.max_value ?? 10) || 10;
  const op = problemType.operator || problemType.operation || '+';

  const a = randomInt(min, max);
  const b = randomInt(min, max);

  let question = '';
  let correct = 0;

  switch (op) {
    case '-':
      question = `${a} - ${b}`;
      correct = a - b;
      break;
    case 'x':
    case '*':
      question = `${a} × ${b}`;
      correct = a * b;
      break;
    case '÷':
    case '/':
      question = `${a} ÷ ${b}`;
      correct = b !== 0 ? a / b : 0;
      break;
    default:
      question = `${a} + ${b}`;
      correct = a + b;
  }

  const expectedTime = Number(problemType.expected_time ?? 20) || 20;

  return {
    problem_type_id: problemType.problem_type_id,
    question,
    correct_answer: String(correct),
    operands: { a, b, operator: op },
    expected_time: expectedTime,
    problem_data: {
      rule_id: problemType.rule_id,
      problem_type_id: problemType.problem_type_id,
      operands: { a, b, operator: op },
    },
    sequence_number: index + 1,
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
// حفظ إجابة سؤال واحد
// ============================================
export async function submitAnswer({
  result_id,
  student_id,
  problem_type_id,
  problem_data,
  user_answer,
  correct_answer,
  time_spent,
  sequence_number,
}) {
  try {
    const session = await validateSession();
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect,
      };
    }

    const resultIdInt = parseInt(result_id);
    const studentIdInt = parseInt(student_id);

    if (isNaN(resultIdInt) || isNaN(studentIdInt)) {
      return {
        success: false,
        error: 'بيانات الجلسة غير صحيحة.',
      };
    }

    // حساب صحة الإجابة
    let isCorrect = false;
    if (user_answer != null && correct_answer != null) {
      const uaNum = Number(user_answer);
      const caNum = Number(correct_answer);

      if (!Number.isNaN(uaNum) && !Number.isNaN(caNum)) {
        isCorrect = uaNum === caNum;
      } else {
        isCorrect =
          String(user_answer).trim() === String(correct_answer).trim();
      }
    }

    await prisma.answerDetail.create({
      data: {
        result_id: resultIdInt,
        problem_type_id,
        problem_data:
          typeof problem_data === 'string'
            ? problem_data
            : JSON.stringify(problem_data || {}),
        user_answer: user_answer ?? '',
        correct_answer: String(correct_answer ?? ''),
        time_spent: Math.floor(time_spent || 0),
        is_correct: isCorrect,
        sequence_number: sequence_number || 0,
      },
    });

    return {
      success: true,
      data: {
        is_correct: isCorrect,
      },
    };
  } catch (error) {
    console.error('خطأ في submitAnswer:', error);
    return {
      success: false,
      error: error.message || 'فشل حفظ الإجابة.',
    };
  }
}

// ============================================
// إنهاء الجلسة وحساب النتيجة النهائية
// ============================================
export async function finishPracticeSession({ result_id, student_id }) {
  try {
    const session = await validateSession();
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect,
      };
    }

    const resultIdInt = parseInt(result_id);
    const studentIdInt = parseInt(student_id);

    if (isNaN(resultIdInt) || isNaN(studentIdInt)) {
      return {
        success: false,
        error: 'بيانات الجلسة غير صحيحة.',
      };
    }

    const sheetResult = await prisma.sheetResult.findUnique({
      where: { result_id: resultIdInt },
      select: {
        result_id: true,
        student_id: true,
        sheet_id: true,
        start_time: true,
      },
    });

    if (!sheetResult || sheetResult.student_id !== studentIdInt) {
      return {
        success: false,
        error: 'جلسة التدريب غير موجودة.',
      };
    }

    const answers = await prisma.answerDetail.findMany({
      where: { result_id: resultIdInt },
    });

    const totalCount = answers.length;
    const correctCount = answers.filter((a) => a.is_correct).length;

    const score =
      totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const accuracy = score;

    let total_time = 0;
    if (answers.length > 0 && typeof answers[0].time_spent === 'number') {
      total_time = answers.reduce(
        (sum, a) => sum + (a.time_spent || 0),
        0
      );
    } else if (sheetResult.start_time) {
      total_time = Math.floor(
        (Date.now() - new Date(sheetResult.start_time).getTime()) / 1000
      );
    }

    const updated = await prisma.sheetResult.update({
      where: { result_id: resultIdInt },
      data: {
        end_time: new Date(),
        total_correct: correctCount,
        total_wrong: totalCount - correctCount,
        total_time_spent: total_time,
        score: score,
        accuracy: accuracy,
        status: score >= 70 ? 'completed' : 'failed',
      },
    });

    // تحديث إحصائيات الطالب
    await updateStudentStats({
      student_id: studentIdInt,
      correct_count: correctCount,
      wrong_count: totalCount - correctCount,
      time_spent: total_time,
      score: score,
    });

    // تحديث تحليلات الأداء
    await updatePerformanceAnalytics({
      student_id: studentIdInt,
      sheet_id: sheetResult.sheet_id,
      correct_count: correctCount,
      total_count: totalCount,
      time_spent: total_time,
    });

    return {
      success: true,
      data: {
        result_id: updated.result_id,
        score: Number(updated.score ?? 0),
        status: updated.status,
        correct_count: updated.total_correct,
        total_count: (updated.total_correct || 0) + (updated.total_wrong || 0),
        time_spent: updated.total_time_spent,
      },
    };
  } catch (error) {
    console.error('خطأ في finishPracticeSession:', error);
    return {
      success: false,
      error: error.message || 'فشل إنهاء جلسة التدريب.',
    };
  }
}

// ============================================
// 5. حفظ نتيجة الورقة (الانتهاء القديم للـ Sheet العادي)
// ============================================
export async function saveSheetResult({
  student_id,
  sheet_id,
  result_id,
  problems = [],
  total_time,
  start_time,
  end_time,
}) {
  try {
    const session = await validateSession();
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect,
      };
    }

    const correctCount = problems.filter((p) => p.is_correct).length;
    const totalCount = problems.length;
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const accuracy = score;

    const updatedResult = await prisma.sheetResult.update({
      where: {
        result_id: parseInt(result_id),
        student_id: parseInt(student_id),
        sheet_id: parseInt(sheet_id),
      },
      data: {
        end_time: new Date(end_time),
        total_correct: correctCount,
        total_wrong: totalCount - correctCount,
        total_time_spent: Math.floor(total_time),
        score: score,
        accuracy: accuracy,
        status: score >= 70 ? 'completed' : 'failed',
      },
    });

    if (problems.length > 0) {
      await prisma.answerDetail.createMany({
        data: problems.map((problem) => ({
          result_id: parseInt(result_id),
          problem_type_id: problem.problem_type_id,
          problem_data: JSON.stringify({
            question: problem.question,
            operands: problem.operands || {},
            correct_answer: problem.correct_answer,
            expected_time: problem.expected_time,
          }),
          user_answer: problem.user_answer || '',
          correct_answer: problem.correct_answer || '',
          time_spent: problem.time_spent || 0,
          is_correct: problem.is_correct || false,
          sequence_number: problem.sequence_number || 0,
        })),
      });
    }

    await updateStudentStats({
      student_id: parseInt(student_id),
      correct_count: correctCount,
      wrong_count: totalCount - correctCount,
      time_spent: Math.floor(total_time),
      score: score,
    });

    await updatePerformanceAnalytics({
      student_id: parseInt(student_id),
      sheet_id: parseInt(sheet_id),
      correct_count: correctCount,
      total_count: totalCount,
      time_spent: Math.floor(total_time),
    });

    return {
      success: true,
      data: {
        result_id: updatedResult.result_id,
        score: Number(updatedResult.score ?? 0),
        status: updatedResult.status,
        correct_count: updatedResult.total_correct,
        total_count:
          (updatedResult.total_correct || 0) +
          (updatedResult.total_wrong || 0),
        time_spent: updatedResult.total_time_spent,
      },
    };
  } catch (error) {
    console.error('خطأ في حفظ نتيجة الورقة:', error);
    return {
      success: false,
      error: error.message || 'فشل حفظ النتيجة',
    };
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
  score,
}) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: parseInt(student_id) },
    });

    if (!student) return;

    let currentStreak = student.current_streak || 0;
    if (score >= 70) {
      currentStreak += 1;
    } else {
      currentStreak = 0;
    }

    await prisma.student.update({
      where: { student_id: parseInt(student_id) },
      data: {
        total_score: { increment: score },
        total_correct_answers: { increment: correct_count },
        total_wrong_answers: { increment: wrong_count },
        total_time_spent: { increment: time_spent },
        current_streak: currentStreak,
        best_streak: Math.max(student.best_streak || 0, currentStreak),
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error('خطأ في تحديث إحصائيات الطالب:', error);
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
  time_spent,
}) {
  try {
    const sheet = await prisma.sheet.findUnique({
      where: { sheet_id: parseInt(sheet_id) },
      select: { rule_id: true },
    });

    if (!sheet || !sheet.rule_id) return;

    const ruleId = sheet.rule_id;
    const success = correct_count / total_count >= 0.7;

    const existingAnalytic = await prisma.performanceAnalytic.findUnique({
      where: {
        student_id_rule_id: {
          student_id: parseInt(student_id),
          rule_id: ruleId,
        },
      },
    });

    if (existingAnalytic) {
      const newTotalAttempts = existingAnalytic.total_attempts + 1;
      const newCorrectAttempts =
        existingAnalytic.correct_attempts + (success ? 1 : 0);

      await prisma.performanceAnalytic.update({
        where: {
          student_id_rule_id: {
            student_id: parseInt(student_id),
            rule_id: ruleId,
          },
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
          mastery_level: calculateMasteryLevel(
            newCorrectAttempts / newTotalAttempts
          ),
          updated_at: new Date(),
        },
      });
    } else {
      await prisma.performanceAnalytic.create({
        data: {
          student_id: parseInt(student_id),
          rule_id: ruleId,
          total_attempts: 1,
          correct_attempts: success ? 1 : 0,
          average_time: time_spent,
          weakness_score: calculateWeaknessScore(correct_count, total_count, 0),
          last_practiced: new Date(),
          mastery_level: success ? 'beginner' : 'needs_practice',
        },
      });
    }
  } catch (error) {
    console.error('خطأ في تحديث تحليل الأداء:', error);
  }
}

// ============================================
// 8. دوال مساعدة للحسابات
// ============================================
function calculateNewAverage(oldAverage, oldCount, newValue) {
  if (!oldAverage) return newValue;
  return (Number(oldAverage) * oldCount + newValue) / (oldCount + 1);
}

function calculateWeaknessScore(correctCount, totalCount, oldScore) {
  if (totalCount === 0) return oldScore;

  const accuracy = correctCount / totalCount;
  const newScore = 1 - accuracy;

  return oldScore
    ? Number(oldScore) * 0.7 + newScore * 0.3
    : newScore;
}

function calculateMasteryLevel(successRate) {
  if (successRate >= 0.9) return 'master';
  if (successRate >= 0.7) return 'advanced';
  if (successRate >= 0.5) return 'intermediate';
  if (successRate >= 0.3) return 'beginner';
  return 'needs_practice';
}

// ============================================
// 9. جلب نتائج مفصلة لورقة
// ============================================
export async function getSheetResultDetails(resultId) {
  try {
    const session = await validateSession();
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect,
      };
    }

    const result = await prisma.sheetResult.findUnique({
      where: {
        result_id: parseInt(resultId),
      },
      include: {
        sheet: {
          include: {
            rule: true,
            level: true,
          },
        },
        answerDetails: {
          orderBy: {
            sequence_number: 'asc',
          },
        },
      },
    });

    if (!result) {
      return {
        success: false,
        error: 'النتيجة غير موجودة',
      };
    }

    return {
      success: true,
      data: toPlain(result),
    };
  } catch (error) {
    console.error('خطأ في جلب تفاصيل النتيجة:', error);
    return {
      success: false,
      error: error.message || 'فشل جلب التفاصيل',
    };
  }
}

// ============================================
// 10. جلب تاريخ التمارين للطالب
// ============================================
export async function getStudentPracticeHistory(studentId, limit = 20) {
  try {
    const history = await prisma.sheetResult.findMany({
      where: {
        student_id: parseInt(studentId),
      },
      include: {
        sheet: {
          include: {
            rule: {
              select: {
                rule_name: true,
                icon: true,
              },
            },
            level: {
              select: {
                level_name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });

    return {
      success: true,
      data: toPlain(history),
    };
  } catch (error) {
    console.error('خطأ في جلب تاريخ التمارين:', error);
    return {
      success: false,
      error: error.message || 'فشل جلب التاريخ',
    };
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
        status: 'completed',
      },
      include: {
        student: {
          select: {
            student_name: true,
          },
        },
      },
      orderBy: [{ score: 'desc' }, { total_time_spent: 'asc' }],
      take: limit,
    });

    return {
      success: true,
      data: toPlain(topResults),
    };
  } catch (error) {
    console.error('خطأ في جلب أفضل النتائج:', error);
    return {
      success: false,
      error: error.message || 'فشل جلب أفضل النتائج',
    };
  }
}

// ============================================
// 12. إعادة محاولة ورقة
// ============================================
export async function retrySheet(resultId) {
  try {
    const session = await validateSession();
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect,
      };
    }

    const oldResult = await prisma.sheetResult.findUnique({
      where: {
        result_id: parseInt(resultId),
      },
      include: {
        sheet: true,
      },
    });

    if (!oldResult) {
      return {
        success: false,
        error: 'النتيجة الأصلية غير موجودة',
      };
    }

    const newResult = await prisma.sheetResult.create({
      data: {
        student_id: oldResult.student_id,
        sheet_id: oldResult.sheet_id,
        start_time: new Date(),
        status: 'in_progress',
        total_correct: 0,
        total_wrong: 0,
        score: 0,
        accuracy: 0,
      },
    });

    return {
      success: true,
      data: {
        new_result_id: newResult.result_id,
        sheet_id: newResult.sheet_id,
        student_id: newResult.student_id,
        total_problems: oldResult.sheet.total_problems || 0,
      },
    };
  } catch (error) {
    console.error('خطأ في إعادة المحاولة:', error);
    return {
      success: false,
      error: error.message || 'فشل إعادة المحاولة',
    };
  }
}

// ============================================
// 13. حذف نتيجة (للمسؤول فقط)
// ============================================
export async function deleteSheetResult(resultId) {
  try {
    const session = await validateSession();
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect,
      };
    }

    await prisma.answerDetail.deleteMany({
      where: {
        result_id: parseInt(resultId),
      },
    });

    await prisma.sheetResult.delete({
      where: {
        result_id: parseInt(resultId),
      },
    });

    return {
      success: true,
      message: 'تم حذف النتيجة بنجاح',
    };
  } catch (error) {
    console.error('خطأ في حذف النتيجة:', error);
    return {
      success: false,
      error: error.message || 'فشل حذف النتيجة',
    };
  }
}

// ============================================
// 14. تصدير النتائج (PDF/Excel)
// ============================================
export async function exportSheetResults(studentId, format = 'json') {
  try {
    const session = await validateSession();
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect,
      };
    }

    const results = await prisma.sheetResult.findMany({
      where: {
        student_id: parseInt(studentId),
      },
      include: {
        sheet: {
          include: {
            rule: true,
            level: true,
          },
        },
        answerDetails: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (format === 'json') {
      return {
        success: true,
        data: toPlain(results),
        format: 'json',
      };
    }

    return {
      success: false,
      error: 'التنسيق غير مدعوم حالياً',
    };
  } catch (error) {
    console.error('خطأ في تصدير النتائج:', error);
    return {
      success: false,
      error: error.message || 'فشل تصدير النتائج',
    };
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
        sheet_id: parseInt(sheetId),
      },
      _count: true,
      _avg: {
        score: true,
        total_time_spent: true,
        accuracy: true,
      },
    });

    const totalAttempts = statistics.reduce(
      (sum, stat) => sum + stat._count,
      0
    );
    const completedAttempts =
      statistics.find((s) => s.status === 'completed')?._count || 0;

    const averageScore =
      totalAttempts > 0
        ? statistics.reduce(
            (sum, stat) =>
              sum + Number(stat._avg.score || 0) * stat._count,
            0
          ) / totalAttempts
        : 0;

    return {
      success: true,
      data: {
        total_attempts: totalAttempts,
        completed_attempts: completedAttempts,
        completion_rate:
          totalAttempts > 0
            ? (completedAttempts / totalAttempts) * 100
            : 0,
        average_score: Math.round(averageScore) || 0,
        statistics_by_status: toPlain(statistics),
      },
    };
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الشيت:', error);
    return {
      success: false,
      error: error.message || 'فشل جلب الإحصائيات',
    };
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
          rule_id: parseInt(ruleId),
        },
      },
    });

    if (!progress) {
      return {
        success: true,
        data: {
          total_attempts: 0,
          correct_attempts: 0,
          mastery_level: 'not_started',
          weakness_score: 0,
        },
      };
    }

    return {
      success: true,
      data: toPlain(progress),
    };
  } catch (error) {
    console.error('خطأ في جلب تقدم الطالب:', error);
    return {
      success: false,
      error: error.message || 'فشل جلب التقدم',
    };
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
        status: 'completed',
      },
      include: {
        sheet: {
          include: {
            rule: {
              select: {
                rule_name: true,
              },
            },
          },
        },
      },
      orderBy: [{ score: 'desc' }, { total_time_spent: 'asc' }],
      take: limit,
    });

    return {
      success: true,
      data: toPlain(bestResults),
    };
  } catch (error) {
    console.error('خطأ في جلب أفضل النتائج:', error);
    return {
      success: false,
      error: error.message || 'فشل جلب أفضل النتائج',
    };
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
        status: 'completed',
      },
      select: {
        result_id: true,
        score: true,
        created_at: true,
      },
    });

    return {
      success: true,
      data: {
        completed: !!completedResult,
        result: completedResult ? toPlain(completedResult) : null,
      },
    };
  } catch (error) {
    console.error('خطأ في التحقق من إكمال الورقة:', error);
    return {
      success: false,
      error: error.message || 'فشل التحقق',
    };
  }
}

// ============================================
// 19. جلب أوراق مقترحة بناءً على أداء الطالب
// ============================================
export async function getSuggestedSheets(studentId, limit = 3) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: parseInt(studentId) },
      select: { current_level_id: true },
    });

    if (!student) {
      return {
        success: false,
        error: 'الطالب غير موجود',
      };
    }

    const weakRules = await prisma.performanceAnalytic.findMany({
      where: {
        student_id: parseInt(studentId),
        weakness_score: { gt: 0.5 },
      },
      orderBy: {
        weakness_score: 'desc',
      },
      take: 2,
    });

    let suggestedSheets = [];

    if (weakRules.length > 0) {
      for (const rule of weakRules) {
        const sheets = await prisma.sheet.findMany({
          where: {
            rule_id: rule.rule_id,
            level_id: student.current_level_id,
            is_active: true,
            difficulty_level: { lte: 2 },
          },
          take: 2,
        });
        suggestedSheets.push(...sheets);
      }
    }

    if (suggestedSheets.length === 0) {
      suggestedSheets = await prisma.sheet.findMany({
        where: {
          level_id: student.current_level_id,
          is_active: true,
        },
        take: limit,
      });
    }

    return {
      success: true,
      data: toPlain(suggestedSheets.slice(0, limit)),
    };
  } catch (error) {
    console.error('خطأ في جلب الأوراق المقترحة:', error);
    return {
      success: false,
      error: error.message || 'فشل جلب المقترحات',
    };
  }
}

// ============================================
// 20. جلب تقدم الطالب في القاعدة (مع الشيتات)
// ============================================
export async function getStudentSheetsProgress(studentId, ruleId) {
  try {
    const ruleExists = await prisma.rule.findUnique({
      where: { rule_id: parseInt(ruleId) },
    });

    if (!ruleExists) {
      return {
        success: false,
        error: 'القاعدة غير موجودة',
      };
    }

    const sheets = await prisma.sheet.findMany({
      where: {
        rule_id: parseInt(ruleId),
        is_active: true,
      },
      include: {
        level: { select: { level_name: true, color: true } },
        rule: { select: { rule_name: true, icon: true } },
      },
      orderBy: [{ difficulty_level: 'asc' }, { sheet_id: 'asc' }],
    });

    const sheetIds = sheets.map((sheet) => sheet.sheet_id);

    const results = await prisma.sheetResult.findMany({
      where: {
        student_id: parseInt(studentId),
        sheet_id: { in: sheetIds },
      },
      select: {
        sheet_id: true,
        status: true,
        score: true,
        total_time_spent: true,
        created_at: true,
      },
    });

    let totalSheets = sheets.length;
    let completedSheets = 0;
    let totalPoints = 0;

    sheets.forEach((sheet) => {
      const result = results.find((r) => r.sheet_id === sheet.sheet_id);
      if (result?.status === 'completed') {
        completedSheets++;
        totalPoints += Number(result.score || 0);
      }
    });

    const hasProblemTypes =
      (await prisma.problemType.count({
        where: {
          rule_id: parseInt(ruleId),
          is_active: true,
        },
      })) > 0;

    return {
      success: true,
      data: toPlain({
        totalSheets,
        completedSheets,
        progressPercentage:
          totalSheets > 0
            ? Math.round((completedSheets / totalSheets) * 100)
            : 0,
        totalPoints,
        averageScore:
          completedSheets > 0
            ? Math.round(totalPoints / completedSheets)
            : 0,
        hasSheets: totalSheets > 0,
        canPractice: hasProblemTypes,
        hasProblemTypes,
        ruleInfo: ruleExists,
        sheets: sheets.map((sheet) => ({
          ...sheet,
          result: results.find((r) => r.sheet_id === sheet.sheet_id) || null,
        })),
      }),
    };
  } catch (error) {
    console.error('خطأ في جلب تقدم الطالب:', error);
    return {
      success: false,
      error: error.message || 'فشل جلب تقدم الطالب في القاعدة',
    };
  }
}

// ============================================
// إنشاء ورقة تلقائية إذا لم توجد ورقة للقاعدة
// ============================================
export async function createAutoSheetIfNeeded(ruleId, studentId) {
  try {
    const existingSheets = await prisma.sheet.findMany({
      where: {
        rule_id: parseInt(ruleId),
        is_active: true,
      },
      take: 1,
    });

    if (existingSheets.length === 0) {
      const rule = await prisma.rule.findUnique({
        where: { rule_id: parseInt(ruleId) },
        select: { rule_name: true },
      });

      const autoSheet = await prisma.sheet.create({
        data: {
          sheet_name: `${rule?.rule_name || 'تدريب'} تلقائي`,
          level_id: 1, // مستوى افتراضي - يمكنك تعديله حسب منطقك
          rule_id: parseInt(ruleId),
          total_problems: 20,
          time_limit: 600,
          required_score: 70,
          difficulty_level: 1,
          is_active: true,
          // لو أضفت حقل is_auto_generated في الـ schema يمكنك استخدامه هنا
          // is_auto_generated: true,
        },
      });

      return {
        success: true,
        data: toPlain(autoSheet),
        isAutoGenerated: true,
      };
    }

    return {
      success: true,
      data: toPlain(existingSheets[0]),
      isAutoGenerated: false,
    };
  } catch (error) {
    console.error('خطأ في إنشاء ورقة تلقائية:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
