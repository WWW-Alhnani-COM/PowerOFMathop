'use client';

import { useState, useTransition, ChangeEvent, FormEvent } from 'react'; 
import { useRouter } from 'next/navigation';

// تعريف أنواع البيانات
interface Branch {
    branch_id: number;
    branch_name: string;
}

interface JoinFormProps {
    branches: Branch[];
    // تعريف الدالة القادمة من الملف الأب (Server Action)
    handleStudentJoin: (prevState: string | null, formData: FormData) => Promise<string>;
}

export default function JoinForm({ branches, handleStudentJoin }: JoinFormProps) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [branchId, setBranchId] = useState(''); 
    const [error, setError] = useState<string | null>(null); 
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: FormEvent) => { 
        e.preventDefault();
        setError(null);

        if (!name || !branchId) {
            setError('الرجاء إدخال اسم الطالب واختيار الفرع.'); 
            return;
        }

        startTransition(async () => {
            try {
                // تحويل البيانات إلى FormData لتتوافق مع الـ Server Action
                const formData = new FormData();
                formData.append('student_name', name);
                formData.append('branch_id', branchId);

                const result = await handleStudentJoin(null, formData);

                if (result.startsWith('Success')) {
                    // التوجيه للوحة التحكم عند النجاح
                    router.push('/dashboard'); 
                } else {
                    setError(result.replace('Error: ', '')); 
                }
            } catch (err) {
                setError('حدث خطأ أثناء الاتصال بالخادم.');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="card-body bg-white shadow-xl rounded-2xl p-8">
            <h2 className="card-title text-3xl text-indigo-700 justify-center mb-6 font-bold">تسجيل الدخول</h2>
            
            {error && (
                <div role="alert" className="alert alert-error mb-4 bg-red-50 text-red-700 border-red-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <div className="form-control">
                <label className="label">
                    <span className="label-text text-lg font-medium">اسم الطالب</span>
                </label>
                <input
                    type="text"
                    placeholder="أدخل اسمك هنا"
                    className="input input-bordered border-indigo-200 focus:border-indigo-500 w-full text-lg"
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
                    required
                    disabled={isPending}
                />
            </div>

            <div className="form-control mt-4">
                <label className="label">
                    <span className="label-text text-lg font-medium">الفرع التعليمي</span>
                </label>
                <select
                    className="select select-bordered border-indigo-200 focus:border-indigo-500 w-full text-lg"
                    value={branchId}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setBranchId(e.target.value)}
                    required
                    disabled={isPending}
                >
                    <option value="" disabled>اختر فرعك</option>
                    {branches.map((branch) => (
                        <option key={branch.branch_id} value={branch.branch_id}>
                            {branch.branch_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-control mt-8">
                <button 
                    type="submit"
                    className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 border-none btn-lg text-white w-full"
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