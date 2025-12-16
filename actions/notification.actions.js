import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from './auth.actions';

/**
 * أنواع الإشعارات (مطابقة لـ schema)
 */
export const NOTIFICATION_TYPES = {
  CHALLENGE: 'challenge',
  ACHIEVEMENT: 'achievement',
  SYSTEM: 'system',
  FRIEND: 'friend',
  PROGRESS: 'progress',
  REMINDER: 'reminder',
  WELCOME: 'welcome',
  GENERAL: 'general'
};

/**
 * حالة الإشعار (بناءً على حقل is_read في الـ schema)
 */
export const NOTIFICATION_STATUS = {
  UNREAD: false,
  READ: true
};

/**
 * 1. إنشاء إشعار جديد - متوافق تماماً
 */
export async function createNotification({
  student_id,
  title,
  message,
  type = 'general',
  data = null,
  is_read = false
}) {
  try {
    // التحقق من صحة الطالب
    const student = await prisma.student.findUnique({
      where: { student_id },
      select: { student_id: true, student_name: true }
    });

    if (!student) {
      throw new Error('الطالب غير موجود');
    }

    // إنشاء الإشعار
    const notification = await prisma.notification.create({
      data: {
        student_id,
        title,
        message,
        type,
        data: data ? JSON.stringify(data) : null,
        is_read,
        created_at: new Date()
      },
      include: {
        student: {
          select: {
            student_id: true,
            student_name: true,
            current_level_id: true
          }
        }
      }
    });

    // إرجاع البيانات المنسقة
    return {
      success: true,
      data: {
        notification_id: notification.notification_id,
        student_id: notification.student_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data ? JSON.parse(notification.data) : null,
        is_read: notification.is_read,
        created_at: notification.created_at,
        student: notification.student
      },
      message: 'تم إنشاء الإشعار بنجاح'
    };
  } catch (error) {
    console.error('خطأ في إنشاء الإشعار:', error);
    return {
      success: false,
      error: error.message || 'فشل في إنشاء الإشعار'
    };
  }
}

/**
 * 2. الحصول على إشعارات الطالب - متوافق
 */
export async function getStudentNotifications({
  student_id,
  page = 1,
  limit = 20,
  unread_only = false,
  type = null,
  sort_by = 'created_at',
  sort_order = 'desc'
}) {
  try {
    // التحقق من صحة الطالب
    const student = await prisma.student.findUnique({
      where: { student_id },
      select: { student_id: true }
    });

    if (!student) {
      throw new Error('الطالب غير موجود');
    }

    // بناء شرط البحث
    const whereClause = {
      student_id
    };

    if (unread_only) {
      whereClause.is_read = false;
    }

    if (type && Object.values(NOTIFICATION_TYPES).includes(type)) {
      whereClause.type = type;
    }

    const skip = (page - 1) * limit;

    // جلب البيانات
    const [notifications, total_count, unread_count] = await Promise.all([
      // جلب الإشعارات
      prisma.notification.findMany({
        where: whereClause,
        select: {
          notification_id: true,
          student_id: true,
          title: true,
          message: true,
          type: true,
          data: true,
          is_read: true,
          created_at: true,
          student: {
            select: {
              student_id: true,
              student_name: true,
              current_level_id: true
            }
          }
        },
        orderBy: {
          [sort_by]: sort_order
        },
        skip,
        take: limit
      }),
      
      // إجمالي عدد الإشعارات
      prisma.notification.count({
        where: whereClause
      }),
      
      // عدد الإشعارات غير المقروءة
      prisma.notification.count({
        where: {
          student_id,
          is_read: false
        }
      })
    ]);

    // تنسيق البيانات
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null
    }));

    return {
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total_count,
          pages: Math.ceil(total_count / limit),
          has_more: (page * limit) < total_count
        },
        counts: {
          total: total_count,
          unread: unread_count,
          read: total_count - unread_count
        }
      },
      message: 'تم جلب الإشعارات بنجاح'
    };
  } catch (error) {
    console.error('خطأ في جلب الإشعارات:', error);
    return {
      success: false,
      error: error.message || 'فشل في جلب الإشعارات'
    };
  }
}

