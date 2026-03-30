import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Bell, User, MessageSquare } from 'lucide-react';
import { useUnreadStore } from '../../store/useUnreadStore';

const BottomNav = () => {
  const { unreadMessages, unreadNotifications } = useUnreadStore();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/notifications', icon: Bell, label: 'Alerts', badge: unreadNotifications },
    { to: '/messages', icon: MessageSquare, label: 'Messages', badge: unreadMessages },
    { to: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 px-6 py-3 pb-safe z-50">
      <nav className="flex items-center justify-between">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            <div className="relative">
              <item.icon className="w-6 h-6" />
              {item.badge > 0 && (
                <div className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white ring-1 ring-rose-500/10">
                  {item.badge > 9 ? '9+' : item.badge}
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;
