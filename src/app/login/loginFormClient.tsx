'use client';

import { useState, useTransition, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Branch {
    branch_id: number;
    branch_name: string;
}

interface LoginFormProps {
    branches: Branch[];
    loginAction: (name: string, branchId: number) => Promise<{ success: boolean; data?: { studentId: number }; error?: string }>;
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

    useEffect(() => {
        setFilteredBranches(branches.filter(b => b.branch_name.includes(searchTerm)));
    }, [searchTerm, branches]);

    useEffect(() => {
        const checkOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
        };
        document.addEventListener('mousedown', checkOutside);
        return () => document.removeEventListener('mousedown', checkOutside);
    }, []);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!name || !branchId) return setError('يرجى ملء كافة البيانات');
        
        startTransition(async () => {
            const result = await loginAction(name, parseInt(branchId));
            if (result.success) {
                localStorage.setItem('student_id', result.data!.studentId.toString());
                localStorage.setItem('student_name', name);
                router.push('/dashboard');
            } else setError(result.error || 'خطأ في الدخول');
        });
    };

    const selectedBranch = branches.find(b => b.branch_id.toString() === branchId);

    return (
        <form onSubmit={handleSubmit} className="p-8 relative antialiased">
            {/* Header Section */}
            <div className="text-center mb-10">
                <div className="inline-block relative w-24 h-24 mb-6 drop-shadow-xl group">
                    <Image
                        src="/images/logo.png"
                        alt="Power of Math Logo"
                        fill
                        className="object-contain transition-transform duration-500 group-hover:rotate-12"
                        priority
                    />
                </div>
                
                {/* استخدام Amiri للعناوين لإعطاء هوية قوية */}
                <h2 className="text-4xl font-bold text-gray-900 mb-2 font-[family-name:var(--font-amiri)]">
                    تسجيل الدخول
                </h2>
                
                {/* استخدام Fredoka للنصوص الترحيبية لإضفاء طابع تعليمي ممتع */}
                <p className="text-orange-600 text-lg font-medium font-[family-name:var(--font-fredoka)] tracking-wide">
                    Power Of Math
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border-r-4 border-red-500 text-red-800 text-sm font-bold font-[family-name:var(--font-inter)] animate-in fade-in slide-in-from-right-1">
                    {error}
                </div>
            )}

            {/* Inputs Section */}
            <div className="space-y-6 mb-10 font-[family-name:var(--font-inter)]">
                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2.5 mr-1 font-[family-name:var(--font-fredoka)]">
                        اسم الطالب
                    </label>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="اكتب اسمك الثلاثي هنا..."
                            className="w-full px-5 py-4 pr-12 bg-white border-2 border-gray-100 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all outline-none text-gray-900 font-medium placeholder:text-gray-400"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xl grayscale group-focus-within:grayscale-0 transition-all">👤</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2.5 mr-1 font-[family-name:var(--font-fredoka)]">
                        الفرع التعليمي
                    </label>
                    <div className="relative" ref={dropdownRef}>
                        <div
                            onClick={() => !isPending && setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full px-5 py-4 bg-white border-2 rounded-2xl cursor-pointer transition-all flex justify-between items-center ${isDropdownOpen ? 'border-orange-500 ring-4 ring-orange-50' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                            <span className={`font-bold ${selectedBranch ? "text-gray-900" : "text-gray-400"}`}>
                                {selectedBranch?.branch_name || "اختر الفرع الدراسي"}
                            </span>
                            <span className={`text-xs transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-orange-600' : 'text-gray-400'}`}>▼</span>
                        </div>

                        {isDropdownOpen && (
                            <div className="absolute w-full z-50 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-3 bg-gray-50/50">
                                    <input
                                        type="text"
                                        placeholder="بحث عن فرع..."
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 font-[family-name:var(--font-inter)]"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-56 overflow-y-auto font-[family-name:var(--font-amiri)]">
                                    {filteredBranches.map((b) => (
                                        <div
                                            key={b.branch_id}
                                            onClick={() => { setBranchId(b.branch_id.toString()); setIsDropdownOpen(false); }}
                                            className="px-5 py-3.5 hover:bg-orange-50 cursor-pointer text-lg font-bold text-gray-700 flex justify-between items-center transition-colors border-b border-gray-50 last:border-0"
                                        >
                                            {b.branch_name}
                                            {branchId === b.branch_id.toString() && <span className="text-orange-500 text-lg">✓</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Submit Button - استخدام Fredoka لإعطاء طابع حيوي */}
            <button
                type="submit"
                disabled={isPending || !name || !branchId}
                className="w-full py-5 bg-gradient-to-l from-orange-600 to-amber-500 text-white rounded-2xl font-bold text-xl shadow-xl shadow-orange-100 hover:shadow-orange-200 hover:-translate-y-1 active:translate-y-0 transition-all disabled:grayscale disabled:opacity-50 font-[family-name:var(--font-fredoka)] tracking-wide"
            >
                {isPending ? "جاري التحقق..." : "ابدأ التحدي الآن 🚀"}
            </button>

            <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full mt-6 text-gray-400 text-sm font-bold hover:text-orange-600 transition-colors font-[family-name:var(--font-fredoka)]"
            >
                ← العودة للرئيسية
            </button>
        </form>
    );
}
