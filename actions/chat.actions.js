// src/actions/chat.actions.js
'use server';

import { prisma } from '@/lib/prisma';

// ***************************************************************
// 1. جلب قائمة المحادثات
// ***************************************************************
export async function getChatList(studentId) {
    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
        return { success: false, error: 'معرف طالب غير صالح.' };
    }

    try {
        const messages = await prisma.chatMessage.findMany({
            where: {
                OR: [
                    { sender_id: studentIdInt },
                    { receiver_id: studentIdInt },
                ]
            },
            orderBy: {
                created_at: 'desc'
            },
            include: {
                sender: { select: { student_id: true, student_name: true } },
                receiver: { select: { student_id: true, student_name: true } },
            }
        });

        const chatMap = new Map();
        
        messages.forEach(message => {
            const otherParticipantId = 
                message.sender_id === studentIdInt ? message.receiver_id : message.sender_id;
            
            if (!otherParticipantId) return;

            const otherStudent = 
                message.sender_id === studentIdInt ? message.receiver : message.sender;

            if (!chatMap.has(otherParticipantId)) {
                chatMap.set(otherParticipantId, {
                    student: otherStudent,
                    lastMessage: message,
                    unreadCount: 0
                });
            }
            
            // ✅ استخدام read_at: null لرسالة غير مقروءة
            if (message.receiver_id === studentIdInt && message.read_at === null) {
                chatMap.get(otherParticipantId).unreadCount++;
            }
        });

        const chatList = Array.from(chatMap.values());
        
        return { success: true, data: chatList };
    } catch (error) {
        console.error("PRISMA ERROR in getChatList:", error); 
        return { success: false, error: `فشل في جلب المحادثات: ${error.message || 'خطأ قاعدة بيانات.'}` };
    }
}

// ***************************************************************
// 2. جلب العدد الكلي للرسائل غير المقروءة
// ***************************************************************
export async function getUnreadCount(studentId) {
    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
        return { success: false, error: 'معرف طالب غير صالح.' };
    }

    try {
        // ✅ استخدام read_at: null بدلاً من is_read: false
        const unreadCount = await prisma.chatMessage.count({
            where: {
                receiver_id: studentIdInt,
                read_at: null, // 🔑 الشرط الصحيح لرسالة غير مقروءة
            },
        });
        
        return { success: true, data: unreadCount };
    } catch (error) {
        console.error("PRISMA ERROR in getUnreadCount:", error); 
        return { success: false, error: 'فشل في حساب الرسائل غير المقروءة.' };
    }
}

// ***************************************************************
// 3. جلب جميع الرسائل بين طالبين
// ***************************************************************
export async function getMessagesBetweenStudents(studentId, otherId) {
    const studentIdInt = parseInt(studentId);
    const otherIdInt = parseInt(otherId);

    if (isNaN(studentIdInt) || isNaN(otherIdInt)) {
        return { success: false, error: 'معرفات الطالب أو الطرف الآخر غير صالحة.' };
    }

    try {
        // 1. جلب الرسائل
        const messages = await prisma.chatMessage.findMany({
            where: {
                OR: [
                    { sender_id: studentIdInt, receiver_id: otherIdInt },
                    { sender_id: otherIdInt, receiver_id: studentIdInt },
                ]
            },
            orderBy: {
                created_at: 'asc' 
            }
        });

        // 2. تحديث الرسائل كـ "مقروءة"
        try {
            await prisma.chatMessage.updateMany({
                where: {
                    receiver_id: studentIdInt, 
                    sender_id: otherIdInt,     
                    read_at: null // ✅ الرسائل غير المقروءة فقط
                },
                data: {
                    read_at: new Date() // ✅ تعيين وقت القراءة
                }
            });
        } catch (updateError) {
            console.error("PRISMA UPDATE ERROR (Mark as Read):", updateError);
        }

        return { success: true, data: messages };
    } catch (error) {
        console.error("PRISMA FIND ERROR in getMessagesBetweenStudents:", error);
        return { success: false, error: 'فشل في جلب سجل المحادثة.' };
    }
}