/**
 * 3. تحديث حالة قراءة الإشعار - متوافق
 */
export async function markNotificationAsRead(notification_id, student_id = null) {
  try {
    // التحقق من وجود الإشعار
    const notification = await prisma.notification.findUnique({
      where: { notification_id }
    });

    if (!notification) {
      throw new Error('الإشعار غير موجود');
    }

    // التحقق من أن الطالب مالك الإشعار (إذا تم توفير student_id)
    if (student_id && notification.student_id !== student_id) {
      throw new Error('غير مصرح لك بتحديث هذا الإشعار');
    }

    // تحديث حالة القراءة
    const updatedNotification = await prisma.notification.update({
      where: { notification_id },
      data: {
        is_read: true
      },
      include: {
        student: {
          select: {
            student_id: true,
            student_name: true
          }
        }
      }
    });

    return {
      success: true,
      data: {
        notification_id: updatedNotification.notification_id,
        is_read: updatedNotification.is_read,
        student: updatedNotification.student
      },
      message: 'تم تحديث حالة الإشعار كمقروء'
    };
  } catch (error) {
    console.error('خطأ في تحديث الإشعار:', error);
    return {
      success: false,
      error: error.message || 'فشل في تحديث الإشعار'
    };
  }
}

/**
 * 4. تحديث جميع إشعارات الطالب كمقروءة - متوافق
 */
export async function markAllNotificationsAsRead(student_id) {
  try {
    // التحقق من صحة الطالب
    const student = await prisma.student.findUnique({
      where: { student_id },
      select: { student_id: true }
    });

    if (!student) {
      throw new Error('الطالب غير موجود');
    }

    // تحديث جميع الإشعارات غير المقروءة
    const result = await prisma.notification.updateMany({
      where: {
        student_id,
        is_read: false
      },
      data: {
        is_read: true
      }
    });

    return {
      success: true,
      data: {
        updated_count: result.count,
        student_id
      },
      message: `تم تحديث ${result.count} إشعار كمقروء`
    };
  } catch (error) {
    console.error('خطأ في تحديث جميع الإشعارات:', error);
    return {
      success: false,
      error: error.message || 'فشل في تحديث جميع الإشعارات'
    };
  }
}

/**
 * 5. حذف إشعار - متوافق
 */
export async function deleteNotification(notification_id, student_id = null) {
  try {
    // التحقق من وجود الإشعار
    const notification = await prisma.notification.findUnique({
      where: { notification_id }
    });

    if (!notification) {
      throw new Error('الإشعار غير موجود');
    }

    // التحقق من أن الطالب مالك الإشعار (إذا تم توفير student_id)
    if (student_id && notification.student_id !== student_id) {
      throw new Error('غير مصرح لك بحذف هذا الإشعار');
    }

    // حذف الإشعار
    await prisma.notification.delete({
      where: { notification_id }
    });

    return {
      success: true,
      data: {
        notification_id,
        deleted: true
      },
      message: 'تم حذف الإشعار بنجاح'
    };
  } catch (error) {
    console.error('خطأ في حذف الإشعار:', error);
    return {
      success: false,
      error: error.message || 'فشل في حذف الإشعار'
    };
  }
}

/**
 * 6. حذف جميع إشعارات الطالب - متوافق
 */
export async function deleteAllNotifications(student_id, delete_read_only = false) {
  try {
    // التحقق من صحة الطالب
    const student = await prisma.student.findUnique({
      where: { student_id },
      select: { student_id: true }
    });

    if (!student) {
      throw new Error('الطالب غير موجود');
    }

    // بناء شرط الحذف
    const whereClause = {
      student_id
    };

    if (delete_read_only) {
      whereClause.is_read = true;
    }

    // حذف الإشعارات
    const result = await prisma.notification.deleteMany({
      where: whereClause
    });

    return {
      success: true,
      data: {
        deleted_count: result.count,
        student_id,
        delete_read_only
      },
      message: `تم حذف ${result.count} إشعار`
    };
  } catch (error) {
    console.error('خطأ في حذف جميع الإشعارات:', error);
    return {
      success: false,
      error: error.message || 'فشل في حذف جميع الإشعارات'
    };
  }
}

