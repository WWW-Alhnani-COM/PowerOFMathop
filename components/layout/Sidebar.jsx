// Sidebar.jsx
import { LayoutDashboard, Users, Zap, BookOpen, Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const NavItem = ({ href, icon: Icon, label }) => (
  <li className="my-1">
    <Link href={href} className="flex items-center p-4 rounded-xl font-bold text-lg transition-all hover:bg-primary/20 hover:text-primary active:bg-primary/30">
      <Icon className="w-6 h-6 ml-3" />
      {label}
    </Link>
  </li>
);

const Sidebar = ({ isVisible }) => (
  <div className={`w-64 bg-base-100 shadow-2xl min-h-screen p-4 transition-transform duration-300 fixed lg:static z-20 ${isVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
    <ul className="menu">
      <NavItem href="/dashboard" icon={LayoutDashboard} label="لوحة التحكم" />
      <NavItem href="/levels" icon={BookOpen} label="المستويات" />
      <NavItem href="/challenges" icon={Zap} label="التحديات" />
      <NavItem href="/leaderboard" icon={Users} label="المتصدرين" />
      <NavItem href="/reports" icon={Star} label="التقارير" />
      <NavItem href="/chat" icon={MessageSquare} label="الدردشة" />
    </ul>
  </div>
);
export default Sidebar;