'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Rocket, Play, Trophy, Users, Brain, Award, 
  Sparkles, Clock, Star, CheckCircle, Smartphone,
  TrendingUp, Heart, Shield, Zap, ChevronRight, 
  Download, Facebook, Twitter, Instagram, Youtube,
  Menu, X, Home, Book, Phone, User,
  MapPin, Mail, Phone as PhoneIcon, Lock,
  Target, Gamepad2, Calculator, Puzzle, Medal, Crown,
  ChevronLeft, ChevronDown
} from 'lucide-react'
import Image from 'next/image';
import Link from 'next/link'

// ==================== المكونات الأساسية ====================

// 1. زر مطور
const Button = ({
  children,
  variant = 'gradient',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  pulse = false,
  className = '',
  ...props
}) => {
  const variants = {
    gradient: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg',
    neon: 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white shadow-[0_0_20px_rgba(255,107,53,0.5)]',
    glass: 'backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20',
    outline: 'border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600',
    subtle: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-3 rounded-2xl',
    lg: 'px-8 py-4 text-lg rounded-2xl',
    xl: 'px-10 py-5 text-xl rounded-3xl',
  }

  return (
    <button
      className={`
        font-bold relative overflow-hidden group
        transition-all duration-300
        hover:-translate-y-1 hover:scale-[1.02]
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
      disabled={loading}
      {...props}
    >
      <span className="relative flex items-center justify-center gap-3">
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
          </>
        )}
      </span>
    </button>
  )
}

// 2. بطاقة مطورة
const Card = ({
  children,
  className = '',
  variant = 'elevated',
  hover = true,
  ...props
}) => {
  const variantsMap = {
    elevated: 'bg-white shadow-xl shadow-gray-200/50',
    glass: 'backdrop-blur-xl bg-white/70 border border-white/30',
    gradient: 'bg-gradient-to-br from-white to-orange-50 border border-orange-100',
    dark: 'bg-gray-900 text-white shadow-2xl',
  }

  return (
    <div
      className={`
        relative rounded-3xl p-8
        transition-all duration-300
        ${variantsMap[variant]}
        ${hover ? 'hover:shadow-2xl hover:-translate-y-2' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

// 3. بطاقة مستوى
const LevelCard = ({
  levelNumber = 1,
  title = 'المستوى الأول',
  description = 'أساسيات الجمع والطرح',
  progress = 0,
  isLocked = false,
  isCurrent = false,
  totalSheets = 10,
  completedSheets = 0,
  onSelect
}) => {
  const colors = [
    'from-orange-400 to-amber-400',
    'from-emerald-400 to-green-400',
    'from-purple-400 to-pink-400',
    'from-cyan-400 to-blue-400',
  ]

  const colorClass = colors[(levelNumber - 1) % colors.length]

  return (
    <div
      className={`
        relative bg-white rounded-3xl p-6 shadow-lg border-2
        ${isLocked ? 'border-gray-200 opacity-75' : 'border-transparent hover:border-orange-200 cursor-pointer'}
        ${isCurrent ? 'ring-4 ring-orange-100' : ''}
        transition-all duration-300 hover:shadow-xl
      `}
      onClick={!isLocked ? onSelect : undefined}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            bg-gradient-to-br ${colorClass} text-white font-bold text-2xl
            shadow-lg
          `}>
            {levelNumber}
          </div>
          
          <div>
            <h3 className="font-bold text-xl text-gray-900">{title}</h3>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        
        <div className={`
          p-3 rounded-xl
          ${isLocked ? 'bg-gray-100 text-gray-400' : 
            progress === 100 ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700' :
            'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700'}
        `}>
          {isLocked ? (
            <Lock className="w-6 h-6" />
          ) : progress === 100 ? (
            <Trophy className="w-6 h-6" />
          ) : (
            <Target className="w-6 h-6" />
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">التقدم</span>
          <span className="font-bold text-gray-900">{progress}%</span>
        </div>
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`
              absolute top-0 left-0 h-full rounded-full
              bg-gradient-to-r ${colorClass}
              transition-all duration-1000 ease-out
            `}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm">
          <Book className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">
            {completedSheets}/{totalSheets} شيت
          </span>
        </div>
        
        {!isLocked && (
          <button 
            className={`
              px-5 py-2 rounded-xl font-medium text-sm
              bg-gradient-to-r ${colorClass} text-white
              hover:shadow-lg
              transition-all duration-300
            `}
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.()
            }}
          >
            {progress === 100 ? 'مراجعة' : isCurrent ? 'متابعة' : 'ابدأ'}
          </button>
        )}
      </div>
    </div>
  )
}

// 4. بطاقة الميزة
const FeatureCard = ({ icon: Icon, title, description, index }) => {
  const colors = [
    'from-orange-500 to-amber-500',
    'from-emerald-500 to-teal-500',
    'from-purple-500 to-pink-500',
    'from-cyan-500 to-blue-500',
    'from-rose-500 to-red-500',
    'from-violet-500 to-purple-500'
  ]

  const colorClass = colors[index % colors.length]

  return (
    <Card className="text-center group hover:border-orange-200">
      <div className={`
        w-16 h-16 rounded-2xl mx-auto mb-6
        bg-gradient-to-br ${colorClass}
        flex items-center justify-center
        group-hover:scale-110
        transition-transform duration-300
      `}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        {title}
      </h3>
      
      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>
    </Card>
  )
}

// 5. عداد الإحصائيات
const StatsCounter = ({ value, label, icon: Icon, color = 'orange' }) => {
  const colors = {
    orange: 'text-orange-500',
    green: 'text-emerald-500',
    purple: 'text-purple-500',
    blue: 'text-cyan-500'
  }

  return (
    <div className="text-center">
      <div className={`
        text-5xl font-bold mb-2
        ${colors[color] || colors.orange}
      `}>
        {typeof value === 'number' ? value.toLocaleString() + '+' : value}
      </div>
      
      <div className="flex items-center justify-center gap-2 text-gray-700">
        <Icon className={`w-5 h-5 ${colors[color] || colors.orange}`} />
        <span className="font-semibold">{label}</span>
      </div>
    </div>
  )
}

// 6. الهيدر
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: 'الرئيسية', href: '#hero', icon: Home },
    { label: 'المميزات', href: '#features', icon: Sparkles },
    { label: 'المستويات', href: '#levels', icon: Book },
    // { label: 'المتصدرين', href: '#leaderboard', icon: Trophy },
    { label: 'التقييمات', href: '#testimonials', icon: Star },
    { label: 'اتصل بنا', href: '#contact', icon: Phone },
  ]

  return (
    <header className={`
      fixed top-0 left-0 right-0 z-50
      transition-all duration-300
      ${scrolled 
        ? 'bg-white/90 backdrop-blur-xl shadow-lg py-2' 
        : 'bg-transparent py-4'
      }
    `}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div> */}
            <div>
              <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300">
                            {/* 🔴 تأكد من وجود الصورة في المجلد الصحيح */}
                            <Image
                              src="/images/logo.png" // ← مسار مطلق من مجلد public
                              alt="Power Of Math Logo"
                              width={64}
                              height={64}
                              className="w-full h-full object-contain"
                              priority // ← لتحميل الصورة أولاً
                            />
                          </div>
              {/* <p className="text-xs text-gray-500">حسابي ممتع</p> */}
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:text-orange-600 font-medium hover:bg-orange-50 transition-all duration-300"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
             <Link href="/login">
            <Button 
            
              variant="subtle" 
              className="hidden md:flex" 
              icon={User}
              iconPosition="right"
            >
              تسجيل الدخول
            </Button>
            </Link>
            <Button 
              variant="gradient" 
              icon={Rocket}
              iconPosition="right"
            >
              ابدأ مجاناً
            </Button>

            <button
              className="lg:hidden p-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden mt-4 bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="flex flex-col p-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 text-gray-700 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </a>
              ))}
              
              <div className="flex gap-3 pt-4 border-t border-gray-100">
           <Link href="/login" onClick={() => setIsMenuOpen(false)}>
  <Button variant="outline" className="flex-1" icon={User}>
    تسجيل الدخول
  </Button>
</Link>
               <Link href="/login">
  <Button 
    variant="gradient" 
    icon={Rocket}
    iconPosition="right"
  >
    ابدأ مجاناً
  </Button>
</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

// ==================== الصفحة الرئيسية ====================

export default function HomePage() {
  const [stats, setStats] = useState({
    students: 0,
    problems: 0,
    challenges: 0,
    rating: 0
  })

  // تأثير عداد الإحصائيات
  useEffect(() => {
    const targets = { students: 5000, problems: 2000000, challenges: 500, rating: 4.8 }
    
    const duration = 2000
    const startTime = performance.now()

    const updateStats = (timestamp) => {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      setStats({
        students: Math.floor(progress * targets.students),
        problems: Math.floor(progress * targets.problems),
        challenges: Math.floor(progress * targets.challenges),
        rating: parseFloat((progress * targets.rating).toFixed(1)),
      })

      if (progress < 1) {
        requestAnimationFrame(updateStats)
      } else {
        setStats(targets)
      }
    }

    requestAnimationFrame(updateStats)
  }, [])

  const features = [
    {
      icon: Gamepad2,
      title: 'تعلم عن طريق اللعب',
      description: 'ألعاب تعليمية تفاعلية تحول الرياضيات إلى مغامرة مثيرة'
    },
    {
      icon: TrendingUp,
      title: 'تتبع التقدم الشخصي',
      description: 'تقارير مفصلة تظهر تطور مهارات طفلك خطوة بخطوة'
    },
    {
      icon: Users,
      title: 'تحديات مع الأصدقاء',
      description: 'منصة تنافسية آمنة للتحديات الرياضية الممتعة'
    },
    {
      icon: Brain,
      title: 'ذكاء اصطناعي مخصص',
      description: 'نظام ذكي يتكيف مع مستوى طفلك ويقترح التمارين المناسبة'
    },
    {
      icon: Medal,
      title: 'نظام تحفيزي',
      description: 'جوائز وشارات وميداليات تحفز الأطفال على الاستمرارية'
    },
    {
      icon: Smartphone,
      title: 'متاح على جميع الأجهزة',
      description: 'تطبيق متكامل يعمل على جميع الأجهزة مع تزامن كامل'
    }
  ]

  const levels = [
    { id: 1, title: 'الأساسيات', description: 'تعلم الأرقام والعد', progress: 100, isCurrent: false, completedSheets: 10, totalSheets: 10 },
    { id: 2, title: 'الجمع والطرح', description: 'مقدمة في العمليات الحسابية', progress: 75, isCurrent: true, completedSheets: 8, totalSheets: 12 },
    { id: 3, title: 'الضرب', description: 'أساسيات جدول الضرب', progress: 30, isLocked: false, completedSheets: 3, totalSheets: 15 },
    { id: 4, title: 'القسمة', description: 'تعلم القسمة البسيطة', progress: 0, isLocked: true, completedSheets: 0, totalSheets: 12 },
  ]

  const testimonials = [
    {
      name: 'أم محمد',
      role: 'والدة طالب',
      content: 'ابني كان يخاف من الرياضيات، الآن أصبح يتسابق لإكمال التحديات!',
      rating: 5,
    },
    {
      name: 'أبو يوسف',
      role: 'معلم رياضيات',
      content: 'أستخدم المنصة مع طلابي، النتائج مذهلة. الأطفال يتعلمون بسرعة وبشغف.',
      rating: 5,
    },
    {
      name: 'سارة',
      role: 'طالبة ١٠ سنوات',
      content: 'أحب الألعاب والتحديات! خاصة عندما أفوز بالميداليات.',
      rating: 5,
    }
  ]

  return (
    <div className="overflow-x-hidden" dir="rtl">
      {/* إضافة الأنيميشنات */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      <Header />
      
      {/* قسم البطل */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50" id="hero">
        <div className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-right space-y-8">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-100 to-amber-100 px-6 py-3 rounded-2xl">
                <Sparkles className="w-5 h-5 text-orange-600" />
                <span className="font-bold text-orange-700">الأكثر مبيعاً في الوطن العربي</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-black leading-tight">
                <span className="block text-gray-900">حول الرياضيات</span>
                <span className="block bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                  إلى مغامرة
                </span>
                <span className="block text-gray-900">يحبها طفلك!</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                منصة تعليمية مبتكرة تجمع بين المتعة والتعلم، صممت خصيصاً لجعل الرياضيات 
                تجربة ممتعة ومسلية للأطفال.
              </p>
              
              <div className="flex flex-wrap gap-4">
            <Link href="/login">
  <Button 
    size="lg" 
    variant="gradient"
    className="px-10 py-4 text-lg"
    icon={Rocket}
  >
    ابدأ رحلة التعلم
  </Button>
</Link>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="px-10 py-4 text-lg"
                  icon={Play}
                >
                  شاهد الفيديو
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative bg-gradient-to-b from-white to-gray-50 rounded-[2.5rem] p-1 shadow-2xl">
                <div className="relative bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-[2rem] p-4">
                  <div className="aspect-video rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4 animate-float">🎮</div>
                      <p className="text-gray-800 font-bold text-xl">تعلم. العب. تقدم.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* قسم المميزات */}
      <section className="py-24 bg-gradient-to-b from-white to-orange-50" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-orange-600 font-bold text-sm uppercase tracking-wider bg-orange-100 px-4 py-2 rounded-full">
                لماذا نحن مختلفون؟
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black mb-6">
              <span className="text-gray-900">تعلم بذكاء،</span>
              <span className="block bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                العب بإبداع
              </span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              نقدم تجربة تعليمية فريدة تجمع بين أحدث تقنيات التعليم وأساليب التحفيز
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* قسم الإحصائيات */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatsCounter 
              value={stats.students} 
              label="طالب مسجل" 
              icon={Users} 
              color="orange"
            />
            <StatsCounter 
              value={stats.problems} 
              label="مسألة محلولة" 
              icon={CheckCircle} 
              color="green"
            />
            <StatsCounter 
              value={stats.challenges} 
              label="تحدي يومي" 
              icon={Zap} 
              color="purple"
            />
            <StatsCounter 
              value={stats.rating} 
              label="تقييم من الآباء" 
              icon={Star} 
              color="blue"
            />
          </div>
        </div>
      </section>

      {/* قسم المستويات */}
      <section className="py-24 bg-white" id="levels">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-emerald-600 font-bold text-sm uppercase tracking-wider bg-emerald-100 px-4 py-2 rounded-full">
                رحلة التعلم
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black mb-6">
              <span className="text-gray-900">ابدأ من الصفر</span>
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                حتى الإتقان
              </span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {levels.map((level) => (
              <LevelCard 
                key={level.id} 
                {...level} 
                onSelect={() => alert(`بدء المستوى: ${level.title}`)}
              />
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              className="px-12"
              icon={ChevronLeft}
              iconPosition="right"
            >
              استعرض جميع المستويات
            </Button>
          </div>
        </div>
      </section>

      {/* قسم التقييمات */}
      <section className="py-24 bg-gradient-to-b from-white to-amber-50" id="testimonials">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-purple-600 font-bold text-sm uppercase tracking-wider bg-purple-100 px-4 py-2 rounded-full">
                آراء العملاء
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black mb-6">
              <span className="text-gray-900">يقولون عنا</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} variant="elevated" className="relative">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-xl flex items-center justify-center text-2xl">
                  "
                </div>
                
                <div className="mb-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < testimonial.rating 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 text-lg leading-relaxed italic mb-8">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* قسم الاشتراك */}
      <section className="py-24 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400" id="cta">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-block mb-6">
         <Link href="/login">
  <span className="font-bold text-sm uppercase tracking-wider bg-white/20 px-4 py-2 rounded-full cursor-pointer hover:bg-white/30 transition">
    ابدأ مجاناً اليوم
  </span>
</Link>
            </div>
            
            <h2 className="text-4xl lg:text-6xl font-black mb-6">
              <span className="block">جاهز لرحلة</span>
              <span className="block text-yellow-300">تعلم لا تُنسى؟</span>
            </h2>
            
            <p className="text-white/90 text-xl mb-12 max-w-2xl mx-auto">
              انضم إلى آلاف الأطفال الذين اكتشفوا متعة الرياضيات. سجل الآن وابدأ
              رحلة التعلم مع 7 أيام تجريبية مجانية.
            </p>
            
            <Card variant="glass" className="max-w-2xl mx-auto p-8 backdrop-blur-xl">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      اسم الطفل
                    </label>
                    <input
                      type="text"
                      placeholder="أدخل اسم طفلك"
                      className="w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      عمر الطفل
                    </label>
                    <select className="w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all outline-none">
                      <option value="">اختر العمر</option>
                      {[6,7,8,9,10,11,12].map(age => (
                        <option key={age} value={age}>{age} سنوات</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    بريد ولي الأمر
                  </label>
                  <input
                    type="email"
                    placeholder="أدخل بريدك الإلكتروني"
                    className="w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all outline-none"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  size="xl" 
                  fullWidth
                  variant="gradient"
                  className="mt-8 text-xl py-6"
                  icon={Rocket}
                >
                  ابدأ التعلم المجاني
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* الفوتر */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Power Of Math</h3>
                  <p className="text-sm text-amber-200">حسابي ممتع</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6">
                منصة تعليمية رائدة تهدف إلى تحويل تعلم الرياضيات إلى تجربة ممتعة 
                للأطفال العرب.
              </p>
              
              <div className="flex gap-3">
                {[Facebook, Twitter, Instagram, Youtube].map((Icon, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-500 transition-all duration-300"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {[
              {
                title: 'روابط سريعة',
                links: [
                  { label: 'الرئيسية', href: '#hero' },
                  { label: 'المميزات', href: '#features' },
                  { label: 'المستويات', href: '#levels' },
                  { label: 'التقييمات', href: '#testimonials' },
                ]
              },
              {
                title: 'الدعم',
                links: [
                  { label: 'الأسئلة الشائعة', href: '#' },
                  { label: 'الدليل', href: '#' },
                  { label: 'الخصوصية', href: '#' },
                ]
              },
              {
                title: 'تواصل معنا',
                links: [
                  { label: 'القاهرة، مصر', href: '#', icon: MapPin },
                  { label: '+20 123 456 7890', href: 'tel:+201234567890', icon: PhoneIcon },
                  { label: 'info@powerofmath.com', href: 'mailto:info@powerofmath.com', icon: Mail },
                ]
              },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className="text-lg font-bold mb-4 text-amber-300">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="flex items-center gap-2 text-gray-400 hover:text-amber-300 transition-colors"
                      >
                        {link.icon && <link.icon className="w-4 h-4" />}
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-right">
                <p className="text-gray-400">
                  © 2025 Power Of Math. جميع الحقوق محفوظة.
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  صنع ب <Heart className="inline w-3 h-3 text-red-400" /> للأطفال العرب
                </p>
              </div>
              
              <div>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    variant="glass" 
                    className="bg-gray-800 hover:bg-gray-700"
                    icon={Download}
                    size="sm"
                  >
                    App Store
                  </Button>
                  <Button 
                    variant="glass" 
                    className="bg-gray-800 hover:bg-gray-700"
                    icon={Download}
                    size="sm"
                  >
                    Google Play
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
