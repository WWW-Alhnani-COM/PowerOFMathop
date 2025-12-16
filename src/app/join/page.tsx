// File: powerofmath-next/app/join/page.tsx

// استخدام مسار Prisma الصحيح
import prisma from '../../../lib/prisma';
import JoinForm from './JoinForm'; 

// تحديد الحد الأقصى لوقت التنفيذ (اختياري)
export const maxDuration = 30;

// هذا المكون يعمل على الخادم
export default async function JoinPage() {

    // 1. جلب البيانات (عملية خادم)
    const branches = await prisma.branch.findMany({
        select: {
            branch_id: true,
            branch_name: true,
        },
        orderBy: {
            branch_name: 'asc',
        }
    });

    // 2. دالة Server Action (تعمل على الخادم، وتُرجع رسالة)
    // تم تحديث المنطق ليدعم التسجيل والدخول
    async function handleStudentJoin(prevState: string | null, formData: FormData): Promise<string> {
        'use server'; // <--- توجيه Server Action
        
        const studentName = (formData.get('student_name') as string).trim(); // إزالة المسافات
        const branchId = parseInt(formData.get('branch_id') as string, 10); 

        if (!studentName || isNaN(branchId)) {
            return 'Error: يرجى إدخال اسم الطالب واختيار الفرع.';
        }

        try {
            // 🎯 المنطق الجديد: البحث أولاً عن الطالب (تسجيل دخول)
            const existingStudent = await prisma.student.findUnique({
                where: {
                    // استخدام اسم المفتاح الفريد المركب للبحث
                    unique_student_branch: {
                        student_name: studentName,
                        branch_id: branchId,
                    }
                },
                select: { student_id: true, student_name: true }
            });

            // 🎯 1. حالة تسجيل الدخول (الطالب موجود)
            if (existingStudent) {
                // في تطبيق حقيقي، سيتم هنا تعيين جلسة (Session) للطالب
                return `Success: مرحباً بعودتك يا ${existingStudent.student_name}! تم تسجيل دخولك بنجاح.`;
            }

            // 🎯 2. حالة التسجيل (الطالب غير موجود)
            const newStudent = await prisma.student.create({
                data: {
                    student_name: studentName,
                    branch_id: branchId,
                    current_level_id: 1, // القيمة الافتراضية
                },
                select: { student_id: true, student_name: true }
            });

            // يمكن هنا تعيين جلسة (Session) للطالب الجديد
            return `Success: تم تسجيل الطالب ${newStudent.student_name} بنجاح! نُقلك إلى المستوى الأول.`;
            
        } catch (error: any) {
            // التعامل مع الأخطاء غير المتوقعة (مثل مشاكل الاتصال بالـ DB)
            console.error("خطأ غير متوقع في قاعدة البيانات:", error);
            // قد يظهر خطأ P2002 هنا فقط إذا حدث سباق بيانات (race condition)، ولكن تم تغطيته بمنطق findUnique
            return `Error: حدث خطأ غير متوقع أثناء المعالجة: ${error.message}`;
        }
    }


    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="container mx-auto max-w-md" dir="rtl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-2">بوابة الانضمام</h1>
                    <p className="text-gray-500 dark:text-gray-400">أدخل اسمك واختر الفرع للبدء أو متابعة لعبك.</p>
                </div>
                
                {/* 3. تمرير الفروع (البيانات) و Server Action (المنطق) إلى مكون العميل */}
                <JoinForm 
                    branches={branches} 
                    handleStudentJoin={handleStudentJoin} 
                />
            </div>
        </main>
    );
}