/**
 * 7. إنشاء إشعارات جماعية - متوافق
 */
export async function createBulkNotifications(notifications) {
  try {
    // تنسيق البيانات للإدخال الجماعي
    const formattedNotifications = notifications.map(notification => ({
      student_id: notification.student_id,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'general',
      data: notification.data ? JSON.stringify(notification.data) : null,
      is_read: notification.is_read || false,
      created_at: notification.created_at || new Date()
    }));

    // التحقق من وجود الطلاب
    const studentIds = [...new Set(notifications.map(n => n.student_id))];
    const existingStudents = await prisma.student.findMany({
      where: {
        student_id: { in: studentIds }
      },
      select: { student_id: true }
    });

    const existingStudentIds = new Set(existingStudents.map(s => s.student_id));
    const invalidStudentIds = studentIds.filter(id => !existingStudentIds.has(id));

    if (invalidStudentIds.length > 0) {
      throw new Error(`طلاب غير موجودين: ${invalidStudentIds.join(', ')}`);
    }

    // إنشاء الإشعارات بشكل جماعي
    const result = await prisma.notification.createMany({
      data: formattedNotifications,
      skipDuplicates: true
    });

    return {
      success: true,
      data: {
        created_count: result.count,
        total_requested: notifications.length,
        skipped: notifications.length - result.count
      },
      message: `تم إنشاء ${result.count} إشعار`
    };
  } catch (error) {
    console.error('خطأ في إنشاء إشعارات جماعية:', error);
    return {
      success: false,
      error: error.message || 'فشل في إنشاء إشعارات جماعية'
    };
  }
}

/**
 * 8. إنشاء إشعار تحدي - دالة مساعدة
 */
export async function createChallengeNotification(challengeData) {
  try {
    const { challenger, challenged, notification_type = 'challenge_new' } = challengeData;
    
    // تحديد بيانات الإشعار بناءً على نوع الإشعار
    let notificationConfig = {
      title: '🎮 تحديث تحدي',
      message: 'تحديث جديد في التحدي الخاص بك.',
      type: NOTIFICATION_TYPES.CHALLENGE
    };

    switch (notification_type) {
      case 'challenge_new':
        notificationConfig = {
          title: '🎮 تحدي جديد!',
          message: `${challenger?.student_name || 'طالب'} يتحداك في مسابقة رياضية!`,
          type: NOTIFICATION_TYPES.CHALLENGE
        };
        break;
        
      case 'challenge_accepted':
        notificationConfig = {
          title: '✅ تحدي مقبول',
          message: `${challenger?.student_name || 'طالب'} قبل تحديك! استعد للبدء.`,
          type: NOTIFICATION_TYPES.CHALLENGE
        };
        break;
        
      case 'challenge_rejected':
        notificationConfig = {
          title: '❌ تحدي مرفوض',
          message: `${challenger?.student_name || 'طالب'} رفض تحديك.`,
          type: NOTIFICATION_TYPES.CHALLENGE
        };
        break;
        
      case 'challenge_cancelled':
        notificationConfig = {
          title: '🚫 تحدي ملغي',
          message: `${challenger?.student_name || 'طالب'} ألغى التحدي.`,
          type: NOTIFICATION_TYPES.CHALLENGE
        };
        break;
        
      case 'challenge_started':
        notificationConfig = {
          title: '🏁 التحدي بدأ!',
          message: 'التحدي قد بدأ! حان وقت الإجابة.',
          type: NOTIFICATION_TYPES.CHALLENGE
        };
        break;
        
      case 'challenge_winner':
        notificationConfig = {
          title: '🏆 فوز في تحدي!',
          message: `مبروك! لقد فزت في التحدي ضد ${challenger?.student_name || 'طالب'}.`,
          type: NOTIFICATION_TYPES.ACHIEVEMENT
        };
        break;
        
      case 'challenge_loss':
        notificationConfig = {
          title: '💪 حاول مرة أخرى',
          message: `لقد خسرت في التحدي ضد ${challenger?.student_name || 'طالب'}. لا تستسلم!`,
          type: NOTIFICATION_TYPES.PROGRESS
        };
        break;
    }

    // تحديد الطالب المستهدف
    const targetStudentId = challenged?.student_id || challengeData.challenged_id;
    
    if (!targetStudentId) {
      throw new Error('لم يتم تحديد الطالب المستهدف للإشعار');
    }

    // إنشاء الإشعار
    return await createNotification({
      student_id: targetStudentId,
      title: notificationConfig.title,
      message: notificationConfig.message,
      type: notificationConfig.type,
      data: challengeData,
      is_read: false
    });
  } catch (error) {
    console.error('خطأ في إنشاء إشعار التحدي:', error);
    return {
      success: false,
      error: error.message || 'فشل في إنشاء إشعار التحدي'
    };
  }
}

