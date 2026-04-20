// src/actions/sheet.actions.js

'use server';
import { supabaseAdmin } from '../lib/supabaseAdmin'



import { validateSession } from './auth.actions';

function toPlain(data) {
  return data == null ? data : JSON.parse(JSON.stringify(data));
}

// ============================================
// 1. جلب معلومات الورقة
// ============================================
export async function getSheetInfo(sheetId) {
  try {
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: sheet, error } = await supabaseAdmin
      .from('sheets')
      .select(`*, level:levels(level_name, color, icon), rule:rules(rule_name, description, icon)`)
      .eq('sheet_id', Number(sheetId))
      .single();
    if (error || !sheet) {
      return { success: false, error: 'الورقة غير موجودة' };
    }
    return { success: true, data: toPlain(sheet) };
  } catch (error) {
    return { success: false, error: error.message || 'فشل جلب معلومات الورقة' };
  }
}

// ============================================
// 2. جلب أوراق التمارين للطالب
// ============================================
export async function getStudentSheets(studentId) {
  try {
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('current_level_id')
      .eq('student_id', Number(studentId))
      .single();
    if (!student) {
      return { success: false, error: 'الطالب غير موجود' };
    }
    const { data: sheets, error } = await supabaseAdmin
      .from('sheets')
      .select(`*, rule:rules(rule_name, icon), level:levels(level_name, color)`)
      .eq('level_id', student.current_level_id)
      .eq('is_active', true)
      .order('difficulty_level', { ascending: true });
    if (error) {
      return { success: false, error: error.message };
    }
    const { data: results } = await supabaseAdmin
      .from('sheet_results')
      .select('*')
      .eq('student_id', Number(studentId));
    const enriched = (sheets || []).map((sheet) => {
const sheetResults = (results || [])
  .filter(r => r.sheet_id === sheet.sheet_id)
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

const latest = sheetResults[0] || null;
      const attempts = (results || []).filter(r => r.sheet_id === sheet.sheet_id).length;
      return {
        ...sheet,
        student_status: latest?.status || 'not_started',
        last_score: latest?.score || 0,
        last_attempt: latest?.created_at || null,
        attempts_count: attempts,
      };
    });
    return { success: true, data: toPlain(enriched) };
  } catch (error) {
    return { success: false, error: error.message || 'فشل جلب أوراق التمارين' };
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

    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: results, error } = await supabaseAdmin
      .from('sheet_results')
      .select('*')
      .eq('student_id', Number(studentId))
      .in('sheet_id', sheetIds.map(Number))
      .order('created_at', { ascending: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data: toPlain(results) };

  } catch (error) {
    console.error('خطأ في جلب نتائج الطالب:', error);
    return {
      success: false,
      error: error.message || 'فشل جلب النتائج',
    };
  }
}

