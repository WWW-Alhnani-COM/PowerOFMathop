// src/actions/dashboard.actions.js
'use server';

import { prisma } from '@/lib/prisma';

// =================================================================
// إحصائيات النظام العامة
// =================================================================
export async function getSystemStats() {
  try {
    const [
      totalStudents,
      totalBranches,
      totalLevels,
      totalRules,
      totalSheets,
      totalChallenges,
      totalMessages,
      activeStudents
    ] = await Promise.all([
      prisma.student.count(),
      prisma.branch.count(),
      prisma.level.count({ where: { is_active: true } }),
      prisma.rule.count(),
      prisma.sheet.count({ where: { is_active: true } }),
      prisma.challenge.count(),
      prisma.chatMessage.count(),
      prisma.student.count({ where: { status: 'active' } })
    ]);

    // إحصائيات الأداء
    const recentResults = await prisma.sheetResult.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // آخر 7 أيام
        }
      },
      select: {
        score: true,
        accuracy: true,
        total_time_spent: true
      }
    });

    const averageScore = recentResults.length > 0 
      ? recentResults.reduce((sum, r) => sum + (r.score || 0), 0) / recentResults.length 
      : 0;

    const averageAccuracy = recentResults.length > 0 
      ? recentResults.reduce((sum, r) => sum + (r.accuracy || 0), 0) / recentResults.length 
      : 0;

    const totalTime = recentResults.reduce((sum, r) => sum + (r.total_time_spent || 0), 0);

    return {
      success: true,
      data: {
        overview: {
          totalStudents,
          totalBranches,
          totalLevels,
          totalRules,
          totalSheets,
          totalChallenges,
          totalMessages,
          activeStudents
        },
        performance: {
          averageScore: Math.round(averageScore),
          averageAccuracy: Math.round(averageAccuracy),
          totalPracticeTime: totalTime,
          recentActivities: recentResults.length
        }
      }
    };
  } catch (error) {
    console.error('Error in getSystemStats:', error);
    return { success: false, error: 'فشل جلب إحصائيات النظام.' };
  }
}