/**
 * 9. إنشاء إشعار إنجاز - متوافق
 */
export async function createAchievementNotification(student_id, achievement) {
  try {
    // التحقق من صحة الطالب
    const student = await prisma.student.findUnique({
      where: { student_id },
      select: { student_id: true, student_name: true }
    });

    if (!student) {
      throw new Error('الطالب غير موجود');
    }

    // تحديد بيانات الإنجاز
    const achievements = {
      level_up: {
        title: '⭐ مستوى جديد!',
        message: `مبروك ${student.student_name}! لقد تقدمت إلى مستوى أعلى.`,
        type: NOTIFICATION_TYPES.ACHIEVEMENT
      },
      streak_record: {
        title: '🔥 رقم قياسي جديد!',
        message: `أحسنت ${student.student_name}! لقد حطمت رقمك القياسي في سلسلة الإجابات الصحيحة.`,
        type: NOTIFICATION_TYPES.ACHIEVEMENT
      },
      perfect_score: {
        title: '💯 نتيجة مثالية!',
        message: `مذهل ${student.student_name}! حصلت على 100% في التدريب الأخير.`,
        type: NOTIFICATION_TYPES.ACHIEVEMENT
      },
      first_challenge: {
        title: '🎯 أول تحدي مكتمل!',
        message: `أحسنت ${student.student_name}! لقد أكملت أول تحدي لك بنجاح.`,
        type: NOTIFICATION_TYPES.ACHIEVEMENT
      },
      top_rank: {
        title: '👑 مركز متقدم!',
        message: `تهانينا ${student.student_name}! لقد تقدمت إلى مركز متقدم في التصنيف.`,
        type: NOTIFICATION_TYPES.ACHIEVEMENT
      },
      daily_streak: {
        title: '📅 سلسلة أيام!',
        message: `مستمر ${student.student_name}! لقد تدربت لمدة ${achievement.days || 7} أيام متتالية.`,
        type: NOTIFICATION_TYPES.ACHIEVEMENT
      }
    };

    const achievementInfo = achievements[achievement.type] || {
      title: '🏅 إنجاز جديد!',
      message: `مبروك ${student.student_name}! لقد حصلت على إنجاز جديد.`,
      type: NOTIFICATION_TYPES.ACHIEVEMENT
    };

    // إنشاء الإشعار
    return await createNotification({
      student_id,
      title: achievementInfo.title,
      message: achievementInfo.message,
      type: achievementInfo.type,
      data: achievement,
      is_read: false
    });
  } catch (error) {
    console.error('خطأ في إنشاء إشعار الإنجاز:', error);
    return {
      success: false,
      error: error.message || 'فشل في إنشاء إشعار الإنجاز'
    };
  }
}

/**
 * 10. إنشاء إشعار نظام - متوافق
 */
