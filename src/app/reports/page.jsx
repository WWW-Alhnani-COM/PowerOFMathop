'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../../components/layout/Header'
import {
  getStudentReport,
  getProgressReport,
  getErrorPatterns,
  getAiRecommendations
} from '../../../actions/report.actions'

export default function ReportsPage() {
  const router = useRouter()

  const [studentId, setStudentId] = useState(null)
  const [report, setReport] = useState(null)
  const [progress, setProgress] = useState([])
  const [errors, setErrors] = useState([])
  const [ai, setAi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem('student_id')

    if (!id) {
      router.push('/login?callbackUrl=/reports')
      return
    }

    setStudentId(parseInt(id))
  }, [])

  useEffect(() => {
    if (!studentId) return

    const fetchData = async () => {
      setLoading(true)

      const [r1, r2, r3, r4] = await Promise.all([
        getStudentReport(studentId),
        getProgressReport(studentId),
        getErrorPatterns(studentId),
        getAiRecommendations(studentId)
      ])

      if (r1.success) setReport(r1.data)
      if (r2.success) setProgress(r2.data)
      if (r3.success) setErrors(r3.data)
      if (r4.success) setAi(r4.data)

      setLoading(false)
    }

    fetchData()
  }, [studentId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Header studentName="طالب" />
        <div className="text-orange-600 font-black text-2xl">
          جاري تحميل التقارير...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <Header studentName={report?.studentName || 'طالب'} />

      <div className="container mx-auto px-4 py-8">

        {/* 📊 الملخص */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">

          <div className="card-3d p-4">
            <p>النقاط</p>
            <p className="text-2xl font-black text-orange-600">
              {report?.totalScore || 0}
            </p>
          </div>

          <div className="card-3d p-4">
            <p>الأوراق</p>
            <p className="text-2xl font-black text-blue-600">
              {report?.totalSheets || 0}
            </p>
          </div>

          <div className="card-3d p-4">
            <p>الدقة</p>
            <p className="text-2xl font-black text-green-600">
              {report?.avgAccuracy || 0}%
            </p>
          </div>

          <div className="card-3d p-4">
            <p>المعدل</p>
            <p className="text-2xl font-black text-purple-600">
              {report?.avgScore || 0}
            </p>
          </div>

        </div>

        {/* 📉 الأخطاء */}
        <div className="mb-10">
          <h2 className="text-xl font-black mb-4">أكثر الأخطاء</h2>

          {errors?.map((e, i) => (
            <div key={i} className="card-3d p-3 mb-2">
              <p>{e.ruleName}</p>
              <p className="text-red-500 font-bold">{e.count}</p>
            </div>
          ))}
        </div>

        {/* 🧠 التوصيات */}
        <div>
          <h2 className="text-xl font-black mb-4">توصيات الذكاء</h2>

          {ai?.map((a, i) => (
            <div key={i} className="card-3d p-3 mb-2">
              <p>{a.reason}</p>
              <p className="text-sm text-gray-500">
                ثقة: {a.confidence_score}%
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
