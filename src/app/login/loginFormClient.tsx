// src/app/login/loginFormClient.tsx
'use client';

import { useState, useTransition, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// 1. الأنواع
interface Branch {
    branch_id: number;
    branch_name: string;
}

interface LoginSuccessData {
    studentId: number;
    message?: string;
    [key: string]: any;
}

interface LoginFormProps {
    branches: Branch[];
    loginAction: (name: string, branchId: number) => Promise<{ success: boolean; data?: LoginSuccessData; error?: string }>;
}

// 2. المكون العميل الرئيسي
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

    // فلترة الفروع عند البحث
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredBranches(branches);
        } else {
            const filtered = branches.filter(branch =>
                branch.branch_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredBranches(filtered);
        }
    }, [searchTerm, branches]);

    // إغلاق القائمة عند النقر خارجها
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleBranchSelect = (branchId: string, branchName: string) => {
        setBranchId(branchId);
        setSearchTerm(branchName);
        setIsDropdownOpen(false);
    };

    const handleInputClick = () => {
        setIsDropdownOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
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
                // تخزين البيانات في localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('student_id', result.data.studentId.toString());
                    localStorage.setItem('student_name', name);
                }

                // الانتقال لصفحة dashboard
                router.push('/dashboard');
            } else {
                setError(result.error || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
            }
        });
    };

    const selectedBranch = branches.find(b => b.branch_id.toString() === branchId);

    return (
        <form onSubmit={handleSubmit} className="p-6 lg:p-8">
            {/* العنوان */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16  from-white-500  rounded-full mb-4">
<div className="relative w-30 h-30 md:w-16 md:h-16 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300">
              {/* 🔴 تأكد من وجود الصورة في المجلد الصحيح */}
              <Image
                src="/images/logo.png" // ← مسار مطلق من مجلد public
                alt="Power Of Math Logo"
                width={100}
                height={100}
                className="w-full h-full object-contain"
                priority // ← لتحميل الصورة أولاً
              />
            </div>                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                    تسجيل الدخول
                </h2>
                <p className="text-gray-600 text-sm">
                    أدخل بياناتك للبدء
                </p>
            </div>

            {/* رسالة الخطأ */}
            {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-red-500 text-xl">⚠️</span>
                        <span className="text-red-700 font-medium">{error}</span>
                    </div>
                </div>
            )}

            {/* حقل اسم الطالب */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    اسم الطالب
                </label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="أدخل اسمك هنا..."
                        className="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isPending}
                    />
                    <div className="absolute right-100 top-3.5 text-orange-400">
        👤
                    </div>
                </div>
            </div>

            {/* حقل الفرع */}
            <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    الفرع التعليمي
                </label>
                <div className="relative" ref={dropdownRef}>
                    {/* حقل البحث/العرض */}
                    <div 
                        className="w-full px-4 py-3 pr-12 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all"
                        onClick={handleInputClick}
                    >
                        <div className="flex items-center justify-between">
                            <span className={selectedBranch ? "text-gray-800" : "text-gray-400"}>
                                {selectedBranch?.branch_name || "اختر الفرع"}
                            </span>
                            <span className="text-gray-400">
                                {isDropdownOpen ? "▲" : "▼"}
                            </span>
                        </div>
                    </div>

                    {/* القائمة المنسدلة */}
                    {isDropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                            {/* شريط البحث */}
                            <div className="p-3 border-b border-gray-100">
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="🔍 ابحث عن فرع..."
                                        className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        autoFocus
                                    />
                                    <div className="absolute right-3 top-2.5 text-gray-400">
                                        🔍
                                    </div>
                                </div>
                            </div>

                            {/* قائمة الفروع */}
                            <div className="max-h-64 overflow-y-auto">
                                {filteredBranches.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-gray-500">
                                        لا توجد نتائج
                                    </div>
                                ) : (
                                    filteredBranches.map((branch) => (
                                        <div
                                            key={branch.branch_id}
                                            className={`px-4 py-3 cursor-pointer transition-all border-b border-gray-100 last:border-b-0 ${
                                                branchId === branch.branch_id.toString()
                                                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-r-4 border-blue-500'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => handleBranchSelect(branch.branch_id.toString(), branch.branch_name)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`font-medium ${
                                                    branchId === branch.branch_id.toString()
                                                        ? 'text-blue-600'
                                                        : 'text-gray-700'
                                                }`}>
                                                    {branch.branch_name}
                                                </span>
                                                {branchId === branch.branch_id.toString() && (
                                                    <span className="text-blue-500">✓</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* زر الإرسال */}
            <button
                type="submit"
                disabled={isPending || !name || !branchId}
                className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${
                    isPending || !name || !branchId
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl hover:scale-105 shadow-lg'
                }`}
            >
                {isPending ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                        <span>جارٍ الدخول...</span>
                    </>
                ) : (
                    <>
                        <span className="text-xl">ابدأ التدريب الآن</span>
                    </>
                )}
            </button>

            {/* رابط العودة */}
            <div className="mt-6 text-center">
                <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    ← العودة للرئيسية
                </button>
            </div>
        </form>
    );
}