export async function createSystemNotification(student_id, systemUpdate) {
  try {
    return await createNotification({
      student_id,
      title: systemUpdate.title || '🔄 تحديث نظام',
      message: systemUpdate.message || 'تحديث جديد في النظام التعليمي.',
      type: NOTIFICATION_TYPES.SYSTEM,
      data: systemUpdate,
      is_read: false
    });
  } catch (error) {
    console.error('خطأ في إنشاء إشعار النظام:', error);
    return {
      success: false,
      error: error.message || 'فشل في إنشاء إشعار النظام'
    };
  }
}

/**
 * 11. إنشاء إشعار تذكير - متوافق
 */
export async function createReminderNotification(student_id, reminder) {
  try {
    return await createNotification({
      student_id,
      title: reminder.title || '⏰ تذكير',
      message: reminder.message || 'حان وقت التدريب! واصل تقدمك.',
      type: NOTIFICATION_TYPES.REMINDER,
      data: reminder,
      is_read: false
    });
  } catch (error) {
    console.error('خطأ في إنشاء إشعار التذكير:', error);
    return {
      success: false,
      error: error.message || 'فشل في إنشاء إشعار التذكير'
    };
  }
}

/**
 * 12. إنشاء إشعار تقدم - متوافق
 */
export async function createProgressNotification(student_id, progress) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id },
      select: { student_name: true }
    });

    let title, message;
    
    if (progress.improvement > 20) {
      title = '🚀 تحسن مذهل!';
      message = `أحسنت ${student?.student_name || 'صديقي'}! تحسنت بنسبة ${Math.round(progress.improvement)}% هذا الأسبوع.`;
    } else if (progress.improvement > 10) {
      title = '📈 تقدم ممتاز';
      message = `ممتاز ${student?.student_name || 'صديقي'}! تحسنت بنسبة ${Math.round(progress.improvement)}% هذا الأسبوع.`;
    } else if (progress.improvement > 0) {
      title = '👍 تحسن جيد';
      message = `جيد ${student?.student_name || 'صديقي'}! تحسنت بنسبة ${Math.round(progress.improvement)}% هذا الأسبوع.`;
    } else if (progress.improvement === 0) {
      title = '💪 حافظ على مستواك';
      message = `حافظت على مستواك هذا الأسبوع ${student?.student_name || 'صديقي'}. استمر!`;
    } else {
      title = '🎯 فرصة للتحسين';
      message = `لديك فرصة للتحسين ${student?.student_name || 'صديقي'}. استمر في التدريب!`;
    }

    return await createNotification({
      student_id,
      title,
      message,
      type: NOTIFICATION_TYPES.PROGRESS,
      data: progress,
      is_read: false
    });
  } catch (error) {
    console.error('خطأ في إنشاء إشعار التقدم:', error);
    return {
      success: false,
      error: error.message || 'فشل في إنشاء إشعار التقدم'
    };
  }
}

/**
 * 13. إنشاء إشعار ترحيب - متوافق
 */
export async function createWelcomeNotification(student_id) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id },
      select: { student_name: true, level: true }
    });

    return await createNotification({
      student_id,
      title: '🎉 مرحباً بك!',
      message: `مرحباً بك ${student?.student_name || 'صديقي'} في منصة قوة الرياضيات! ابدأ رحلتك التعليمية الآن.`,
      type: NOTIFICATION_TYPES.WELCOME,
      data: {
        welcome: true,
        student_name: student?.student_name,
        level: student?.level
      },
      is_read: false
    });
  } catch (error) {
    console.error('خطأ في إنشاء إشعار الترحيب:', error);
    return {
      success: false,
      error: error.message || 'فشل في إنشاء إشعار الترحيب'
    };
  }
}

/**
 * 14. الحصول على عدد الإشعارات غير المقروءة - متوافق
 */
