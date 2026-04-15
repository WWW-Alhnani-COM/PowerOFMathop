// src/actions/challenge.actions.js
'use server'

import { prisma } from '../lib/prisma'
import { getSessionStudentId, validateSession } from './auth.actions'
import { v4 as uuidv4 } from 'uuid'
import { revalidatePath } from 'next/cache'

// ***************************************************************
// 1. تعريف الثوابت
// ***************************************************************
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
// 2. جلب تحديات الطالب مع الإحصائيات
// ***************************************************************
export async function getStudentChallenges(filter = 'all') {
    try {
        const studentId = await getSessionStudentId()
        if (!studentId) return { success: false, error: 'يجب تسجيل الدخول', redirect: '/login' }

        const whereClause = {
            OR: [{ challenger_id: studentId }, { challenged_id: studentId }]
        }
        if (filter !== 'all') whereClause.status = filter

        const challenges = await prisma.challenge.findMany({
            where: whereClause,
            include: {
                challenger: { select: { student_id: true, student_name: true, total_score: true } },
                challenged: { select: { student_id: true, student_name: true, total_score: true } },
                winner: { select: { student_name: true } },
                sheet: {
                    include: {
                        level: { select: { level_name: true, color: true } },
                        rule: { select: { rule_name: true, icon: true } }
                    }
                }
            },
            orderBy: { created_at: 'desc' },
            take: 50
        })

        const processed = challenges.map(c => ({
            ...c,
            sheet: c.sheet ? {
                ...c.sheet,
                difficulty_level: Number(c.sheet.difficulty_level || 1),
                required_score: Number(c.sheet.required_score || 0),
                time_limit: Number(c.sheet.time_limit || 0)
            } : null
        }))

        return { success: true, data: processed }
    } catch (error) {
        console.error('Error fetching challenges:', error)
        return { success: false, error: 'فشل جلب البيانات' }
    }
}

// ***************************************************************
// 3. إنشاء تحدي جديد (مع التحقق من المستوى)
// ***************************************************************
export async function createChallenge({ sheet_id, challenged_id = null, challenge_type = 'full_sheet', is_public = false, time_limit = 10 }) {
    try {
        const session = await validateSession()
        if (!session.success) return session

        const challenger_id = session.data.student_id
        const sheet = await prisma.sheet.findUnique({ where: { sheet_id } })

        if (!sheet) return { success: false, error: 'الورقة غير موجودة' }

        // التأكد من تطابق المستوى برمجياً (تحويل لـ Number لتجنب أخطاء النوع)
        if (Number(session.data.current_level_id) !== Number(sheet.level_id)) {
            return { success: false, error: 'مستواك الحالي لا يسمح لك بإنشاء تحدي لهذه الورقة' }
        }

        const challenge_code = uuidv4().substring(0, 8).toUpperCase()
        const challenge = await prisma.challenge.create({
            data: {
                challenge_code,
                challenger_id,
                challenged_id,
                sheet_id,
                challenge_type,
                status: CHALLENGE_STATUS.PENDING,
                time_limit: time_limit * 60,
                is_public
            }
        })

        revalidatePath('/challenges')
        return { success: true, data: challenge, message: 'تم إنشاء التحدي بنجاح' }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ***************************************************************
// 4. الرد على التحدي (قبول/رفض)
// ***************************************************************
export async function respondToChallenge(challenge_id, response) {
    try {
        const student_id = await getSessionStudentId()
        const challenge = await prisma.challenge.findUnique({ 
            where: { challenge_id },
            include: { sheet: true }
        })

        if (!challenge || challenge.challenged_id !== student_id) 
            return { success: false, error: 'غير مصرح لك' }

        if (response === 'accept') {
            // استخدام Transaction لضمان إنشاء سجلات النتائج للطرفين معاً
            await prisma.$transaction([
                prisma.challengeResult.create({ data: { challenge_id, student_id: challenge.challenger_id, score: 0 } }),
                prisma.challengeResult.create({ data: { challenge_id, student_id: challenge.challenged_id, score: 0 } }),
                prisma.challenge.update({
                    where: { challenge_id },
                    data: { status: CHALLENGE_STATUS.ACCEPTED, start_time: new Date() }
                })
            ])
            return { success: true, message: 'تم قبول التحدي' }
        } else {
            await prisma.challenge.update({
                where: { challenge_id },
                data: { status: CHALLENGE_STATUS.REJECTED }
            })
            return { success: true, message: 'تم رفض التحدي' }
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ***************************************************************
// 5. تسليم إجابة (أثناء اللعب)
// ***************************************************************
export async function submitChallengeAnswer({ challenge_id, problem_data, user_answer, correct_answer, time_spent, is_correct }) {
    try {
        const student_id = await getSessionStudentId()
        
        // البحث عن سجل نتيجة الطالب في هذا التحدي
        const challengeResult = await prisma.challengeResult.findFirst({
            where: { challenge_id, student_id }
        })

        if (!challengeResult) throw new Error('سجل النتيجة غير موجود')

        const updatedResult = await prisma.challengeResult.update({
            where: { challenge_result_id: challengeResult.challenge_result_id },
            data: {
                score: { increment: is_correct ? 10 : -2 },
                correct_answers: { increment: is_correct ? 1 : 0 },
                wrong_answers: { increment: is_correct ? 0 : 1 },
                total_time: { increment: time_spent }
            }
        })

        return { success: true, currentScore: updatedResult.score }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ***************************************************************
// 6. إنهاء التحدي وتحديد الفائز
// ***************************************************************
export async function finishChallenge(challenge_id) {
    try {
        const results = await prisma.challengeResult.findMany({
            where: { challenge_id },
            orderBy: { score: 'desc' }
        })

        if (results.length < 2) return { success: false, error: 'البيانات غير كافية لإغلاق التحدي' }

        // تحديد الفائز أو التعادل
        let winner_id = null
        if (results[0].score > results[1].score) {
            winner_id = results[0].student_id
        } else if (results[1].score > results[0].score) {
            winner_id = results[1].student_id
        }

        await prisma.challenge.update({
            where: { challenge_id },
            data: {
                status: CHALLENGE_STATUS.COMPLETED,
                winner_id: winner_id,
                end_time: new Date()
            }
        })

        // تحديث نقاط الطالب الفائز وزيادة الـ Streak
        if (winner_id) {
            await prisma.student.update({
                where: { student_id: winner_id },
                data: { 
                    total_score: { increment: 50 },
                    current_streak: { increment: 1 }
                }
            })
        }

        revalidatePath('/challenges')
        return { success: true, winner_id }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ***************************************************************
// 7. البحث عن طلاب (Case-insensitive)
// ***************************************************************
export async function searchStudentsForChallenge(query) {
    try {
        const studentId = await getSessionStudentId()
        const students = await prisma.student.findMany({
            where: {
                student_name: { contains: query },
                NOT: { student_id: studentId }
            },
            select: {
                student_id: true,
                student_name: true,
                total_score: true,
                level: { select: { level_name: true, color: true } }
            },
            take: 10
        })
        return { success: true, data: students }
    } catch (error) {
        return { success: false, error: error.message }
    }
}