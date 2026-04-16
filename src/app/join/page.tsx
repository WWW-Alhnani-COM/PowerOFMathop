// File: app/join/page.tsx

export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js'
import JoinForm from './JoinForm'

// إنشاء عميل Supabase (Server Side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

// تحديد مدة التنفيذ
export const maxDuration = 30

export default async function JoinPage() {
  let branches: Array<{ branch_id: number; branch_name: string }> = []
  let branchesError: string | null = null

  try {
    const result = await supabase
      .from('branch')
      .select('branch_id, branch_name')
      .order('branch_name', { ascending: true })

    if (result.error) {
      branchesError = result.error.message
    } else {
      branches = result.data || []
    }
  } catch (error: any) {
    branchesError = error?.message || String(error)
  }

  // 2. Server Action
  async function handleStudentJoin(prevState: string | null, formData: FormData): Promise<string> {
    'use server'

    const studentName = (formData.get('student_name') as string)?.trim()
    const branchId = Number(formData.get('branch_id'))

    if (!studentName || !branchId) {
      return 'Error: يرجى إدخال اسم الطالب واختيار الفرع.'
    }

    try {

      // 1. البحث عن الطالب (بديل findUnique)
      const { data: existingStudent, error: findError } = await supabase
        .from('student')
        .select('student_id, student_name')
        .eq('student_name', studentName)
        .eq('branch_id', branchId)
        .maybeSingle()

      if (findError) {
        return `Error: ${findError.message}`
      }

      // 🎯 تسجيل دخول (إذا موجود)
      if (existingStudent) {
        return `Success: مرحباً بعودتك يا ${existingStudent.student_name}! تم تسجيل دخولك بنجاح.`
      }

      // 🎯 إنشاء طالب جديد
      const { data: newStudent, error: createError } = await supabase
        .from('student')
        .insert([
          {
            student_name: studentName,
            branch_id: branchId,
            current_level_id: 1
          }
        ])
        .select('student_id, student_name')
        .single()

      if (createError) {
        return `Error: ${createError.message}`
      }

      return `Success: تم تسجيل الطالب ${newStudent.student_name} بنجاح!`

    } catch (error: any) {
      console.error(error)
      return `Error: حدث خطأ غير متوقع: ${error.message}`
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="container mx-auto max-w-md" dir="rtl">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-700">
            بوابة الانضمام
          </h1>
          <p className="text-gray-500">
            أدخل اسمك واختر الفرع للبدء
          </p>
        </div>

        <JoinForm
          branches={branches || []}
          handleStudentJoin={handleStudentJoin}
        />

      </div>
    </main>
  )
}