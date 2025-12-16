// src/actions/challenge.actions.js - مُصحح
'use server'

import { prisma } from '../lib/prisma'
import { getSessionStudentId, validateSession } from './auth.actions'
import { v4 as uuidv4 } from 'uuid'

// ***************************************************************
// تعريف الثوابت
// ***************************************************************

const CHALLENGE_TYPES = {
  QUICK: 'quick',
  FULL_SHEET: 'full_sheet',
  RULE_BASED: 'rule_based',
  CUSTOM: 'custom'
}

const CHALLENGE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
}

// ***************************************************************
// 1. جلب تحديات الطالب
// ***************************************************************

export async function getStudentChallenges(filter = 'all') {
  try {
    const studentId = await getSessionStudentId()
    
    if (!studentId) {
      return {
        success: false,
        error: 'يجب تسجيل الدخول أولاً',
        redirect: '/login'
      }
    }

    const whereClause = {
      OR: [
        { challenger_id: studentId },
        { challenged_id: studentId }
      ]
    }

    if (filter !== 'all') {
      whereClause.status = filter
    }

    const challenges = await prisma.challenge.findMany({
      where: whereClause,
      include: {
        challenger: {
          select: {
            student_id: true,
            student_name: true,
            total_score: true,
            current_streak: true,
            best_streak: true,
            current_level_id: true
          }
        },
        challenged: {
          select: {
            student_id: true,
            student_name: true,
            total_score: true,
            current_streak: true,
            best_streak: true,
            current_level_id: true
          }
        },
        winner: {
          select: {
            student_id: true,
            student_name: true
          }
        },
        sheet: {
          select: {
            sheet_id: true,
            sheet_name: true,
            total_problems: true,
            difficulty_level: true,
            time_limit: true,
            required_score: true,
            level: {
              select: {
                level_name: true,
                color: true
              }
            },
            rule: {
              select: {
                rule_name: true,
                icon: true
              }
            }
          }
        },
        challengeResults: {
          include: {
            student: {
              select: {
                student_id: true,
                student_name: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 50
    })

    // تحويل Decimal إلى number
    const processedChallenges = challenges.map(challenge => ({
      ...challenge,
      sheet: challenge.sheet ? {
        ...challenge.sheet,
        difficulty_level: challenge.sheet.difficulty_level ? Number(challenge.sheet.difficulty_level) : 1,
        required_score: challenge.sheet.required_score ? Number(challenge.sheet.required_score) : 0,
        time_limit: challenge.sheet.time_limit ? Number(challenge.sheet.time_limit) : 0
      } : null
    }))

    // حساب الإحصائيات
    const totalChallenges = processedChallenges.length
    const completedChallenges = processedChallenges.filter(c => c.status === 'completed').length
    const wins = processedChallenges.filter(c => c.winner_id === studentId).length
    const winRate = completedChallenges > 0 ? (wins / completedChallenges) * 100 : 0

    return {
      success: true,
      data: {
        challenges: processedChallenges,
        statistics: {
          total: totalChallenges,
          completed: completedChallenges,
          wins,
          winRate: Math.round(winRate * 100) / 100
        }
      },
      message: 'تم جلب التحديات بنجاح'
    }
  } catch (error) {
    console.error('❌ خطأ في جلب التحديات:', error)
    return {
      success: false,
      error: error.message || 'فشل في جلب التحديات'
    }
  }
}

// ***************************************************************
// 2. إنشاء تحد جديد
// ***************************************************************

export async function createChallenge({
  sheet_id,
  challenged_id = null,
  challenge_type = 'full_sheet',
  is_public = false,
  time_limit = 10
}) {
  try {
    // التحقق من الجلسة
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    const challenger_id = session.data.student_id

    // التحقق من صحة الورقة
    const sheet = await prisma.sheet.findUnique({
      where: { sheet_id },
      include: {
        level: true
      }
    })

    if (!sheet) {
      return {
        success: false,
        error: 'الورقة المحددة غير موجودة'
      }
    }

    // 🔍 أضف هذه السطور للتحقق
    console.log('🔍 ======== بداية تشخيص المشكلة ========');
    console.log('📋 بيانات الطالب:', {
      student_id: session.data.student_id,
      student_name: session.data.student_name,
      current_level_id: session.data.current_level_id,
      نوع_current_level_id: typeof session.data.current_level_id,
      level: session.data.level
    });
    console.log('📋 بيانات الورقة:', {
      sheet_id: sheet.sheet_id,
      sheet_name: sheet.sheet_name,
      level_id: sheet.level_id,
      نوع_level_id: typeof sheet.level_id,
      level: sheet.level
    });
    console.log('🔍 المقارنة:', {
      هل_المتساوي: session.data.current_level_id == sheet.level_id,
      هل_المتطابق: session.data.current_level_id === sheet.level_id,
      الفرق: session.data.current_level_id - sheet.level_id
    });
    console.log('🔍 ======== نهاية التشخيص ========');

    // التحقق من أن المتحدي له نفس مستوى الورقة
    if (session.data.current_level_id !== sheet.level_id) {
      return {
        success: false,
        error: `يجب أن تكون في نفس مستوى الورقة للمشاركة. 
        مستواك: ${session.data.current_level_id} (${session.data.level?.level_name || 'غير معروف'})
        مستوى الورقة: ${sheet.level_id} (${sheet.level?.level_name || 'غير معروف'})`
      }
    }
    
    

    // التحقق من توفر الطالب المتحدى
    if (challenged_id) {
      const challengedStudent = await prisma.student.findUnique({
        where: { 
          student_id: challenged_id
        }
      })

      if (!challengedStudent) {
        return {
          success: false,
          error: 'الطالب المتحدى غير موجود'
        }
      }

      // التحقق من عدم وجود تحدي نشط مع نفس الطالب
      const existingChallenge = await prisma.challenge.findFirst({
        where: {
          OR: [
            { 
              challenger_id, 
              challenged_id, 
              status: { 
                in: ['pending', 'accepted', 'in_progress'] 
              } 
            },
            { 
              challenger_id: challenged_id, 
              challenged_id: challenger_id, 
              status: { 
                in: ['pending', 'accepted', 'in_progress'] 
              } 
            }
          ]
        }
      })

      if (existingChallenge) {
        return {
          success: false,
          error: 'يوجد تحدي قائم بالفعل مع هذا الطالب'
        }
      }
    }

    // توليد كود تحدي فريد
    const challenge_code = uuidv4().substring(0, 8).toUpperCase()

    // إنشاء التحدي
    const challenge = await prisma.challenge.create({
      data: {
        challenge_code,
        challenger_id,
        challenged_id,
        sheet_id,
        challenge_type,
        status: 'pending',
        time_limit: time_limit * 60,
        is_public,
        created_at: new Date()
      },
      include: {
        challenger: {
          select: {
            student_id: true,
            student_name: true,
            current_level_id: true,
            total_score: true,
            current_streak: true,
            best_streak: true
          }
        },
        challenged: challenged_id ? {
          select: {
            student_id: true,
            student_name: true,
            current_level_id: true,
            total_score: true,
            current_streak: true,
            best_streak: true
          }
        } : null,
        sheet: {
          select: {
            sheet_id: true,
            sheet_name: true,
            total_problems: true,
            difficulty_level: true,
            time_limit: true,
            required_score: true,
            level: {
              select: {
                level_name: true,
                color: true
              }
            },
            rule: {
              select: {
                rule_name: true,
                icon: true
              }
            }
          }
        }
      }
    })

    // تحويل Decimal إلى number
    const processedChallenge = {
      ...challenge,
      sheet: challenge.sheet ? {
        ...challenge.sheet,
        difficulty_level: challenge.sheet.difficulty_level ? Number(challenge.sheet.difficulty_level) : 1,
        required_score: challenge.sheet.required_score ? Number(challenge.sheet.required_score) : 0,
        time_limit: challenge.sheet.time_limit ? Number(challenge.sheet.time_limit) : 0
      } : null
    }

    return {
      success: true,
      data: processedChallenge,
      message: 'تم إنشاء التحدي بنجاح'
    }
  } catch (error) {
    console.error('❌ خطأ في إنشاء التحدي:', error)
    return {
      success: false,
      error: error.message || 'فشل في إنشاء التحدي'
    }
  }
}



// ***************************************************************
// 3. جلب التحديات العامة
// ***************************************************************

export async function getPublicChallenges() {
  try {
    // التحقق من الجلسة
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    const student_id = session.data.student_id
    const current_level_id = session.data.current_level_id

    // البحث عن تحديات عامة متاحة
    const publicChallenges = await prisma.challenge.findMany({
      where: {
        is_public: true,
        status: 'pending',
        NOT: {
          OR: [
            { challenger_id: student_id },
            { challenged_id: student_id }
          ]
        },
        sheet: {
          level_id: current_level_id
        }
      },
      include: {
        challenger: {
          select: {
            student_id: true,
            student_name: true,
            current_level_id: true,
            total_score: true,
            best_streak: true
          }
        },
        sheet: {
          select: {
            sheet_id: true,
            sheet_name: true,
            total_problems: true,
            difficulty_level: true,
            time_limit: true,
            level: {
              select: {
                level_name: true
              }
            }
          }
        }
      },
      take: 10,
      orderBy: {
        created_at: 'desc'
      }
    })

    // تحويل Decimal إلى number
    const processedChallenges = publicChallenges.map(challenge => ({
      ...challenge,
      sheet: challenge.sheet ? {
        ...challenge.sheet,
        difficulty_level: challenge.sheet.difficulty_level ? Number(challenge.sheet.difficulty_level) : 1,
        time_limit: challenge.sheet.time_limit ? Number(challenge.sheet.time_limit) : 0
      } : null
    }))

    return {
      success: true,
      data: processedChallenges,
      message: 'تم جلب التحديات العامة'
    }
  } catch (error) {
    console.error('❌ خطأ في جلب التحديات العامة:', error)
    return {
      success: false,
      error: error.message || 'فشل في جلب التحديات'
    }
  }
}

// ***************************************************************
// 4. الحصول على تفاصيل تحدي
// ***************************************************************

export async function getChallengeDetails(challenge_id) {
  try {
    // التحقق من أن challenge_id هو رقم
    const id = parseInt(challenge_id)
    
    if (isNaN(id)) {
      return {
        success: false,
        error: 'معرف التحدي غير صالح'
      }
    }

    // التحقق من الجلسة
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    const student_id = session.data.student_id

    const challenge = await prisma.challenge.findFirst({
      where: {
        challenge_id: id,
        OR: [
          { challenger_id: student_id },
          { challenged_id: student_id }
        ]
      },
      include: {
        challenger: {
          select: {
            student_id: true,
            student_name: true,
            total_score: true,
            current_streak: true,
            best_streak: true,
            current_level_id: true,
            level: {
              select: {
                level_name: true,
                color: true,
                icon: true
              }
            }
          }
        },
        challenged: {
          select: {
            student_id: true,
            student_name: true,
            total_score: true,
            current_streak: true,
            best_streak: true,
            current_level_id: true,
            level: {
              select: {
                level_name: true,
                color: true,
                icon: true
              }
            }
          }
        },
        winner: {
          select: {
            student_id: true,
            student_name: true
          }
        },
        sheet: {
          select: {
            sheet_id: true,
            sheet_name: true,
            total_problems: true,
            difficulty_level: true,
            time_limit: true,
            required_score: true,
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
                icon: true,
                description: true
              }
            }
          }
        },
        challengeResults: {
          include: {
            student: {
              select: {
                student_id: true,
                student_name: true
              }
            },
            sheetResult: {
              include: {
                answerDetails: {
                  orderBy: {
                    sequence_number: 'asc'
                  },
                  select: {
                    answer_id: true,
                    problem_data: true,
                    user_answer: true,
                    correct_answer: true,
                    is_correct: true,
                    time_spent: true,
                    sequence_number: true,
                    created_at: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!challenge) {
      return {
        success: false,
        error: 'التحدي غير موجود أو غير مصرح لك بالوصول إليه'
      }
    }

    // تحويل Decimal إلى number
    const processedChallenge = {
      ...challenge,
      sheet: challenge.sheet ? {
        ...challenge.sheet,
        difficulty_level: challenge.sheet.difficulty_level ? Number(challenge.sheet.difficulty_level) : 1,
        required_score: challenge.sheet.required_score ? Number(challenge.sheet.required_score) : 0,
        time_limit: challenge.sheet.time_limit ? Number(challenge.sheet.time_limit) : 0
      } : null,
      challengeResults: challenge.challengeResults ? challenge.challengeResults.map(result => ({
        ...result,
        sheetResult: result.sheetResult ? {
          ...result.sheetResult,
          score: result.sheetResult.score ? Number(result.sheetResult.score) : 0,
          accuracy: result.sheetResult.accuracy ? Number(result.sheetResult.accuracy) : 0,
          speed_rate: result.sheetResult.speed_rate ? Number(result.sheetResult.speed_rate) : 0
        } : null
      })) : []
    }

    return {
      success: true,
      data: processedChallenge,
      message: 'تم جلب تفاصيل التحدي'
    }
  } catch (error) {
    console.error('❌ خطأ في جلب تفاصيل التحدي:', error)
    return {
      success: false,
      error: error.message || 'فشل في جلب التفاصيل'
    }
  }
}

// ***************************************************************
// 5. الرد على التحدي (قبول/رفض)
// ***************************************************************

export async function respondToChallenge(challenge_id, response) {
  try {
    // التحقق من الجلسة
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    const student_id = session.data.student_id

    // التحقق من صحة التحدي
    const challenge = await prisma.challenge.findUnique({
      where: { challenge_id },
      include: {
        challenger: true,
        challenged: true,
        sheet: true
      }
    })

    if (!challenge) {
      return {
        success: false,
        error: 'التحدي غير موجود'
      }
    }

    if (challenge.challenged_id !== student_id) {
      return {
        success: false,
        error: 'غير مصرح لك بالرد على هذا التحدي'
      }
    }

    if (challenge.status !== 'pending') {
      return {
        success: false,
        error: 'التحدي لم يعد في انتظار القبول'
      }
    }

    let updatedChallenge

    if (response === 'accept') {
      // التحقق من أن الطالب في نفس مستوى التحدي
      if (session.data.current_level_id !== challenge.challenger.current_level_id) {
        return {
          success: false,
          error: 'يجب أن تكون في نفس مستوى التحدي للمشاركة'
        }
      }

      // حساب وقت البدء (بعد 5 ثواني)
      const start_time = new Date(Date.now() + 5000)
      
      updatedChallenge = await prisma.challenge.update({
        where: { challenge_id },
        data: {
          status: 'accepted',
          start_time
        },
        include: {
          challenger: {
            select: { 
              student_id: true,
              student_name: true 
            }
          },
          challenged: {
            select: { 
              student_id: true,
              student_name: true 
            }
          },
          sheet: {
            select: {
              sheet_id: true,
              sheet_name: true,
              time_limit: true,
              total_problems: true
            }
          }
        }
      })

    } else if (response === 'reject') {
      updatedChallenge = await prisma.challenge.update({
        where: { challenge_id },
        data: {
          status: 'rejected',
          end_time: new Date()
        }
      })
    } else {
      return {
        success: false,
        error: 'رد غير صالح. استخدم "accept" أو "reject"'
      }
    }

    // تحويل Decimal إلى number
    const processedChallenge = updatedChallenge.sheet ? {
      ...updatedChallenge,
      sheet: {
        ...updatedChallenge.sheet,
        time_limit: updatedChallenge.sheet.time_limit ? Number(updatedChallenge.sheet.time_limit) : 0
      }
    } : updatedChallenge

    return {
      success: true,
      data: processedChallenge,
      message: response === 'accept' ? 'تم قبول التحدي' : 'تم رفض التحدي'
    }
  } catch (error) {
    console.error('❌ خطأ في الرد على التحدي:', error)
    return {
      success: false,
      error: error.message || 'فشل في الرد على التحدي'
    }
  }
}

// ***************************************************************
// 6. إلغاء التحدي
// ***************************************************************

export async function cancelChallenge(challenge_id) {
  try {
    // التحقق من الجلسة
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    const student_id = session.data.student_id

    const challenge = await prisma.challenge.findUnique({
      where: { challenge_id }
    })

    if (!challenge) {
      return {
        success: false,
        error: 'التحدي غير موجود'
      }
    }

    if (challenge.challenger_id !== student_id) {
      return {
        success: false,
        error: 'فقط منشئ التحدي يمكنه إلغاؤه'
      }
    }

    if (challenge.status !== 'pending') {
      return {
        success: false,
        error: 'لا يمكن إلغاء التحدي بعد قبوله'
      }
    }

    const updatedChallenge = await prisma.challenge.update({
      where: { challenge_id },
      data: {
        status: 'cancelled',
        end_time: new Date()
      }
    })

    return {
      success: true,
      data: updatedChallenge,
      message: 'تم إلغاء التحدي'
    }
  } catch (error) {
    console.error('❌ خطأ في إلغاء التحدي:', error)
    return {
      success: false,
      error: error.message || 'فشل في إلغاء التحدي'
    }
  }
}

// ***************************************************************
// 7. جلب التحديات النشطة
// ***************************************************************

export async function getActiveChallenges() {
  try {
    // التحقق من الجلسة
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    const student_id = session.data.student_id

    const challenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { challenger_id: student_id },
          { challenged_id: student_id }
        ],
        status: {
          in: ['pending', 'accepted', 'in_progress']
        }
      },
      include: {
        challenger: {
          select: {
            student_id: true,
            student_name: true,
            current_level_id: true,
            level: {
              select: {
                level_name: true,
                color: true
              }
            }
          }
        },
        challenged: {
          select: {
            student_id: true,
            student_name: true,
            current_level_id: true,
            level: {
              select: {
                level_name: true,
                color: true
              }
            }
          }
        },
        sheet: {
          select: {
            sheet_name: true,
            total_problems: true,
            time_limit: true,
            level: {
              select: {
                level_name: true
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { created_at: 'desc' }
      ]
    })

    // تحويل Decimal إلى number
    const processedChallenges = challenges.map(challenge => ({
      ...challenge,
      sheet: challenge.sheet ? {
        ...challenge.sheet,
        time_limit: challenge.sheet.time_limit ? Number(challenge.sheet.time_limit) : 0
      } : null
    }))

    return {
      success: true,
      data: processedChallenges,
      message: 'تم جلب التحديات النشطة'
    }
  } catch (error) {
    console.error('❌ خطأ في جلب التحديات النشطة:', error)
    return {
      success: false,
      error: error.message || 'فشل في جلب التحديات النشطة'
    }
  }
}

// ***************************************************************
// 8. جلب الورقات المتاحة للتحدي - تعريف واحد فقط
// ***************************************************************

export async function getAvailableSheetsForChallenge() {
  try {
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    const currentLevelId = session.data.current_level_id

    const sheets = await prisma.sheet.findMany({
      where: {
        level_id: currentLevelId,
        is_active: true
      },
      select: {
        sheet_id: true,
        sheet_name: true,
        total_problems: true,
        difficulty_level: true,
        time_limit: true,
        required_score: true,
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
            icon: true,
            description: true
          }
        }
      },
      orderBy: [
        { difficulty_level: 'asc' },
        { sheet_name: 'asc' }
      ]
    })

    // تحويل Decimal إلى number
    const processedSheets = sheets.map(sheet => ({
      ...sheet,
      difficulty_level: sheet.difficulty_level ? Number(sheet.difficulty_level) : 1,
      required_score: sheet.required_score ? Number(sheet.required_score) : 0,
      time_limit: sheet.time_limit ? Number(sheet.time_limit) : 0
    }))

    return {
      success: true,
      data: processedSheets,
      message: processedSheets.length > 0 
        ? `تم العثور على ${processedSheets.length} ورقة`
        : 'لا توجد ورقات متاحة لمستواك الحالي'
    }
  } catch (error) {
    console.error('❌ خطأ في جلب الورقات المتاحة:', error)
    return {
      success: false,
      error: error.message || 'فشل في جلب الورقات المتاحة'
    }
  }
}

// ***************************************************************
// 9. بدء التحدي
// ***************************************************************

export async function startChallenge(challenge_id) {
  try {
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    const student_id = session.data.student_id

    const challenge = await prisma.challenge.findFirst({
      where: {
        challenge_id,
        OR: [
          { challenger_id: student_id },
          { challenged_id: student_id }
        ]
      }
    })

    if (!challenge) {
      return {
        success: false,
        error: 'التحدي غير موجود أو غير مصرح لك بالوصول إليه'
      }
    }

    if (challenge.status !== 'accepted') {
      return {
        success: false,
        error: 'التحدي غير جاهز للبدء'
      }
    }

    // تحديث حالة التحدي إلى "جاري"
    const updatedChallenge = await prisma.challenge.update({
      where: { challenge_id },
      data: {
        status: 'in_progress',
        start_time: new Date()
      },
      include: {
        challenger: {
          select: {
            student_id: true,
            student_name: true
          }
        },
        challenged: {
          select: {
            student_id: true,
            student_name: true
          }
        },
        sheet: {
          select: {
            sheet_id: true,
            sheet_name: true,
            time_limit: true,
            total_problems: true
          }
        }
      }
    })

    return {
      success: true,
      data: updatedChallenge,
      message: 'تم بدء التحدي'
    }
  } catch (error) {
    console.error('❌ خطأ في بدء التحدي:', error)
    return {
      success: false,
      error: error.message || 'فشل في بدء التحدي'
    }
  }
}

// ***************************************************************
// 10. البحث عن طلاب للتحدي
// ***************************************************************

export async function searchStudentsForChallenge(query, excludeCurrent = true) {
  try {
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    const currentStudentId = session.data.student_id
    const currentLevelId = session.data.current_level_id

    // استخدام raw query لـ MySQL للحصول على بحث case-insensitive
    let sqlQuery = `
      SELECT 
        s.student_id,
        s.student_name,
        s.total_score,
        s.current_streak,
        s.best_streak,
        s.current_level_id,
        l.level_name,
        l.color
      FROM students s
      LEFT JOIN levels l ON s.current_level_id = l.level_id
      WHERE s.student_name LIKE ?
    `
    
    const params = [`%${query}%`]
    
    // إضافة شرط المستوى إذا كان موجوداً
    if (currentLevelId) {
      sqlQuery += ` AND s.current_level_id = ?`
      params.push(currentLevelId)
    }
    
    // استبعاد الطالب الحالي إذا طُلب
    if (excludeCurrent) {
      sqlQuery += ` AND s.student_id != ?`
      params.push(currentStudentId)
    }
    
    sqlQuery += ` ORDER BY s.total_score DESC LIMIT 10`
    
    const students = await prisma.$queryRawUnsafe(sqlQuery, ...params)
    
    // تحويل النتائج إلى التنسيق المطلوب
    const formattedStudents = students.map(student => ({
      student_id: student.student_id,
      student_name: student.student_name,
      total_score: student.total_score,
      current_streak: student.current_streak,
      best_streak: student.best_streak,
      current_level_id: student.current_level_id,
      level: {
        level_name: student.level_name,
        color: student.color
      }
    }))

    return {
      success: true,
      data: formattedStudents
    }
  } catch (error) {
    console.error('❌ خطأ في البحث عن طلاب:', error)
    return {
      success: false,
      error: error.message || 'فشل في البحث عن طلاب'
    }
  }
}

// ***************************************************************
// دوال لصفحة play
// ***************************************************************

export async function submitChallengeAnswer({
  challenge_id,
  problem_data,
  user_answer,
  correct_answer,
  time_spent,
  is_correct
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

    const student_id = session.data.student_id

    // البحث عن نتيجة التحدي للطالب
    const challengeResult = await prisma.challengeResult.findFirst({
      where: {
        challenge_id,
        student_id
      },
      include: {
        sheetResult: true
      }
    })

    if (!challengeResult) {
      return {
        success: false,
        error: 'لم يتم العثور على نتيجة التحدي'
      }
    }

    // تحديث نتيجة الورقة
    const updatedSheetResult = await prisma.sheetResult.update({
      where: { result_id: challengeResult.sheet_result_id },
      data: {
        total_correct: is_correct ? { increment: 1 } : undefined,
        total_wrong: !is_correct ? { increment: 1 } : undefined,
        total_time_spent: { increment: time_spent },
        score: is_correct ? { increment: 10 } : { decrement: 2 },
        accuracy: await calculateAccuracy(challengeResult.sheet_result_id)
      }
    })

    // إضافة تفاصيل الإجابة
    const sequenceNumber = await prisma.answerDetail.count({
      where: { result_id: challengeResult.sheet_result_id }
    }) + 1

    await prisma.answerDetail.create({
      data: {
        result_id: challengeResult.sheet_result_id,
        problem_data: JSON.stringify(problem_data),
        user_answer,
        correct_answer,
        time_spent,
        is_correct,
        sequence_number: sequenceNumber
      }
    })

    // تحديث نتيجة التحدي
    const updatedChallengeResult = await prisma.challengeResult.update({
      where: { challenge_result_id: challengeResult.challenge_result_id },
      data: {
        score: is_correct ? { increment: 10 } : { decrement: 2 },
        correct_answers: is_correct ? { increment: 1 } : undefined,
        wrong_answers: !is_correct ? { increment: 1 } : undefined,
        total_time: { increment: time_spent }
      }
    })

    return {
      success: true,
      data: {
        sheetResult: updatedSheetResult,
        challengeResult: updatedChallengeResult
      },
      message: 'تم حفظ الإجابة'
    }
  } catch (error) {
    console.error('❌ خطأ في حفظ الإجابة:', error)
    return {
      success: false,
      error: error.message || 'فشل في حفظ الإجابة'
    }
  }
}

// دالة مساعدة لحساب الدقة
async function calculateAccuracy(result_id) {
  const result = await prisma.sheetResult.findUnique({
    where: { result_id },
    include: {
      answerDetails: true
    }
  })

  if (!result || result.answerDetails.length === 0) {
    return 0
  }

  const correctAnswers = result.answerDetails.filter(a => a.is_correct).length
  const totalAnswers = result.answerDetails.length
  
  return (correctAnswers / totalAnswers) * 100
}

export async function completeChallenge(challenge_id, results) {
  try {
    const session = await validateSession()
    if (!session.success) {
      return {
        success: false,
        error: session.error,
        redirect: session.redirect
      }
    }

    const student_id = session.data.student_id

    // تحديث التحدي
    const updatedChallenge = await prisma.challenge.update({
      where: { challenge_id },
      data: {
        end_time: new Date(),
        status: 'completed'
      }
    })

    // تحديث نتيجة التحدي
    const challengeResult = await prisma.challengeResult.update({
      where: {
        challenge_id_student_id: {
          challenge_id,
          student_id
        }
      },
      data: {
        score: results.score,
        correct_answers: results.correct,
        wrong_answers: results.wrong,
        total_time: results.totalTime
      },
      include: {
        sheetResult: true
      }
    })

    // تحديث نتيجة الورقة
    if (challengeResult.sheetResult) {
      await prisma.sheetResult.update({
        where: { result_id: challengeResult.sheet_result_id },
        data: {
          end_time: new Date(),
          status: 'completed',
          total_correct: results.correct,
          total_wrong: results.wrong,
          total_time_spent: results.totalTime,
          score: results.score,
          accuracy: results.correct > 0 ? (results.correct / (results.correct + results.wrong)) * 100 : 0
        }
      })
    }

    // تحديث إحصائيات الطالب
    await prisma.student.update({
      where: { student_id },
      data: {
        total_score: { increment: results.score },
        total_correct_answers: { increment: results.correct },
        total_wrong_answers: { increment: results.wrong },
        total_time_spent: { increment: results.totalTime },
        current_streak: results.score > 50 ? { increment: 1 } : { set: 0 },
        best_streak: {
          set: await calculateBestStreak(student_id, results.score > 50)
        }
      }
    })

    return {
      success: true,
      data: updatedChallenge,
      message: 'تم إكمال التحدي بنجاح'
    }
  } catch (error) {
    console.error('❌ خطأ في إكمال التحدي:', error)
    return {
      success: false,
      error: error.message || 'فشل في إكمال التحدي'
    }
  }
}

// دالة مساعدة لحساب أفضل سلسلة نجاح
async function calculateBestStreak(student_id, currentWin) {
  const student = await prisma.student.findUnique({
    where: { student_id }
  })

  if (currentWin) {
    const newStreak = student.current_streak + 1
    return Math.max(student.best_streak, newStreak)
  }

  return student.best_streak
}

// ***************************************************************
// الثوابت
// ***************************************************************

export async function getChallengeTypes() {
  return CHALLENGE_TYPES
}

export async function getChallengeStatus() {
  return CHALLENGE_STATUS
}

export async function getCHALLENGE_TYPES() {
  return {
    QUICK: 'quick',
    FULL_SHEET: 'full_sheet',
    RULE_BASED: 'rule_based',
    CUSTOM: 'custom'
  }
}

export async function getCHALLENGE_STATUS() {
  return {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  }
}