export async function getUnreadNotificationCount(student_id) {
  try {
    // التحقق من صحة الطالب
    const student = await prisma.student.findUnique({
      where: { student_id },
      select: { student_id: true }
    });

    if (!student) {
      throw new Error('الطالب غير موجود');
    }

    // حساب عدد الإشعارات غير المقروءة
    const count = await prisma.notification.count({
      where: {
        student_id,
        is_read: false
      }
    });

    return {
      success: true,
      data: {
        student_id,
        unread_count: count,
        has_unread: count > 0
      },
      message: `لديك ${count} إشعار غير مقروء`
    };
  } catch (error) {
    console.error('خطأ في جلب عدد الإشعارات غير المقروءة:', error);
    return {
      success: false,
      error: error.message || 'فشل في جلب عدد الإشعارات غير المقروءة'
    };
  }
}

/**
 * 15. الحصول على آخر الإشعارات - متوافق
 */
export async function getRecentNotifications(student_id, limit = 5) {
  try {
    const result = await getStudentNotifications({
      student_id,
      limit,
      sort_by: 'created_at',
      sort_order: 'desc'
    });

    if (result.success) {
      return {
        success: true,
        data: {
          notifications: result.data.notifications.slice(0, limit),
          total_unread: result.data.counts.unread
        },
        message: 'تم جلب آخر الإشعارات'
      };
    }

    return result;
  } catch (error) {
    console.error('خطأ في جلب آخر الإشعارات:', error);
    return {
      success: false,
      error: error.message || 'فشل في جلب آخر الإشعارات'
    };
  }
}

/**
 * 16. البحث في الإشعارات - متوافق
 */
export async function searchNotifications({
  student_id,
  query,
  type = null,
  start_date = null,
  end_date = null,
  limit = 20
}) {
  try {
    // بناء شرط البحث
    const whereClause = {
      student_id,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { message: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (type) {
      whereClause.type = type;
    }

    if (start_date) {
      whereClause.created_at = {
        gte: new Date(start_date)
      };
    }

    if (end_date) {
      whereClause.created_at = {
        ...whereClause.created_at,
        lte: new Date(end_date)
      };
    }

    // البحث في الإشعارات
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      select: {
        notification_id: true,
        title: true,
        message: true,
        type: true,
        is_read: true,
        created_at: true,
        data: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit
    });

    // تنسيق البيانات
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null
    }));

    return {
      success: true,
      data: {
        notifications: formattedNotifications,
        count: notifications.length,
        query,
        has_results: notifications.length > 0
      },
      message: `تم العثور على ${notifications.length} إشعار`
    };
  } catch (error) {
    console.error('خطأ في البحث في الإشعارات:', error);
    return {
      success: false,
      error: error.message || 'فشل في البحث في الإشعارات'
    };
  }
}

/**
 * 17. تحديث إشعار - متوافق
 */
export async function updateNotification(notification_id, updates) {
  try {
    // التحقق من وجود الإشعار
    const existingNotification = await prisma.notification.findUnique({
      where: { notification_id }
    });

    if (!existingNotification) {
      throw new Error('الإشعار غير موجود');
    }

    // تحضير البيانات للتحديث
    const updateData = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.message !== undefined) updateData.message = updates.message;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.is_read !== undefined) updateData.is_read = updates.is_read;
    if (updates.data !== undefined) {
      updateData.data = updates.data ? JSON.stringify(updates.data) : null;
    }

    // تحديث الإشعار
    const updatedNotification = await prisma.notification.update({
      where: { notification_id },
      data: updateData,
      include: {
        student: {
          select: {
            student_id: true,
            student_name: true
          }
        }
      }
    });

    return {
      success: true,
      data: {
        ...updatedNotification,
        data: updatedNotification.data ? JSON.parse(updatedNotification.data) : null
      },
      message: 'تم تحديث الإشعار بنجاح'
    };
  } catch (error) {
    console.error('خطأ في تحديث الإشعار:', error);
    return {
      success: false,
      error: error.message || 'فشل في تحديث الإشعار'
    };
  }
}

/**
 * 18. إنشاء إشعارات جماعية للطلاب - متوافق
 */
