import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authConfig } from './auth.actions';

/**
 * Supabase client
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * أنواع الإشعارات
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
 * حالة الإشعار
 */
export const NOTIFICATION_STATUS = {
  UNREAD: false,
  READ: true
};

/**
 * Helper: parse JSON safely
 */
const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return value;
  }
};

/**
 * Helper: stringify JSON safely
 */
const safeStringify = (value) => {
  try {
    return value ? JSON.stringify(value) : null;
  } catch {
    return null;
  }
};

/**
 * 1. إنشاء إشعار جديد
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
    const { data: student, error: studentError } = await supabase
      .from('student')
      .select('student_id, student_name')
      .eq('student_id', student_id)
      .single();

    if (studentError || !student) {
      throw new Error('الطالب غير موجود');
    }

    const { data: notification, error } = await supabase
      .from('notification')
      .insert({
        student_id,
        title,
        message,
        type,
        data: safeStringify(data),
        is_read,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        student:student(student_id, student_name, current_level_id)
      `)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: {
        ...notification,
        data: safeParse(notification.data)
      },
      message: 'تم إنشاء الإشعار بنجاح'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 2. جلب إشعارات الطالب
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
    let query = supabase
      .from('notification')
      .select('*', { count: 'exact' })
      .eq('student_id', student_id);

    if (unread_only) {
      query = query.eq('is_read', false);
    }

    if (type && Object.values(NOTIFICATION_TYPES).includes(type)) {
      query = query.eq('type', type);
    }

    const offset = (page - 1) * limit;

    const { data: notifications, count, error } = await query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const { data: unreadData } = await supabase
      .from('notification')
      .select('notification_id', { count: 'exact' })
      .eq('student_id', student_id)
      .eq('is_read', false);

    return {
      success: true,
      data: {
        notifications: (notifications || []).map(n => ({
          ...n,
          data: safeParse(n.data)
        })),
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
          has_more: page * limit < (count || 0)
        },
        counts: {
          total: count || 0,
          unread: unreadData?.length || 0,
          read: (count || 0) - (unreadData?.length || 0)
        }
      },
      message: 'تم جلب الإشعارات بنجاح'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 3. تعليم إشعار كمقروء
 */
