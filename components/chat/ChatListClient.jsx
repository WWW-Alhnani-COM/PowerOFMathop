// src/components/chat/ChatListClient.jsx

'use client'; // 👈 ضروري لاستخدام الـ Hooks

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
// ⚠️ تأكد من صحة مسار الـ Actions
import { getChatList, getUnreadCount } from '@/actions/chat.actions'; 

// 🔑 يستلم ID الطالب كـ Prop من الـ Server Component
const ChatListClient = ({ initialStudentId }) => { 
    
    const CURRENT_STUDENT_ID = initialStudentId;

    const [chatList, setChatList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalUnreadCount, setTotalUnreadCount] = useState(0); 

    const fetchChatData = useCallback(async (id) => {
        if (!id) return; 

        setLoading(true);
        setError(null);
        try {
            const listResult = await getChatList(id);
            const countResult = await getUnreadCount(id); 

            if (listResult.success && listResult.data) {
                setChatList(listResult.data);
            } else {
                setError(listResult.error || 'فشل في جلب قائمة المحادثات.');
            }
            
            if (countResult.success) {
                setTotalUnreadCount(countResult.data);
            } else {
                setTotalUnreadCount(0); 
            }

        } catch (err) {
            setError('حدث خطأ غير متوقع أثناء جلب البيانات.');
        } finally {
            setLoading(false);
        }
    }, []); 

    useEffect(() => {
        // يتم جلب البيانات بمجرد توفر الـ ID
        if (CURRENT_STUDENT_ID) {
            fetchChatData(CURRENT_STUDENT_ID);
        }
    }, [CURRENT_STUDENT_ID, fetchChatData]);


    if (loading) {
        return <div className="p-8 text-center text-gray-600">جاري تحميل المحادثات...</div>;
    }
    
    if (error) {
        return <div className="p-8 text-center text-red-500">خطأ: {error}</div>;
    }

    // 🖼️ كود العرض (قائمة المحادثات)
    return (
        <div className="container mx-auto p-4 max-w-xl">
            {/* ... (بقية كود العرض لـ h1 وقائمة المحادثات) ... */}
            <h1 className="text-2xl font-bold mb-4 text-primary-900">
                💬 صندوق الرسائل ({CURRENT_STUDENT_ID}) 
                {totalUnreadCount > 0 && (
                    <span className="ml-3 inline-flex items-center justify-center px-3 py-1 text-sm font-semibold leading-none text-white bg-red-500 rounded-full">
                        {totalUnreadCount} رسائل جديدة
                    </span>
                )}
            </h1>

            {/* ... (تكملة كود عرض قائمة chatList) ... */}
            {chatList.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-lg shadow-sm mt-6">
                    <p className="text-gray-500">لا توجد محادثات نشطة حاليًا.</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {/* ... (منطق عرض الـ chatList) ... */}
                </ul>
            )}
        </div>
    );
};

export default ChatListClient;