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
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 w-full z-50 pb-safe">
      {/* Glass bar */}
      <div className="bg-lekho-surface/80 backdrop-blur-2xl border-t border-white/[0.07] px-2 py-2">
        <nav className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-200 relative ${
                  isActive ? 'text-lekho-primary-light' : 'text-lekho-muted hover:text-lekho-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active pill indicator above icon */}
                  {isActive && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-1 bg-gradient-lekho rounded-full" />
                  )}
                  <div className="relative">
                    <item.icon className={`w-6 h-6 transition-all duration-200 ${isActive ? 'drop-shadow-[0_0_8px_rgba(124,90,240,0.8)]' : ''}`} />
                    {item.badge > 0 && (
                      <div className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-lekho-surface">
                        {item.badge > 9 ? '9+' : item.badge}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-lekho-primary-light' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default BottomNav;