export async function markNotificationAsRead(notification_id, student_id = null) {
  try {
    let query = supabase
      .from('notification')
      .update({ is_read: true })
      .eq('notification_id', notification_id);

    if (student_id) {
      query = query.eq('student_id', student_id);
    }

    const { data, error } = await query.select().single();

    if (error) throw error;

    return {
      success: true,
      data,
      message: 'تم تحديث الإشعار'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 4. تعليم كل الإشعارات كمقروءة
 */
export async function markAllNotificationsAsRead(student_id) {
  try {
    const { data, error } = await supabase
      .from('notification')
      .update({ is_read: true })
      .eq('student_id', student_id)
      .eq('is_read', false);

    if (error) throw error;

    return {
      success: true,
      data,
      message: 'تم تحديث جميع الإشعارات'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 5. حذف إشعار
 */
export async function deleteNotification(notification_id, student_id = null) {
  try {
    let query = supabase
      .from('notification')
      .delete()
      .eq('notification_id', notification_id);

    if (student_id) {
      query = query.eq('student_id', student_id);
    }

    const { error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: { notification_id },
      message: 'تم الحذف'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 6. حذف كل إشعارات الطالب
 */
export async function deleteAllNotifications(student_id, delete_read_only = false) {
  try {
    let query = supabase
      .from('notification')
      .delete()
      .eq('student_id', student_id);

    if (delete_read_only) {
      query = query.eq('is_read', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data,
      message: 'تم حذف الإشعارات'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 7. إنشاء إشعارات جماعية
 */
export async function createBulkNotifications(notifications) {
  try {
    const formatted = notifications.map(n => ({
      student_id: n.student_id,
      title: n.title,
      message: n.message,
      type: n.type || 'general',
      data: safeStringify(n.data),
      is_read: n.is_read || false,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('notification')
      .insert(formatted);

    if (error) throw error;

    return {
      success: true,
      data,
      message: 'تم إنشاء الإشعارات'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 8. إشعار تحدي
 */
export async function createChallengeNotification(challengeData) {
  const { challenger, challenged, notification_type } = challengeData;

  let config = {
    title: 'تحديث تحدي',
    message: 'تحديث جديد',
    type: NOTIFICATION_TYPES.CHALLENGE
  };

  switch (notification_type) {
    case 'challenge_new':
      config.title = 'تحدي جديد';
      config.message = `${challenger?.student_name} تحداك`;
      break;
    case 'challenge_accepted':
      config.title = 'تم قبول التحدي';
      break;
    case 'challenge_rejected':
      config.title = 'تم رفض التحدي';
      break;
    case 'challenge_winner':
      config.title = 'فوز';
      config.type = NOTIFICATION_TYPES.ACHIEVEMENT;
      break;
  }

  const targetStudentId = challenged?.student_id || challengeData.challenged_id;

  return createNotification({
    student_id: targetStudentId,
    title: config.title,
    message: config.message,
    type: config.type,
    data: challengeData,
    is_read: false
  });
}

/**
 * 9. إشعار إنجاز
 */
export async function createAchievementNotification(student_id, achievement) {
  return createNotification({
    student_id,
    title: 'إنجاز جديد',
    message: 'مبروك على الإنجاز',
    type: NOTIFICATION_TYPES.ACHIEVEMENT,
    data: achievement,
    is_read: false
  });
}

/**
 * 10. إشعار نظام
 */
export async function createSystemNotification(student_id, systemUpdate) {
  return createNotification({
    student_id,
    title: systemUpdate.title || 'تحديث نظام',
    message: systemUpdate.message || '',
    type: NOTIFICATION_TYPES.SYSTEM,
    data: systemUpdate,
    is_read: false
  });
}

/**
 * 11. إشعار تذكير
 */
export async function createReminderNotification(student_id, reminder) {
  return createNotification({
    student_id,
    title: reminder.title || 'تذكير',
    message: reminder.message || '',
    type: NOTIFICATION_TYPES.REMINDER,
    data: reminder,
    is_read: false
  });
}

/**
 * 12. إشعار تقدم
 */
export async function createProgressNotification(student_id, progress) {
  return createNotification({
    student_id,
    title: 'تقدم جديد',
    message: 'تم تسجيل تقدم',
    type: NOTIFICATION_TYPES.PROGRESS,
    data: progress,
    is_read: false
  });
}

/**
 * 13. إشعار ترحيب
 */
export async function createWelcomeNotification(student_id) {
  return createNotification({
    student_id,
    title: 'مرحباً',
    message: 'أهلاً بك',
    type: NOTIFICATION_TYPES.WELCOME,
    is_read: false
  });
}

/**
 * 14. عدد غير المقروء
 */
export async function getUnreadNotificationCount(student_id) {
  const { count, error } = await supabase
    .from('notification')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', student_id)
    .eq('is_read', false);

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: {
      student_id,
      unread_count: count || 0
    }
  };
}

/**
 * 15. آخر إشعارات
 */
export async function getRecentNotifications(student_id, limit = 5) {
  return getStudentNotifications({ student_id, limit });
}

/**
 * 16. البحث
 */
export async function searchNotifications({
  student_id,
  query,
  type,
  start_date,
  end_date,
  limit = 20
}) {
  let q = supabase
    .from('notification')
    .select('*')
    .eq('student_id', student_id)
    .ilike('title', `%${query}%`);

  if (type) q = q.eq('type', type);
  if (start_date) q = q.gte('created_at', start_date);
  if (end_date) q = q.lte('created_at', end_date);

  const { data, error } = await q.limit(limit);

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: {
      notifications: data.map(n => ({
        ...n,
        data: safeParse(n.data)
      }))
    }
  };
}

/**
 * 17. تحديث إشعار
 */
export async function updateNotification(notification_id, updates) {
  const { data, error } = await supabase
    .from('notification')
    .update({
      ...updates,
      data: updates.data ? safeStringify(updates.data) : undefined
    })
    .eq('notification_id', notification_id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data
  };
}

/**
 * 18. إشعارات جماعية للطلاب
 */
export async function createNotificationsForStudents(student_ids, notificationData) {
  const notifications = student_ids.map(id => ({
    student_id: id,
    title: notificationData.title,
    message: notificationData.message,
    type: notificationData.type || 'general',
    data: safeStringify(notificationData.data),
    is_read: false,
    created_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('notification')
    .insert(notifications);

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    message: 'تم الإرسال'
  };
}

/**
 * 19. تنظيف الإشعارات القديمة
 */
export async function cleanupOldNotifications(days_old = 30) {
  const cutoff = new Date(Date.now() - days_old * 86400000).toISOString();

  const { data, error } = await supabase
    .from('notification')
    .delete()
    .eq('is_read', true)
    .lt('created_at', cutoff);

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data
  };
}

/**
 * 20. إحصائيات الإشعارات
 */
export async function getNotificationStatistics(student_id = null) {
  let base = supabase.from('notification').select('*');

  if (student_id) base = base.eq('student_id', student_id);

  const { data, error } = await base;

  if (error) return { success: false, error: error.message };

  const total = data.length;
  const read = data.filter(n => n.is_read).length;
  const unread = total - read;

  const typeDistribution = {};
  data.forEach(n => {
    typeDistribution[n.type] = (typeDistribution[n.type] || 0) + 1;
  });

  return {
    success: true,
    data: {
      total,
      read,
      unread,
      type_distribution: typeDistribution,
      read_percentage: total ? Math.round((read / total) * 100) : 0
    }
  };
};

export { NOTIFICATION_TYPES, NOTIFICATION_STATUS };