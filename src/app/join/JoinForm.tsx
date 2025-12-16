// src/app/join/JoinForm.tsx

'use client';

import { useState, useTransition, ChangeEvent, FormEvent } from 'react'; 
import { useRouter } from 'next/navigation';
// تأكد من المسار الصحيح لدالة تسجيل الدخول
import { loginStudent } from '../../../actions/auth.actions'; 

// 1. تعريف أنواع البيانات (يمكن وضعها في ملف منفصل)
interface Branch {
    branch_id: number;
    branch_name: string;
}

interface JoinFormProps {
    branches: Branch[];
}
// -----------------------------------------------------------------

// 2. تطبيق نوع Props على المكون
export default function JoinForm({ branches }: JoinFormProps) {
    const router = useRouter();
    const [name, setName] = useState('');
    // **الإضافة والتصحيح:** تعريف حالة Branch ID
    const [branchId, setBranchId] = useState(''); 
    const [error, setError] = useState<string | null>(null); 
    const [isPending, startTransition] = useTransition();

    // 3. تحديد نوع الحدث 'e' كـ FormEvent
    const handleSubmit = (e: FormEvent) => { 
        e.preventDefault();
        setError(null);

        // تم حل أخطاء branchId هنا
        if (!name || !branchId) {
            setError('الرجاء إدخال اسم الطالب واختيار الفرع.'); 
            return;
        }

        startTransition(async () => {
            // تم حل أخطاء branchId هنا
            const result = await loginStudent(name, parseInt(branchId));

            if (result.success) {
                router.push('/dashboard'); 
            } else {
                setError(result.error || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.'); 
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="card-body">
            <h2 className="card-title text-3xl text-primary justify-center mb-6">تسجيل الدخول</h2>
            
            {error && (
                <div role="alert" className="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{error}</span>
                </div>
            )}

            <div className="form-control">
                <label className="label">
                    <span className="label-text text-lg">اسم الطالب</span>
                </label>
                <input
                    type="text"
                    placeholder="أدخل اسمك هنا"
                    className="input input-bordered input-primary w-full text-lg"
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
                    required
                    disabled={isPending}
                />
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text text-lg">الفرع التعليمي</span>
                </label>
                <select
                    className="select select-bordered select-primary w-full text-lg"
                    // تم حل أخطاء branchId هنا
                    value={branchId}
                    // تم حل أخطاء setBranchId هنا
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setBranchId(e.target.value)}
                    required
                    disabled={isPending}
                >
                    <option value="" disabled>اختر فرعك</option>
                    {branches.map((branch: Branch) => (
                        <option key={branch.branch_id} value={branch.branch_id}>
                            {branch.branch_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-control mt-8">
                <button 
                    type="submit"
                    className="btn btn-primary btn-lg text-white"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <span className="loading loading-spinner"></span>
                            جارِ الدخول...
                        </>
                    ) : (
                        'ابدأ التدريب الآن'
                    )}
                </button>
            </div>
        </form>
    );
}