export async function getProblemsForSheet(sheetId) {
  try {
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف

    const { data: sheet, error: sheetError } = await supabaseAdmin
      .from('sheets')
      .select('sheet_id, rule_id')
      .eq('sheet_id', Number(sheetId))
      .single();

    if (sheetError || !sheet) {
      return { success: false, error: 'الورقة غير موجودة' };
    }

    const { data: problemTypes, error: problemError } = await supabaseAdmin
      .from('problem_types')
      .select('*')
      .eq('rule_id', sheet.rule_id)
      .eq('is_active', true)
      .order('problem_type_id', { ascending: true });

    if (problemError) {
      return { success: false, error: problemError.message || 'فشل جلب المسائل' };
    }

    return { success: true, data: toPlain(problemTypes) };
  } catch (error) {
    console.error('خطأ في جلب المسائل:', error);
    return { success: false, error: error.message || 'فشل جلب المسائل' };
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
    const { data: sheet, error: sheetError } = await supabaseAdmin
      .from('sheets')
      .select('total_problems')
      .eq('sheet_id', Number(sheet_id))
      .single();
    if (sheetError || !sheet) {
      return {
        success: false,
        error: 'الورقة غير موجودة',
      };
    }
    // إنشاء نتيجة جديدة
    const { data: sheetResult, error: resultError } = await supabaseAdmin
      .from('sheet_results')
      .insert({
        student_id: Number(student_id),
        sheet_id: Number(sheet_id),
        start_time: new Date().toISOString(),
        status: 'in_progress',
        total_correct: 0,
        total_wrong: 0,
        score: 0,
        accuracy: 0,
      })
      .select()
      .single();
    if (resultError) {
      return { success: false, error: resultError.message };
    }
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
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: rule, error: ruleError } = await supabaseAdmin
      .from('rules')
      .select('*')
      .eq('rule_id', ruleIdInt)
      .single();
    if (ruleError) {
      return { success: false, error: ruleError.message };
    }

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
    const { data: sheetResult, error: sheetResultError } = await supabaseAdmin
  .from('sheet_results')
  .insert({
    student_id: studentIdInt,
    sheet_id: sheet.sheet_id,
    start_time: new Date().toISOString(),
    status: 'in_progress',
    total_correct: 0,
    total_wrong: 0,
    score: 0,
    accuracy: 0,
  })
  .select()
  .single();

if (sheetResultError || !sheetResult) {
  return { success: false, error: sheetResultError?.message || 'فشل إنشاء النتيجة' };
}
  
    

    // جلب أنواع المسائل المرتبطة بالقاعدة
    const { data: problemTypes, error: ptError } = await supabaseAdmin
      .from('problem_types')
      .select('*')
      .eq('rule_id', ruleIdInt)
      .eq('is_active', true);
    if (ptError) {
      return { success: false, error: ptError.message };
    }
    if (!problemTypes || problemTypes.length === 0) {
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

    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { error: answerError } = await supabaseAdmin
      .from('answer_details')
      .insert({
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
      });
    if (answerError) {
      return { success: false, error: answerError.message };
    }

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

    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
const { data: sheetResult, error: sheetResultError } = await supabaseAdmin
      .from('sheet_results')
      .select('result_id, student_id, sheet_id, start_time')
      .eq('result_id', resultIdInt)
      .single();
    if (sheetResultError || !sheetResult || sheetResult.student_id !== studentIdInt) {
      return {
        success: false,
        error: 'جلسة التدريب غير موجودة.',
      };
    }
    const { data: answers, error: answersError } = await supabaseAdmin
      .from('answer_details')
      .select('*')
      .eq('result_id', resultIdInt);
    if (answersError) {
      return { success: false, error: answersError.message };
    }

const totalCount = Array.isArray(answers) ? answers.length : 0;
    const correctCount = answers.filter((a) => a.is_correct).length;

    const score =
      totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const accuracy = score;

    let total_time = 0;
if (Array.isArray(answers) && answers.length > 0 && typeof answers[0].time_spent === 'number')
{
      total_time = answers.reduce(
        (sum, a) => sum + (a.time_spent || 0),
        0
      );
    } else if (sheetResult.start_time) {
      total_time = Math.floor(
        (Date.now() - new Date(sheetResult.start_time).getTime()) / 1000
      );
    }

    const { data: updatedArr, error: updateError } = await supabaseAdmin
      .from('sheet_results')
      .update({
        end_time: new Date().toISOString(),
        total_correct: correctCount,
        total_wrong: totalCount - correctCount,
        total_time_spent: total_time,
        score: score,
        accuracy: accuracy,
        status: score >= 70 ? 'completed' : 'failed',
      })
      .eq('result_id', resultIdInt)
      .select();
    if (updateError) {
      return { success: false, error: updateError.message };
    }
    const updated = Array.isArray(updatedArr) ? updatedArr[0] : updatedArr;

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

    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: updatedArr, error: updateError } = await supabaseAdmin
      .from('sheet_results')
      .update({
        end_time: new Date(end_time).toISOString(),
        total_correct: correctCount,
        total_wrong: totalCount - correctCount,
        total_time_spent: Math.floor(total_time),
        score: score,
        accuracy: accuracy,
        status: score >= 70 ? 'completed' : 'failed',
      })
      .eq('result_id', parseInt(result_id))
      .eq('student_id', parseInt(student_id))
      .eq('sheet_id', parseInt(sheet_id))
      .select();
    if (updateError) {
      return { success: false, error: updateError.message };
    }
    const updatedResult = Array.isArray(updatedArr) ? updatedArr[0] : updatedArr;

    if (problems.length > 0) {
      const { error: answerError } = await supabaseAdmin
        .from('answer_details')
        .insert(
          problems.map((problem) => ({
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
          }))
        );
      if (answerError) {
        return { success: false, error: answerError.message };
      }
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
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('student_id', parseInt(student_id))
      .single();
if (studentError || !student) {
  console.error('Student not found or error:', studentError);
  return;
}
    let currentStreak = student.current_streak || 0;
    if (score >= 70) {
      currentStreak += 1;
    } else {
      currentStreak = 0;
    }
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({
        total_score: (student.total_score || 0) + score,
        total_correct_answers: (student.total_correct_answers || 0) + correct_count,
        total_wrong_answers: (student.total_wrong_answers || 0) + wrong_count,
        total_time_spent: (student.total_time_spent || 0) + time_spent,
        current_streak: currentStreak,
        best_streak: Math.max(student.best_streak || 0, currentStreak),
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', parseInt(student_id));
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
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: sheet, error: sheetError } = await supabaseAdmin
      .from('sheets')
      .select('rule_id')
      .eq('sheet_id', parseInt(sheet_id))
      .single();
    if (sheetError || !sheet || !sheet.rule_id) return;
    const ruleId = sheet.rule_id;
    const success = correct_count / total_count >= 0.7;
    const { data: existingAnalytic, error: analyticError } = await supabaseAdmin
      .from('performance_analytics')
      .select('*')
      .eq('student_id', parseInt(student_id))
      .eq('rule_id', ruleId)
      .single();
    if (existingAnalytic) {
      const newTotalAttempts = existingAnalytic.total_attempts + 1;
      const newCorrectAttempts =
        existingAnalytic.correct_attempts + (success ? 1 : 0);
      await supabaseAdmin
        .from('performance_analytics')
        .update({
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
          last_practiced: new Date().toISOString(),
          mastery_level: calculateMasteryLevel(
            newCorrectAttempts / newTotalAttempts
          ),
          updated_at: new Date().toISOString(),
        })
        .eq('student_id', parseInt(student_id))
        .eq('rule_id', ruleId);
    } else {
      await supabaseAdmin
        .from('performance_analytics')
        .insert({
          student_id: parseInt(student_id),
          rule_id: ruleId,
          total_attempts: 1,
          correct_attempts: success ? 1 : 0,
          average_time: time_spent,
          weakness_score: calculateWeaknessScore(correct_count, total_count, 0),
          last_practiced: new Date().toISOString(),
          mastery_level: success ? 'beginner' : 'needs_practice',
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

    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: result, error } = await supabaseAdmin
      .from('sheet_results')
      .select(`*, sheet:sheets(*, rule:rules(*), level:levels(*)), answer_details:answer_details(*)`)
      .eq('result_id', parseInt(resultId))
      .single();
    if (error || !result) {
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
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: history, error } = await supabaseAdmin
      .from('sheet_results')
      .select(`*, sheet:sheets(*, rule:rules(rule_name, icon), level:levels(level_name, color))`)
      .eq('student_id', parseInt(studentId))
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      return { success: false, error: error.message };
    }
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
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: topResults, error } = await supabaseAdmin
      .from('sheet_results')
      .select('*, student:students(student_name)')
      .eq('sheet_id', parseInt(sheetId))
      .eq('status', 'completed')
      .order('score', { ascending: false })
      .order('total_time_spent', { ascending: true })
      .limit(limit);
    if (error) {
      return { success: false, error: error.message };
    }
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

    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: oldResult, error: oldError } = await supabaseAdmin
      .from('sheet_results')
      .select('*, sheet:sheets(*)')
      .eq('result_id', parseInt(resultId))
      .single();
    if (oldError || !oldResult) {
      return {
        success: false,
        error: 'النتيجة الأصلية غير موجودة',
      };
    }
    const { data: newResult, error: newError } = await supabaseAdmin
      .from('sheet_results')
      .insert({
        student_id: oldResult.student_id,
        sheet_id: oldResult.sheet_id,
        start_time: new Date().toISOString(),
        status: 'in_progress',
        total_correct: 0,
        total_wrong: 0,
        score: 0,
        accuracy: 0,
      })
      .select()
      .single();
    if (newError) {
      return { success: false, error: newError.message };
    }
    return {
      success: true,
      data: {
        new_result_id: newResult.result_id,
        sheet_id: newResult.sheet_id,
        student_id: newResult.student_id,
        total_problems: oldResult.sheet?.total_problems || 0,
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

    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { error: answerError } = await supabaseAdmin
      .from('answer_details')
      .delete()
      .eq('result_id', parseInt(resultId));
    if (answerError) {
      return { success: false, error: answerError.message };
    }
    const { error: resultError } = await supabaseAdmin
      .from('sheet_results')
      .delete()
      .eq('result_id', parseInt(resultId));
    if (resultError) {
      return { success: false, error: resultError.message };
    }
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

    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: results, error } = await supabaseAdmin
      .from('sheet_results')
      .select('*, sheet:sheets(*, rule:rules(*), level:levels(*)), answer_details:answer_details(*)')
      .eq('student_id', parseInt(studentId))
      .order('created_at', { ascending: false });
    if (error) {
      return { success: false, error: error.message };
    }
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
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: statistics, error } = await supabaseAdmin
      .from('sheet_results')
      .select('status, score, total_time_spent, accuracy')
      .eq('sheet_id', parseInt(sheetId));
    if (error) {
      return { success: false, error: error.message };
    }
    // Group by status manually
    const grouped = {};
    (statistics || []).forEach((stat) => {
      if (!grouped[stat.status]) grouped[stat.status] = [];
      grouped[stat.status].push(stat);
    });
    const totalAttempts = (statistics || []).length;
    const completedAttempts = (grouped['completed'] || []).length;
    const averageScore =
      totalAttempts > 0
        ? Math.round(
            (statistics || []).reduce((sum, stat) => sum + Number(stat.score || 0), 0) /
              totalAttempts
          )
        : 0;
    return {
      success: true,
      data: {
        total_attempts: totalAttempts,
        completed_attempts: completedAttempts,
        completion_rate:
          totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0,
        average_score: averageScore,
        statistics_by_status: toPlain(grouped),
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
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: progress, error } = await supabaseAdmin
      .from('performance_analytics')
      .select('*')
      .eq('student_id', parseInt(studentId))
      .eq('rule_id', parseInt(ruleId))
      .single();
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
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: bestResults, error } = await supabaseAdmin
      .from('sheet_results')
      .select('*, sheet:sheets(*, rule:rules(rule_name))')
      .eq('student_id', parseInt(studentId))
      .eq('status', 'completed')
      .order('score', { ascending: false })
      .order('total_time_spent', { ascending: true })
      .limit(limit);
    if (error) {
      return { success: false, error: error.message };
    }
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
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: completedResult, error } = await supabaseAdmin
      .from('sheet_results')
      .select('result_id, score, created_at')
      .eq('student_id', parseInt(studentId))
      .eq('sheet_id', parseInt(sheetId))
      .eq('status', 'completed')
      .maybeSingle();
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
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('current_level_id')
      .eq('student_id', parseInt(studentId))
      .single();
    if (studentError || !student) {
      return {
        success: false,
        error: 'الطالب غير موجود',
      };
    }
    const { data: weakRules, error: weakError } = await supabaseAdmin
      .from('performance_analytics')
      .select('*')
      .eq('student_id', parseInt(studentId))
      .gt('weakness_score', 0.5)
      .order('weakness_score', { ascending: false })
      .limit(2);
    if (weakError) {
      return { success: false, error: weakError.message };
    }
    let suggestedSheets = [];
    if (weakRules && weakRules.length > 0) {
      for (const rule of weakRules) {
        const { data: sheets, error: sheetError } = await supabaseAdmin
          .from('sheets')
          .select('*')
          .eq('rule_id', rule.rule_id)
          .eq('is_active', true)
          .order('difficulty_level', { ascending: true })
          .limit(1);
        if (sheetError || !sheets || sheets.length === 0) continue;
        suggestedSheets.push(sheets[0]);
      }
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
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: ruleExists, error: ruleError } = await supabaseAdmin
      .from('rules')
      .select('*')
      .eq('rule_id', parseInt(ruleId))
      .single();
    if (ruleError || !ruleExists) {
      return {
        success: false,
        error: 'القاعدة غير موجودة',
      };
    }
    const { data: sheets, error: sheetsError } = await supabaseAdmin
      .from('sheets')
      .select('*, level:levels(level_name, color), rule:rules(rule_name, icon)')
      .eq('rule_id', parseInt(ruleId))
      .eq('is_active', true)
      .order('difficulty_level', { ascending: true })
      .order('sheet_id', { ascending: true });
    if (sheetsError) {
      return { success: false, error: sheetsError.message };
    }
    const sheetIds = (sheets || []).map((sheet) => sheet.sheet_id);
    const { data: results, error: resultsError } = await supabaseAdmin
      .from('sheet_results')
      .select('sheet_id, status, score, total_time_spent, created_at')
      .eq('student_id', parseInt(studentId))
      .in('sheet_id', sheetIds);
    if (resultsError) {
      return { success: false, error: resultsError.message };
    }
    let totalSheets = (sheets || []).length;
    let completedSheets = 0;
    let totalPoints = 0;
    (sheets || []).forEach((sheet) => {
      const result = (results || []).find((r) => r.sheet_id === sheet.sheet_id);
      if (result?.status === 'completed') {
        completedSheets++;
        totalPoints += Number(result.score || 0);
      }
    });
    const { count: problemTypeCount } = await supabaseAdmin
      .from('problem_types')
      .select('*', { count: 'exact', head: true })
      .eq('rule_id', parseInt(ruleId))
      .eq('is_active', true);
    const hasProblemTypes = (problemTypeCount || 0) > 0;
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
        sheets: (sheets || []).map((sheet) => ({
          ...sheet,
          result: (results || []).find((r) => r.sheet_id === sheet.sheet_id) || null,
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
    // استخدم supabaseAdmin مباشرة بدون إعادة تعريف
    const { data: existingSheets, error: sheetsError } = await supabaseAdmin
      .from('sheets')
      .select('*')
      .eq('rule_id', parseInt(ruleId))
      .eq('is_active', true)
      .limit(1);
    if (sheetsError) {
      return { success: false, error: sheetsError.message };
    }
    if (!existingSheets || existingSheets.length === 0) {
      const { data: rule, error: ruleError } = await supabaseAdmin
        .from('rules')
        .select('rule_name')
        .eq('rule_id', parseInt(ruleId))
        .single();
      if (ruleError) {
        return { success: false, error: ruleError.message };
      }
      const { data: autoSheet, error: createError } = await supabaseAdmin
        .from('sheets')
        .insert({
          sheet_name: `${rule?.rule_name || 'تدريب'} تلقائي`,
          level_id: 1,
          rule_id: parseInt(ruleId),
          total_problems: 20,
          time_limit: 600,
          required_score: 70,
          difficulty_level: 1,
          is_active: true,
        })
        .select()
        .single();
      if (createError) {
        return { success: false, error: createError.message };
      }
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