export async function createNotificationsForStudents(student_ids, notificationData) {
  try {
    // التحقق من وجود الطلاب
    const existingStudents = await prisma.student.findMany({
      where: {
        student_id: { in: student_ids }
      },
      select: { student_id: true, student_name: true }
    });

    const existingStudentIds = existingStudents.map(s => s.student_id);
    const invalidStudentIds = student_ids.filter(id => !existingStudentIds.includes(id));

    if (invalidStudentIds.length > 0) {
      console.warn(`طلاب غير موجودين: ${invalidStudentIds.join(', ')}`);
    }

    // تحضير الإشعارات للطلاب الموجودين
    const notifications = existingStudentIds.map(student_id => ({
      student_id,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'general',
      data: notificationData.data ? JSON.stringify(notificationData.data) : null,
      is_read: false,
      created_at: new Date()
    }));

    // إنشاء الإشعارات بشكل جماعي
    const result = await prisma.notification.createMany({
      data: notifications,
      skipDuplicates: false
    });

    return {
      success: true,
      data: {
        created_count: result.count,
        total_students: student_ids.length,
        valid_students: existingStudentIds.length,
        invalid_students: invalidStudentIds
      },
      message: `تم إرسال الإشعار إلى ${result.count} طالب`
    };
  } catch (error) {
    console.error('خطأ في إنشاء إشعارات للطلاب:', error);
    return {
      success: false,
      error: error.message || 'فشل في إنشاء إشعارات للطلاب'
    };
  }
}

/**
 * 19. تنظيف الإشعارات القديمة - متوافق
 */
export async function cleanupOldNotifications(days_old = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days_old);

    const result = await prisma.notification.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate
        },
        is_read: true // حذف المقروء فقط
      }
    });

    return {
      success: true,
      data: {
        deleted_count: result.count,
        cutoff_date: cutoffDate,
        days_old
      },
      message: `تم حذف ${result.count} إشعار قديم`
    };
  } catch (error) {
    console.error('خطأ في تنظيف الإشعارات القديمة:', error);
    return {
      success: false,
      error: error.message || 'فشل في تنظيف الإشعارات القديمة'
    };
  }
}

/**
 * 20. إحصاءات الإشعارات - متوافق
 */
export async function getNotificationStatistics(student_id = null) {
  try {
    const whereClause = student_id ? { student_id } : {};

    // جلب الإحصائيات
    const [
      total_count,
      read_count,
      unread_count,
      by_type,
      recent_count
    ] = await Promise.all([
      // إجمالي عدد الإشعارات
      prisma.notification.count({ where: whereClause }),
      
      // عدد الإشعارات المقروءة
      prisma.notification.count({ 
        where: { ...whereClause, is_read: true } 
      }),
      
      // عدد الإشعارات غير المقروءة
      prisma.notification.count({ 
        where: { ...whereClause, is_read: false } 
      }),
      
      // التوزيع حسب النوع
      prisma.notification.groupBy({
        by: ['type'],
        where: whereClause,
        _count: {
          _all: true
        }
      }),
      
      // عدد الإشعارات في آخر 7 أيام
      prisma.notification.count({
        where: {
          ...whereClause,
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // تحويل التوزيع حسب النوع إلى كائن
    const typeDistribution = {};
    by_type.forEach(item => {
      typeDistribution[item.type] = item._count._all;
    });

    return {
      success: true,
      data: {
        total: total_count,
        read: read_count,
        unread: unread_count,
        type_distribution: typeDistribution,
        recent_7_days: recent_count,
        read_percentage: total_count > 0 ? Math.round((read_count / total_count) * 100) : 0
      },
      message: 'تم جلب إحصاءات الإشعارات'
    };
  } catch (error) {
    console.error('خطأ في جلب إحصاءات الإشعارات:', error);
    return {
      success: false,
      error: error.message || 'فشل في جلب إحصاءات الإشعارات'
    };
  }
}

// تصدير الثوابت
export { NOTIFICATION_TYPES, NOTIFICATION_STATUS };