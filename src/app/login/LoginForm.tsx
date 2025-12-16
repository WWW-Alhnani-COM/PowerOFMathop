// src/app/login/loginFormClient.tsx
// هذا المكون هو Client Component

'use client'; 

import { useState, useTransition, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

// ***************************************************************
// 1. الأنواع (Types)
// ***************************************************************

interface Branch {
    branch_id: number;
    branch_name: string;
}

interface LoginFormProps {
    branches: Branch[];
    // تمرير دالة Server Action كـ Prop
    loginAction: (name: string, branchId: number) => Promise<{ success: boolean; data?: object; error?: string }>;
}

// ***************************************************************
// 2. المكون العميل
// ***************************************************************

export default function LoginFormClient({ branches, loginAction }: LoginFormProps) {
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
            const result = await loginAction(name, parseInt(branchId)); 

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
                    // تحسين وضوح الخطوط (الحدود)
                    className="input input-bordered input-primary input-lg w-full text-lg border-2 border-primary/50 focus:border-primary"
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
                    // تحسين وضوح الخطوط (الحدود)
                    className="select select-bordered select-primary select-lg w-full text-lg border-2 border-primary/50 focus:border-primary"
                    value={branchId}
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