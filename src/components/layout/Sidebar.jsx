import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Bell, User, LogOut, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUnreadStore } from '../../store/useUnreadStore';
import logo from '../../assets/logo.png';

const Sidebar = () => {
  const { signOut, profile, user } = useAuthStore();
  const { unreadMessages, unreadNotifications, startPolling, stopPolling } = useUnreadStore();

  useEffect(() => {
    if (user) {
      startPolling(15000); // Poll every 15s instead of 10s for performance
    }
    return () => stopPolling();
  }, [user]);

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/messages', icon: MessageSquare, label: 'Messages', badge: unreadMessages },
    { to: '/notifications', icon: Bell, label: 'Alerts', badge: unreadNotifications },
    { to: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-gray-200 bg-white px-6 py-8">
      <div className="flex items-center gap-3 mb-10">
        <img src={logo} alt="Lekho Logo" className="h-10 w-auto object-contain drop-shadow-sm" />
        <h1 className="text-2xl font-bold font-bengali text-gray-900 tracking-tight">লেখো</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
              }`
            }
          >
            <div className="relative">
              <item.icon className="w-6 h-6" />
              {item.badge > 0 && (
                <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white ring-1 ring-rose-500/10">
                  {item.badge > 9 ? '9+' : item.badge}
                </div>
              )}
            </div>
            <span className="text-lg">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        {profile && (
          <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile.username?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="truncate">
              <p className="font-semibold text-gray-900 truncate">@{profile.username}</p>
              <p className="text-sm text-gray-500 truncate">{profile.full_name || 'Lekho User'}</p>
            </div>
          </div>
        )}
        <button 
          onClick={signOut}
          className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 font-medium transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-lg">Log out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
