import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Settings, 
  LogOut, 
  UserCheck,
  ChevronRight,
  PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Sidebar: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Insights', icon: PieChart, path: '/insights' },
    { label: 'All Students', icon: Users, path: '/admin/students' },
    { label: 'Add Student', icon: UserPlus, path: '/admin/students/new' },
  ];

  if (profile?.role === 'program_manager') {
    navItems.push({ label: 'Team Management', icon: UserCheck, path: '/admin/team' });
  }

  return (
    <aside className="w-72 bg-tfi-dark min-h-screen flex flex-col text-white fixed left-0 top-0 z-50 shadow-2xl">
      {/* Logo */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-tfi-pink rounded-xl flex items-center justify-center shadow-lg shadow-tfi-pink/30">
          <span className="text-2xl font-bold italic">T</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">ITEACH ADMISSIONS</h1>
          <p className="text-[10px] text-tfi-muted tracking-[0.2em] uppercase font-bold">Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <div className="text-[11px] font-bold text-tfi-muted uppercase tracking-widest px-4 mb-4">Main Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "sidebar-link group",
              isActive && "sidebar-link-active"
            )}
          >
            <item.icon size={20} className={cn("transition-transform group-hover:scale-110")} />
            <span className="font-medium">{item.label}</span>
            {item.path === window.location.pathname && (
              <ChevronRight size={16} className="ml-auto opacity-50" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-white/5 space-y-4">
        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-tfi-pink to-tfi-cyan flex items-center justify-center text-sm font-bold shadow-inner">
            {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{profile?.name || 'User'}</p>
            <p className="text-[10px] text-tfi-muted truncate uppercase tracking-wider">{profile?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 font-medium"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