// =================================================================
// إحصائيات الطالب الفردية
// =================================================================
export async function getStudentDashboardStats(studentId) {
  const id = parseInt(studentId);
  if (isNaN(id)) {
    return { success: false, error: 'معرف طالب غير صالح.' };
  }

  try {
    // بيانات الطالب الأساسية
    const student = await prisma.student.findUnique({
      where: { student_id: id },
      include: {
        level: {
          select: {
            level_name: true,
            level_order: true,
            description: true,
            color: true
          }
        },
        branch: {
          select: {
            branch_name: true,
            location: true
          }
        }
      }
    });

    if (!student) {
      return { success: false, error: 'الطالب غير موجود.' };
    }

    // نتائج التمارين
    const sheetResults = await prisma.sheetResult.findMany({
      where: { student_id: id },
      include: {
        sheet: {
          select: {
            sheet_name: true,
            level: {
              select: {
                level_name: true
              }
            },
            rule: {
              select: {
                rule_name: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    // تحديات الطالب
    const challenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { challenger_id: id },
          { challenged_id: id }
        ]
      },
      include: {
        challenger: {
          select: {
            student_name: true
          }
        },
        challenged: {
          select: {
            student_name: true
          }
        },
        winner: {
          select: {
            student_name: true
          }
        },
        sheet: {
          select: {
            sheet_name: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    // تحليل الأداء
    const performanceAnalytics = await prisma.performanceAnalytic.findMany({
      where: { student_id: id },
      include: {
        rule: {
          select: {
            rule_name: true,
            difficulty_level: true
          }
        }
      },
      orderBy: { weakness_score: 'desc' },
      take: 5
    });

    // الرسائل غير المقروءة
    const unreadMessages = await prisma.chatMessage.count({
      where: {
        receiver_id: id,
        read_at: null,
        is_approved: true,
        is_flagged: false
      }
    });

    // إحصائيات دقيقة
    const totalAttempts = await prisma.sheetResult.count({
      where: { student_id: id }
    });

    const completedAttempts = await prisma.sheetResult.count({
      where: { 
        student_id: id,
        status: 'completed'
      }
    });

    const totalTimeSpent = await prisma.sheetResult.aggregate({
      where: { student_id: id },
      _sum: {
        total_time_spent: true
      }
    });

    const averageScore = await prisma.sheetResult.aggregate({
      where: { 
        student_id: id,
        status: 'completed'
      },
      _avg: {
        score: true
      }
    });

    // التقدم الأسبوعي
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyProgress = await prisma.sheetResult.groupBy({
      by: ['created_at'],
      where: {
        student_id: id,
        created_at: {
          gte: oneWeekAgo
        }
      },
      _count: {
        result_id: true
      },
      _avg: {
        score: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    return {
      success: true,
      data: {
        student: {
          ...student,
          level: student.level,
          branch: student.branch
        },
        stats: {
          totalAttempts,
          completedAttempts,
          completionRate: totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0,
          totalTimeSpent: totalTimeSpent._sum.total_time_spent || 0,
          averageScore: Math.round(averageScore._avg.score || 0),
          currentStreak: student.current_streak,
          bestStreak: student.best_streak,
          unreadMessages,
          totalScore: student.total_score,
          accuracy: student.total_correct_answers + student.total_wrong_answers > 0
            ? Math.round((student.total_correct_answers / (student.total_correct_answers + student.total_wrong_answers)) * 100)
            : 0
        },
        recentResults: sheetResults.map(result => ({
          id: result.result_id,
          sheetName: result.sheet?.sheet_name || 'غير معروف',
          level: result.sheet?.level?.level_name || 'غير معروف',
          rule: result.sheet?.rule?.rule_name || 'غير معروف',
          score: result.score || 0,
          accuracy: result.accuracy || 0,
          timeSpent: result.total_time_spent || 0,
          status: result.status,
          date: result.created_at
        })),
        recentChallenges: challenges.map(challenge => ({
          id: challenge.challenge_id,
          code: challenge.challenge_code,
          challenger: challenge.challenger?.student_name || 'غير معروف',
          challenged: challenge.challenged?.student_name || 'غير معروف',
          winner: challenge.winner?.student_name || 'لم يتم تحديده',
          sheet: challenge.sheet?.sheet_name || 'غير معروف',
          status: challenge.status,
          startTime: challenge.start_time,
          endTime: challenge.end_time
        })),
        performanceAnalytics: performanceAnalytics.map(analytic => ({
          ruleName: analytic.rule.rule_name,
          difficultyLevel: analytic.rule.difficulty_level,
          totalAttempts: analytic.total_attempts,
          correctAttempts: analytic.correct_attempts,
          averageTime: analytic.average_time,
          weaknessScore: analytic.weakness_score,
          masteryLevel: analytic.mastery_level,
          lastPracticed: analytic.last_practiced
        })),
        weeklyProgress: weeklyProgress.map(day => ({
          date: day.created_at,
          attempts: day._count.result_id,
          averageScore: Math.round(day._avg.score || 0)
        }))
      }
    };
  } catch (error) {
    console.error('Error in getStudentDashboardStats:', error);
    return { success: false, error: 'فشل جلب إحصائيات لوحة التحكم.' };
  }
}

// =================================================================
// الإشعارات والأنشطة الحديثة
// =================================================================
export async function getRecentActivities(studentId) {
  const id = parseInt(studentId);
  if (isNaN(id)) {
    return { success: false, error: 'معرف طالب غير صالح.' };
  }

  try {
    // الأنشطة المختلطة
    const activities = [];

    // 1. نتائج التمارين الحديثة
    const recentResults = await prisma.sheetResult.findMany({
      where: { student_id: id },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        sheet: {
          select: {
            sheet_name: true
          }
        }
      }
    });

    activities.push(...recentResults.map(result => ({
      type: 'sheet_result',
      id: result.result_id,
      title: `إنهاء تمرين: ${result.sheet?.sheet_name || 'غير معروف'}`,
      description: `حصلت على ${result.score || 0}% في ${result.sheet?.sheet_name || 'التدريب'}`,
      icon: '📝',
      color: result.score >= 70 ? 'text-green-600' : 'text-red-600',
      date: result.created_at
    })));

    // 2. تحديات جديدة
    const recentChallenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { challenger_id: id },
          { challenged_id: id }
        ],
        status: 'pending'
      },
      orderBy: { created_at: 'desc' },
      take: 3,
      include: {
        challenger: {
          select: {
            student_name: true
          }
        },
        challenged: {
          select: {
            student_name: true
          }
        }
      }
    });

    activities.push(...recentChallenges.map(challenge => ({
      type: 'challenge',
      id: challenge.challenge_id,
      title: challenge.challenger_id === id 
        ? `تحدي جديد من ${challenge.challenged?.student_name || 'طالب'}`
        : `تحدي مرسل إلى ${challenge.challenger?.student_name || 'طالب'}`,
      description: `رمز التحدي: ${challenge.challenge_code || 'بدون رمز'}`,
      icon: '🎯',
      color: 'text-blue-600',
      date: challenge.created_at
    })));

    // 3. رسائل جديدة
    const recentMessages = await prisma.chatMessage.findMany({
      where: {
        receiver_id: id,
        read_at: null,
        is_approved: true,
        is_flagged: false
      },
      orderBy: { created_at: 'desc' },
      take: 3,
      include: {
        sender: {
          select: {
            student_name: true
          }
        }
      }
    });

    activities.push(...recentMessages.map(message => ({
      type: 'message',
      id: message.message_id,
      title: `رسالة جديدة من ${message.sender?.student_name || 'طالب'}`,
      description: message.message_text.length > 50 
        ? message.message_text.substring(0, 50) + '...' 
        : message.message_text,
      icon: '💬',
      color: 'text-purple-600',
      date: message.created_at
    })));

    // 4. اقتراحات الذكاء الاصطناعي
    const recentSuggestions = await prisma.aiSuggestion.findMany({
      where: {
        student_id: id,
        is_applied: false
      },
      orderBy: { created_at: 'desc' },
      take: 2,
      include: {
        suggestedRule: {
          select: {
            rule_name: true
          }
        },
        suggestedLevel: {
          select: {
            level_name: true
          }
        }
      }
    });

    activities.push(...recentSuggestions.map(suggestion => ({
      type: 'suggestion',
      id: suggestion.suggestion_id,
      title: 'اقتراح تعليمي جديد',
      description: suggestion.reason || 'تحسين مهاراتك في القواعد الرياضية',
      icon: '🤖',
      color: 'text-yellow-600',
      date: suggestion.created_at,
      metadata: {
        rule: suggestion.suggestedRule?.rule_name,
        level: suggestion.suggestedLevel?.level_name,
        confidence: suggestion.confidence_score
      }
    })));

    // ترتيب الأنشطة حسب التاريخ
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      success: true,
      data: activities.slice(0, 10) // إرجاع آخر 10 أنشطة فقط
    };
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    return { success: false, error: 'فشل جلب الأنشطة الحديثة.' };
  }
}

// =================================================================
// التقدم الشهري للطالب
// =================================================================
export async function getMonthlyProgress(studentId) {
  const id = parseInt(studentId);
  if (isNaN(id)) {
    return { success: false, error: 'معرف طالب غير صالح.' };
  }

  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // التقدم اليومي
    const dailyProgress = await prisma.sheetResult.groupBy({
      by: ['created_at'],
      where: {
        student_id: id,
        created_at: {
          gte: oneMonthAgo
        }
      },
      _count: {
        result_id: true
      },
      _avg: {
        score: true,
        accuracy: true
      },
      _sum: {
        total_time_spent: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // الإحصائيات الشهرية
    const monthlyStats = await prisma.sheetResult.aggregate({
      where: {
        student_id: id,
        created_at: {
          gte: oneMonthAgo
        }
      },
      _count: {
        result_id: true
      },
      _avg: {
        score: true,
        accuracy: true,
        speed_rate: true
      },
      _sum: {
        total_correct: true,
        total_wrong: true,
        total_time_spent: true
      }
    });

    // أفضل الأداء
    const bestPerformance = await prisma.sheetResult.findFirst({
      where: {
        student_id: id,
        created_at: {
          gte: oneMonthAgo
        }
      },
      orderBy: {
        score: 'desc'
      },
      include: {
        sheet: {
          select: {
            sheet_name: true
          }
        }
      }
    });

    return {
      success: true,
      data: {
        dailyProgress: dailyProgress.map(day => ({
          date: day.created_at,
          attempts: day._count.result_id,
          averageScore: Math.round(day._avg.score || 0),
          averageAccuracy: Math.round(day._avg.accuracy || 0),
          totalTime: day._sum.total_time_spent || 0
        })),
        monthlyStats: {
          totalAttempts: monthlyStats._count.result_id,
          averageScore: Math.round(monthlyStats._avg.score || 0),
          averageAccuracy: Math.round(monthlyStats._avg.accuracy || 0),
          averageSpeed: Math.round(monthlyStats._avg.speed_rate || 0),
          totalCorrect: monthlyStats._sum.total_correct || 0,
          totalWrong: monthlyStats._sum.total_wrong || 0,
          totalTime: monthlyStats._sum.total_time_spent || 0,
          accuracyRate: (monthlyStats._sum.total_correct || 0) + (monthlyStats._sum.total_wrong || 0) > 0
            ? Math.round((monthlyStats._sum.total_correct || 0) / ((monthlyStats._sum.total_correct || 0) + (monthlyStats._sum.total_wrong || 0)) * 100)
            : 0
        },
        bestPerformance: bestPerformance ? {
          sheetName: bestPerformance.sheet?.sheet_name || 'غير معروف',
          score: bestPerformance.score || 0,
          accuracy: bestPerformance.accuracy || 0,
          timeSpent: bestPerformance.total_time_spent || 0,
          date: bestPerformance.created_at
        } : null
      }
    };
  } catch (error) {
    console.error('Error in getMonthlyProgress:', error);
    return { success: false, error: 'فشل جلب التقدم الشهري.' };
  }
}

// =================================================================
// الأهداف والإنجازات
// =================================================================
export async function getStudentGoals(studentId) {
  const id = parseInt(studentId);
  if (isNaN(id)) {
    return { success: false, error: 'معرف طالب غير صالح.' };
  }

  try {
    const student = await prisma.student.findUnique({
      where: { student_id: id },
      select: {
        total_score: true,
        current_level_id: true,
        current_streak: true,
        best_streak: true,
        total_correct_answers: true,
        total_wrong_answers: true
      }
    });

    if (!student) {
      return { success: false, error: 'الطالب غير موجود.' };
    }

    // الأهداف العامة
    const generalGoals = [
      {
        id: 1,
        title: 'رفع المستوى',
        description: 'تقدم إلى المستوى التالي',
        icon: '⬆️',
        current: student.current_level_id,
        target: student.current_level_id + 1,
        progress: Math.min((student.current_level_id / (student.current_level_id + 1)) * 100, 100)
      },
      {
        id: 2,
        title: 'الشريط اليومي',
        description: 'حافظ على الشريط لمدة 30 يوم',
        icon: '🔥',
        current: student.current_streak,
        target: 30,
        progress: Math.min((student.current_streak / 30) * 100, 100)
      },
      {
        id: 3,
        title: 'مجموع النقاط',
        description: 'احصل على 5000 نقطة',
        icon: '⭐',
        current: student.total_score,
        target: 5000,
        progress: Math.min((student.total_score / 5000) * 100, 100)
      },
      {
        id: 4,
        title: 'دقة الإجابات',
        description: 'حقق دقة 90% في الإجابات',
        icon: '🎯',
        current: student.total_correct_answers + student.total_wrong_answers > 0
          ? Math.round((student.total_correct_answers / (student.total_correct_answers + student.total_wrong_answers)) * 100)
          : 0,
        target: 90,
        progress: Math.min(((student.total_correct_answers / (student.total_correct_answers + student.total_wrong_answers)) * 100 / 90) * 100, 100)
      }
    ];

    // الأهداف المكتملة مؤخراً
    const completedGoals = await prisma.sheetResult.findMany({
      where: {
        student_id: id,
        score: { gte: 90 }
      },
      orderBy: { created_at: 'desc' },
      take: 3,
      include: {
        sheet: {
          select: {
            sheet_name: true
          }
        }
      }
    });

    const formattedCompletedGoals = completedGoals.map(result => ({
      id: result.result_id,
      title: 'إتقان التمرين',
      description: `حقق 90% أو أكثر في ${result.sheet?.sheet_name || 'التدريب'}`,
      icon: '🏆',
      date: result.created_at,
      score: result.score
    }));

    return {
      success: true,
      data: {
        generalGoals,
        completedGoals: formattedCompletedGoals,
        totalGoals: generalGoals.length + formattedCompletedGoals.length,
        completedCount: formattedCompletedGoals.length
      }
    };
  } catch (error) {
    console.error('Error in getStudentGoals:', error);
    return { success: false, error: 'فشل جلب أهداف الطالب.' };
  }
}

// =================================================================
// اقتراحات التعلم
// =================================================================
export async function getLearningSuggestions(studentId) {
  const id = parseInt(studentId);
  if (isNaN(id)) {
    return { success: false, error: 'معرف طالب غير صالح.' };
  }

  try {
    // اقتراحات الذكاء الاصطناعي
    const aiSuggestions = await prisma.aiSuggestion.findMany({
      where: {
        student_id: id,
        is_applied: false
      },
      orderBy: [
        { priority: 'desc' },
        { confidence_score: 'desc' }
      ],
      take: 5,
      include: {
        suggestedRule: {
          select: {
            rule_name: true,
            description: true,
            difficulty_level: true
          }
        },
        suggestedLevel: {
          select: {
            level_name: true,
            description: true
          }
        }
      }
    });

    // القواعد التي تحتاج تحسين
    const weakRules = await prisma.performanceAnalytic.findMany({
      where: {
        student_id: id,
        weakness_score: { gt: 50 }
      },
      orderBy: { weakness_score: 'desc' },
      take: 3,
      include: {
        rule: {
          select: {
            rule_name: true,
            description: true
          }
        }
      }
    });

    // المستوى التالي المقترح
    const student = await prisma.student.findUnique({
      where: { student_id: id },
      select: { current_level_id: true }
    });

    const nextLevel = await prisma.level.findFirst({
      where: {
        level_order: { gt: student?.current_level_id || 1 },
        is_active: true
      },
      orderBy: { level_order: 'asc' }
    });

    const suggestions = [];

    // إضافة اقتراحات الذكاء الاصطناعي
    suggestions.push(...aiSuggestions.map(suggestion => ({
      type: 'ai_suggestion',
      priority: suggestion.priority || 1,
      confidence: suggestion.confidence_score || 0,
      title: suggestion.suggestedRule ? `تحسين مهارة: ${suggestion.suggestedRule.rule_name}` : 'تقدم إلى مستوى جديد',
      description: suggestion.reason || 'اقتراح تعليمي مخصص لك',
      action: suggestion.suggestedRule ? 
        { type: 'practice_rule', ruleId: suggestion.suggested_rule_id } : 
        { type: 'change_level', levelId: suggestion.suggested_level_id },
      icon: '🤖'
    })));

    // إضافة القواعد الضعيفة
    suggestions.push(...weakRules.map(rule => ({
      type: 'weak_rule',
      priority: 2,
      confidence: 100 - (rule.weakness_score || 0),
      title: `تحسين أدائك في: ${rule.rule.rule_name}`,
      description: `هذه القاعدة تحتاج إلى مزيد من الممارسة`,
      action: { type: 'practice_rule', ruleId: rule.rule_id },
      icon: '📉'
    })));

    // إضافة المستوى التالي
    if (nextLevel) {
      suggestions.push({
        type: 'next_level',
        priority: 3,
        confidence: 80,
        title: `المستوى التالي: ${nextLevel.level_name}`,
        description: `أنت جاهز للتقدم إلى ${nextLevel.level_name}`,
        action: { type: 'change_level', levelId: nextLevel.level_id },
        icon: '🚀'
      });
    }

    // ترتيب الاقتراحات حسب الأولوية
    suggestions.sort((a, b) => a.priority - b.priority);

    return {
      success: true,
      data: suggestions
    };
  } catch (error) {
    console.error('Error in getLearningSuggestions:', error);
    return { success: false, error: 'فشل جلب اقتراحات التعلم.' };
  }
}