// ***************************************************************
// 4. إرسال رسالة جديدة
// ***************************************************************
export async function sendMessage(senderId, receiverId, messageText) {
    const senderIdInt = parseInt(senderId);
    const receiverIdInt = parseInt(receiverId);
    
    if (!messageText.trim() || isNaN(senderIdInt) || isNaN(receiverIdInt)) {
        return { success: false, error: 'البيانات غير صالحة للإرسال.' };
    }

    try {
        const newMessage = await prisma.chatMessage.create({
            data: {
                sender_id: senderIdInt,
                receiver_id: receiverIdInt,
                message_text: messageText,
                is_approved: true,
                is_flagged: false,
                read_at: null,
            }
        });
        
        return { 
            success: true, 
            data: {
                message_id: newMessage.message_id, 
                created_at: newMessage.created_at 
            } 
        };
    } catch (error) {
        console.error("PRISMA ERROR in sendMessage:", error);
        return { success: false, error: 'فشل في إرسال الرسالة.' };
    }
}

// ***************************************************************
// 5. جلب جميع الطلاب النشطين (باستثناء الطالب الحالي)
// ***************************************************************
export async function getActiveStudentsForChat(currentStudentId) {
    const id = parseInt(currentStudentId);
    if (isNaN(id)) {
        return { success: false, error: 'معرف طالب غير صالح.' };
    }

    try {
        const students = await prisma.student.findMany({
            where: {
                status: 'active',
                student_id: { not: id },
            },
            select: {
                student_id: true,
                student_name: true,
                branch: { select: { branch_name: true } },
            },
            orderBy: {
                student_name: 'asc',
            },
        });

        return { success: true, data: students };
    } catch (error) {
        console.error('Error in getActiveStudentsForChat:', error);
        return { success: false, error: 'فشل في جلب قائمة الطلاب.' };
    }
}

// ***************************************************************
// 6. تحديث رسالة كمقروءة (دالة إضافية)
// ***************************************************************
export async function markMessageAsRead(messageId, studentId) {
    try {
        const messageIdInt = parseInt(messageId);
        const studentIdInt = parseInt(studentId);
        
        if (isNaN(messageIdInt) || isNaN(studentIdInt)) {
            return { success: false, error: 'معرفات غير صالحة.' };
        }

        const updatedMessage = await prisma.chatMessage.update({
            where: {
                message_id: messageIdInt,
                receiver_id: studentIdInt,
            },
            data: {
                read_at: new Date(),
            },
        });

        return { success: true, data: updatedMessage };
    } catch (error) {
        console.error('Error in markMessageAsRead:', error);
        return { success: false, error: 'فشل في تحديث حالة الرسالة.' };
    }
}

// ***************************************************************
// 7. حذف رسالة (للمرسل فقط)
// ***************************************************************
export async function deleteMessage(messageId, senderId) {
    try {
        const messageIdInt = parseInt(messageId);
        const senderIdInt = parseInt(senderId);
        
        if (isNaN(messageIdInt) || isNaN(senderIdInt)) {
            return { success: false, error: 'معرفات غير صالحة.' };
        }

        const message = await prisma.chatMessage.findUnique({
            where: { message_id: messageIdInt },
        });

        if (!message) {
            return { success: false, error: 'الرسالة غير موجودة.' };
        }

        if (message.sender_id !== senderIdInt) {
            return { success: false, error: 'غير مصرح لك بحذف هذه الرسالة.' };
        }

        await prisma.chatMessage.delete({
            where: { message_id: messageIdInt },
        });

        return { success: true, message: 'تم حذف الرسالة بنجاح.' };
    } catch (error) {
        console.error('Error in deleteMessage:', error);
        return { success: false, error: 'فشل في حذف الرسالة.' };
    }
}