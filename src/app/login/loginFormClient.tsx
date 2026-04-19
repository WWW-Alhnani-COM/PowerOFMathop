// src/app/login/loginFormClient.tsx
'use client';

import { useState, useTransition, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// 1. الأنواع (Types)
interface Branch {
    branch_id: number;
    branch_name: string;
}

interface LoginSuccessData {
    studentId: number;
}

interface LoginFormProps {
    branches: Branch[];
    loginAction: (name: string, branchId: number) => Promise<{ success: boolean; data?: LoginSuccessData; error?: string }>;
}

export default function LoginFormClient({ branches, loginAction }: LoginFormProps) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [branchId, setBranchId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredBranches, setFilteredBranches] = useState<Branch[]>(branches);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // فلترة الفروع
    useEffect(() => {
        const filtered = branches.filter(branch =>
            branch.branch_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredBranches(filtered);
    }, [searchTerm, branches]);

    // إغلاق القائمة عند النقر الخارج
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBranchSelect = (id: string, name: string) => {
        setBranchId(id);
        setSearchTerm(name); // لعرض الاسم المختار في حقل البحث لاحقاً
        setIsDropdownOpen(false);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name || !branchId) {
            setError('الرجاء إدخال اسم الطالب واختيار الفرع.');
            return;
        }

        startTransition(async () => {
            const result = await loginAction(name, parseInt(branchId));

            if (result.success && result.data?.studentId) {
                localStorage.setItem('student_id', result.data.studentId.toString());
                localStorage.setItem('student_name', name);
                router.push('/dashboard');
            } else {
                setError(result.error || 'بيانات الدخول غير صحيحة');
            }
        });
    };

    const selectedBranch = branches.find(b => b.branch_id.toString() === branchId);

    return (
        <form onSubmit={handleSubmit} className="p-6 lg:p-8 relative">
            {/* الشعار */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center mb-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md border-2 border-orange-100">
                        <Image
                            src="/images/logo.png"
                            alt="Logo"
                            fill
                            className="object-contain p-2"
                            priority
                        />
                    </div>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">تسجيل الدخول</h2>
                <p className="text-gray-500 text-sm">أدخل بياناتك للبدء في رحلة التميز</p>
            </div>

            {/* الأخطاء */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border-r-4 border-red-500 rounded-lg text-red-700 text-sm animate-pulse">
                    ⚠️ {error}
                </div>
            )}

            {/* حقل الاسم */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">اسم الطالب</label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="أدخل اسمك الثلاثي..."
                        className="w-full px-4 py-3 pr-11 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-orange-400 transition-all outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isPending}
                    />
                    <span className="absolute right-4 top-3.5 text-gray-400">👤</span>
                </div>
            </div>

            {/* حقل الفرع المخصص */}
            <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">الفرع التعليمي</label>
                <div className="relative" ref={dropdownRef}>
                    <div
                        onClick={() => !isPending && setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl cursor-pointer transition-all flex justify-between items-center ${isDropdownOpen ? 'border-orange-400 bg-white' : 'border-gray-100'}`}
                    >
                        <span className={selectedBranch ? "text-gray-800" : "text-gray-400"}>
                            {selectedBranch?.branch_name || "اختر الفرع من القائمة"}
                        </span>
                        <span className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                    </div>

                    {isDropdownOpen && (
                        <div className="absolute w-full z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-2 border-b border-gray-50">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="ابحث عن فرعك..."
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:ring-1 ring-orange-200"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                {filteredBranches.length > 0 ? (
                                    filteredBranches.map((branch) => (
                                        <div
                                            key={branch.branch_id}
                                            onClick={() => handleBranchSelect(branch.branch_id.toString(), branch.branch_name)}
                                            className="px-4 py-3 hover:bg-orange-50 cursor-pointer text-sm text-gray-700 flex justify-between items-center"
                                        >
                                            {branch.branch_name}
                                            {branchId === branch.branch_id.toString() && <span className="text-orange-500">✓</span>}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-400 text-xs">لا توجد فروع بهذا الاسم</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* زر الدخول */}
            <button
                type="submit"
                disabled={isPending || !name || !branchId}
                className="w-full py-4 bg-gradient-to-l from-orange-600 to-amber-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:grayscale disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جارٍ التحقق...</span>
                    </div>
                ) : (
                    "ابدأ رحلتك الآن 🚀"
                )}
            </button>

            <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full mt-4 text-gray-400 text-sm hover:text-gray-600 transition-colors"
            >
                العودة للرئيسية
            </button>
        </form>
    );
}
