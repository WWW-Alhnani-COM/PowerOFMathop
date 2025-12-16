'use client'

import { useState, useEffect } from 'react'
import { 
  Rocket, Play, Trophy, Users, Brain, Award, 
  Sparkles, Clock, Star, CheckCircle, Smartphone,
  TrendingUp, Heart, Shield, Zap, ChevronRight, 
  Download, Facebook, Twitter, Instagram, Youtube,
  Menu, X, Home, Book, Phone, User,
  MapPin, Mail, Phone as PhoneIcon, Lock,
} from 'lucide-react'

// ==================== الألوان والتصميم (Tailwind Custom Colors) ====================
// ملاحظة: الألوان الأساسية يفترض تعريفها في ملف tailwind.config.js كالتالي:
// primary: #4F46E5 (blue-600), secondary: #8B5CF6 (purple-600), warning: #F59E0B (yellow-600)

// ==================== المكونات الداخلية ====================

// 1. زر قابل لإعادة الاستخدام (Button)
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon: Icon,
  className = '',
  ...props
}: any) => {
  // تعريف الألوان المشابهة لتوصيفك (Primary: Blue/Purple Gradient)
  const variants: Record<string, string> = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    success: 'bg-green-600 text-white hover:bg-green-700',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
  }

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  }

  return (
    <button
      className={`
        rounded-xl font-medium
        transition-all duration-300
        hover:scale-[1.02] active:scale-[0.98]
        shadow-lg hover:shadow-xl
        flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" />}
          {children}
        </>
      )}
    </button>
  )
}

// 2. بطاقة قابلة لإعادة الاستخدام (Card) - تُستخدم للمميزات و CTA
const Card = ({
  children,
  className = '',
  hover = true,
  ...props
}: any) => {
  return (
    <div
      className={`
        bg-white rounded-2xl p-6
        shadow-lg border border-gray-100
        ${hover ? 'hover:shadow-xl transition-shadow duration-300' : ''}
        ${className}
      `}
      {...props}
    >
      <div className="text-gray-700">{children}</div>
    </div>
  )
}

// 3. بطاقة المستوى (LevelCard)
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
}: any) => {
  const getLevelColor = (level: number) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-yellow-500 to-amber-500',
      'from-indigo-500 to-blue-500',
      'from-pink-500 to-rose-500',
      'from-teal-500 to-cyan-500'
    ]
    return colors[(level - 1) % colors.length]
  }

  return (
    <div
      className={`
        bg-white rounded-2xl p-6 shadow-lg border-2
        ${isLocked ? 'border-gray-200 opacity-60' : 'border-transparent hover:border-blue-200 cursor-pointer'}
        ${isCurrent ? 'ring-4 ring-blue-100' : ''}
        transition-all duration-300 hover:shadow-xl
      `}
      onClick={!isLocked ? onSelect : undefined}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`
            w-14 h-14 rounded-full flex items-center justify-center
            text-white font-bold text-xl
            ${isLocked ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 
              `bg-gradient-to-r ${getLevelColor(levelNumber)}`}
          `}>
            {levelNumber}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        
        <div className="text-right">
          {isLocked ? (
            <Lock className="w-6 h-6 text-gray-400" />
          ) : progress === 100 ? (
            <Trophy className="w-6 h-6 text-yellow-500" />
          ) : isCurrent ? (
            <Star className="w-6 h-6 text-blue-500" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-500" />
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">التقدم</span>
          <span className="font-bold text-gray-900">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">
          {completedSheets}/{totalSheets} شيتات
        </span>
        {!isLocked && (
          <button 
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.()
            }}
          >
            {isCurrent ? 'متابعة' : progress > 0 ? 'استئناف' : 'ابدأ'}
          </button>
        )}
      </div>
    </div>
  )
}

// 4. بطاقة الرأي (TestimonialCard)
const TestimonialCard = ({
  name = 'مستخدم',
  role = 'ولي أمر',
  content = 'رأي المستخدم',
  rating = 5,
}: any) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
      
      <p className="text-gray-700 mb-6 italic">"{content}"</p>
      
      <div className="flex items-center gap-3">
        {/* Placeholder for user avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
          <span className="text-xl">👤</span>
        </div>
        <div>
          <h4 className="font-bold text-gray-900">{name}</h4>
          <p className="text-sm text-gray-600">{role}</p>
        </div>
      </div>
    </div>
  )
}

// 5. الهيدر (Header)
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { label: '🏠 الرئيسية', href: '#', icon: Home },
    { label: '🎯 المميزات', href: '#features', icon: Star },
    { label: '📚 المستويات', href: '#levels', icon: Book },
    { label: '🏆 المتصدرين', href: '#leaderboard', icon: Trophy },
    { label: '📞 اتصل بنا', href: '#contact', icon: Phone },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">🧮</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Power Of Math</h1>
              <p className="text-xs text-gray-500">الرياضيات للأطفال بطريقة ممتعة</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden md:flex" icon={User}>
              تسجيل الدخول
            </Button>
            <Button variant="warning" className="hidden md:flex">
              🚀 ابدأ مجاناً
            </Button>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </a>
              ))}
              
              <div className="flex gap-3 pt-3">
                <Button variant="outline" className="flex-1" icon={User}>
                  تسجيل الدخول
                </Button>
                <Button variant="primary" className="flex-1">
                  ابدأ مجاناً
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

// 6. الفوتر (Footer)
const Footer = () => {
  const footerLinks = {
    روابط: [
      { label: '🏠 الرئيسية', href: '#' },
      { label: '🎯 المميزات', href: '#features' },
      { label: '📚 المستويات', href: '#levels' },
      { label: '🏆 المتصدرين', href: '#leaderboard' },
      { label: '📞 اتصل بنا', href: '#contact' },
    ],
    المساعدة: [
      { label: '❓ الأسئلة الشائعة', href: '#' },
      { label: '📖 الدليل', href: '#' },
      { label: '🛡️ الخصوصية', href: '#' },
      { label: '📄 الشروط', href: '#' },
    ],
    التواصل: [
      { label: '📍 القاهرة، مصر', href: '#', icon: MapPin },
      { label: '📞 +20 123 456 7890', href: 'tel:+201234567890', icon: PhoneIcon },
      { label: '📧 info@powerofmath.com', href: 'mailto:info@powerofmath.com', icon: Mail },
    ],
  }

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-2xl">🧮</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Power Of Math</h3>
                <p className="text-sm text-gray-400">جعل الرياضيات سهلة وممتعة لكل طفل</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6">
              منصة تعليمية رائدة تهدف إلى تحويل تعلم الرياضيات إلى تجربة ممتعة 
              ومحفزة للأطفال في جميع أنحاء العالم العربي.
            </p>
            
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-lg font-bold mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link: any) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
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
            <div>
              <h5 className="font-bold mb-2">متوفر على</h5>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors">
                  <Download className='w-5 h-5'/>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">حمل على</div>
                    <div className="font-bold">App Store</div>
                  </div>
                </button>
                <button className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors">
                  <Download className='w-5 h-5'/>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">متوفر على</div>
                    <div className="font-bold">Google Play</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-gray-400">
                © 2024 Power Of Math. جميع الحقوق محفوظة.
              </p>
              <p className="text-gray-500 text-sm mt-1">
                صنع ب <Heart className="inline w-3 h-3 text-red-400" /> للأطفال العرب
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ==================== الصفحة الرئيسية (HomePage) ====================

export default function HomePage() {
  const [stats, setStats] = useState({
    students: 0,
    problems: 0,
    challenges: 0,
    rating: 0
  })

  // تأثير عداد الإحصائيات المتحرك
  useEffect(() => {
    // القيم المستهدفة: 5000, 2000000, 500, 4.8
    const targets = { students: 5000, problems: 2000000, challenges: 500, rating: 4.8 };
    
    let currentStats = { students: 0, problems: 0, challenges: 0, rating: 0 };
    const duration = 2000; // 2 ثانية
    const startTime = performance.now();

    const updateStats = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setStats({
        students: Math.floor(progress * targets.students),
        problems: Math.floor(progress * targets.problems),
        challenges: Math.floor(progress * targets.challenges),
        rating: parseFloat((progress * targets.rating).toFixed(1)),
      });

      if (progress < 1) {
        requestAnimationFrame(updateStats);
      } else {
        // ضمان الوصول للقيم النهائية بدقة
        setStats(targets);
      }
    };

    const animationFrameId = requestAnimationFrame(updateStats);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [])

  const levels = [
    { id: 1, title: 'المستوى الأول', description: 'أساسيات الجمع والطرح', progress: 100, isCurrent: false, completedSheets: 10, totalSheets: 10 },
    { id: 2, title: 'المستوى الثاني', description: 'أصدقاء الخمسة والخمسين', progress: 50, isCurrent: true, completedSheets: 5, totalSheets: 10 },
    { id: 3, title: 'المستوى الثالث', description: 'أصدقاء العشرة', progress: 0, isLocked: true, completedSheets: 0, totalSheets: 12 },
    { id: 4, title: 'المستوى الرابع', description: 'قاعدة العائلة', progress: 0, isLocked: true, completedSheets: 0, totalSheets: 15 },
  ]

  const features = [
    {
      icon: Play,
      title: '🎮 تعلم عن طريق اللعب',
      description: 'ألعاب تعليمية تحول الرياضيات إلى مغامرة مثيرة',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: TrendingUp,
      title: '📈 تتبع التقدم الشخصي',
      description: 'تقارير مفصلة تظهر تطور مهارات طفلك خطوة بخطوة',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      title: '👥 تحديات مع الأصدقاء',
      description: 'تنافس مع الأصدقاء في تحديات رياضية ممتعة',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Brain,
      title: '🧠 ذكاء اصطناعي مخصص',
      description: 'نظام ذكي يقترح التمارين المناسبة لمستوى طفلك',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Award,
      title: '🏆 نظام تحفيزي',
      description: 'جوائز وشارات وميداليات تحفز الاستمرارية',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      icon: Smartphone,
      title: '📱 متاح على جميع الأجهزة',
      description: 'استخدم المنصة على الكمبيوتر، التابلت، أو الجوال',
      color: 'from-indigo-500 to-blue-500'
    }
  ]

  const testimonials = [
    {
      name: 'أم محمد',
      role: 'والدة طالب في الصف الثالث',
      content: 'ابني كان يكره الرياضيات، والآن أصبح يتطلع لحل التمارين كل يوم!',
      rating: 5,
    },
    {
      name: 'أبو يوسف',
      role: 'ولي أمر',
      content: 'المنصة ساعدت ابنتي على تحسين مستواها من ٦٠٪ إلى ٩٥٪ في فصل واحد!',
      rating: 5,
    },
    {
      name: 'أحمد',
      role: 'طالب ٩ سنوات',
      content: 'أحب التحديات مع أصدقائي، خاصة عندما أفوز عليهم! 😊',
      rating: 5,
    }
  ]

  return (
    <div className="overflow-hidden" dir="rtl">
      <Header />
      
      {/* 🔝 قسم البطل (Hero Section) */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white overflow-hidden" id="hero">
        <div className="absolute inset-0">
          {/* تأثيرات Blob */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">#1 منصة رياضيات للأطفال</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                منصة تعليم الرياضيات
                <span className="block text-cyan-300">الأكثر متعة للأطفال!</span>
              </h1>
              
              <p className="text-xl mb-8 opacity-90 max-w-2xl">
                ساعد طفلك على حب **الرياضيات** وتطوير مهاراته الحسابية من خلال 
                ألعاب وتحديات تفاعلية ممتعة مصممة خصيصاً للأطفال.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <Button 
                  size="xl" 
                  variant="warning"
                  className="px-8 py-4 text-lg"
                  icon={Rocket}
                >
                  🚀 ابدأ التعلم مجاناً
                </Button>
                <Button 
                  variant="outline" 
                  size="xl"
                  className="px-8 py-4 text-lg border-2 border-white text-white hover:bg-white/10"
                  icon={Play}
                >
                  🎬 شاهد الفيديو التعريفي
                </Button>
              </div>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-300" />
                  <span>مناسب للأعمار 6-12 سنة</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-yellow-300" />
                  <span>8 مستويات تعليمية</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-300" />
                  <span>تحديات تفاعلية</span>
                </div>
              </div>
            </div>
            
            {/* عرض محاكاة للتطبيق */}
            <div className="relative">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-2">
                <div className="bg-gradient-to-br from-white to-gray-100 rounded-2xl p-6 shadow-2xl">
                  {/* يمكن استبدال هذا بالصورة الحقيقية للمنصة */}
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🖼️</div>
                      <p className="text-gray-600 font-bold">عرض حي للتعلم التفاعلي</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                <Star className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* موجة تفصل القسم عن التالي */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* 📊 قسم المميزات (Features Grid) */}
      <section className="py-20 bg-gray-50" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              لماذا تختار <span className="text-blue-600">Power Of Math</span>؟
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              نقدم تجربة تعليمية فريدة تجعل الرياضيات مغامرة يحبها الأطفال
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover:scale-[1.03] transition-transform duration-300 border-0 shadow-lg hover:shadow-xl"
              >
                <div className={`p-4 rounded-2xl bg-gradient-to-r ${feature.color} w-16 h-16 flex items-center justify-center mb-4`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <hr className="my-10 border-gray-100" />

      {/* 🎮 قسم المستويات (Levels Preview) */}
      <section className="py-20" id="levels">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              رحلة التعلم من البداية إلى التميز
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              8 مستويات مصممة بعناية لتطوير مهارات الرياضيات خطوة بخطوة
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {levels.map((level) => (
              <LevelCard key={level.id} {...level} onSelect={() => alert(`بدء المستوى: ${level.title}`)} />
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              className="px-8"
              icon={ChevronRight}
            >
              👀 شاهد جميع المستويات (قريباً)
            </Button>
          </div>
        </div>
      </section>

      <hr className="my-10 border-gray-100" />

      {/* 🏆 قسم الإحصائيات (Statistics Counter) */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {stats.students.toLocaleString()}+
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <Users className="w-5 h-5" />
                <span className="font-semibold">طالب مسجل</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {stats.problems.toLocaleString()}+
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">مسألة محلولة</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">
                {stats.challenges}+
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <Zap className="w-5 h-5" />
                <span className="font-semibold">تحدي يومي</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-5xl font-bold text-yellow-600 mb-2">
                {stats.rating.toFixed(1)}
                <span className="text-2xl">/5</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <Star className="w-5 h-5 fill-yellow-600" />
                <span className="font-semibold">تقييم من الآباء</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <hr className="my-10 border-gray-100" />

      {/* 👥 قسم آراء المستخدمين (Testimonials) */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ماذا يقول أولياء الأمور والطلاب؟
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              انضم إلى آلاف العائلات السعيدة التي اكتشفت متعة تعلم الرياضيات
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* 📱 قسم التطبيق (App Showcase) */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                تعلم في أي وقت ومن أي مكان!
              </h2>
              <p className="text-gray-300 text-lg mb-8">
                حمل تطبيقنا على جهازك واستمتع بتجربة تعلم سلسة على جميع أجهزتك.
                تزامن كامل بين جميع الأجهزة.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  className="bg-white text-gray-900 hover:bg-gray-100"
                  icon={Download}
                >
                  <div className="text-left">
                    <div className="text-xs">حمل على</div>
                    <div className="font-bold">App Store</div>
                  </div>
                </Button>
                
                <Button 
                  className="bg-white text-gray-900 hover:bg-gray-100"
                  icon={Download}
                >
                  <div className="text-left">
                    <div className="text-xs">متوفر على</div>
                    <div className="font-bold">Google Play</div>
                  </div>
                </Button>
              </div>
              
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-sm text-gray-400">آمن للأطفال</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm text-gray-400">دعم فني</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">0 إعلانات</div>
                  <div className="text-sm text-gray-400">خالي من الإعلانات</div>
                </div>
              </div>
            </div>
            
            {/* محاكاة عرض الأجهزة (Showcase Devices) */}
            <div className="relative h-[600px] hidden lg:block">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                 
              </div>
              <div className="relative mx-auto max-w-md">
                <div className="relative bg-gradient-to-b from-gray-800 to-black rounded-[3rem] p-6 w-64 h-[500px] mx-auto shadow-2xl">
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl"></div>
                  <div className="h-full bg-gradient-to-br from-blue-900 to-purple-900 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl mb-4">📱</div>
                      <p className="font-bold">Power Of Math</p>
                      <p className="text-sm opacity-75">التطبيق الرسمي</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-10 -left-20 bg-gradient-to-b from-gray-800 to-black rounded-2xl p-4 w-48 h-64 shadow-2xl rotate-[-5deg]">
                  <div className="h-full bg-gradient-to-br from-green-900 to-cyan-900 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎮</div>
                      <p className="text-sm font-bold">ألعاب تعليمية</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-10 -right-20 bg-gradient-to-b from-gray-800 to-black rounded-xl p-3 w-56 h-40 shadow-2xl rotate-[5deg]">
                  <div className="h-full bg-gradient-to-br from-purple-900 to-pink-900 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📈</div>
                      <p className="text-sm font-bold">تتبع التقدم</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📞 قسم الدعوة للإجراء (Call to Action) */}
      <section className="py-20 bg-gradient-to-r from-cyan-500 to-blue-600 relative overflow-hidden" id="cta">
        <div className="absolute inset-0 opacity-10">
          <div className="w-96 h-96 bg-white rounded-full absolute -top-10 -right-10 filter blur-3xl"></div>
          <div className="w-72 h-72 bg-white rounded-full absolute -bottom-10 -left-10 filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-white">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                جاهز لبدء <span className="text-yellow-300">رحلة طفلك</span> مع الرياضيات؟
              </h2>
              <p className="text-xl opacity-90 mb-8">
                سجل الآن **مجاناً** وشاهد الفرق في مستوى طفلك في غضون أسابيع!
              </p>
              
              <div className="flex items-center gap-4 text-lg font-semibold">
                <Shield className="w-6 h-6 text-green-300" />
                <span>لا تحتاج إلى بطاقة ائتمانية للبدء.</span>
              </div>
            </div>
            
            <Card className="p-8 border-none shadow-2xl bg-white text-gray-900">
              <h3 className="text-2xl font-bold mb-4 text-center">سجل الآن وابدأ مجاناً</h3>
              <form className="space-y-4">
                <div>
                  <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-1">
                    👤 اسم الطفل
                  </label>
                  <input
                    type="text"
                    id="childName"
                    placeholder="أدخل اسم طفلك"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    📧 البريد الإلكتروني لولي الأمر
                  </label>
                  <input
                    type="email"
                    id="parentEmail"
                    placeholder="أدخل بريدك الإلكتروني"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  size="xl" 
                  fullWidth 
                  variant="primary"
                  className="mt-6 text-xl"
                  icon={Rocket}
                >
                  🚀 ابدأ الآن - مجاناً
                </Button>
                
                <Button  
                  variant="ghost" 
                  fullWidth 
                  className="text-gray-500 hover:bg-gray-50 text-base"
                >
                  أو جرب نسخة تجريبية بدون تسجيل
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// src/app/(marketing)/page.jsx  أو src/app/page.jsx
