import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Bell, User, LogOut, MessageSquare, Feather } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUnreadStore } from '../../store/useUnreadStore';

const Sidebar = () => {
  const { signOut, profile, user } = useAuthStore();
  const navigate = useNavigate();
  const { unreadMessages, unreadNotifications, startPolling, stopPolling } = useUnreadStore();

  useEffect(() => {
    if (user) startPolling(15000);
    return () => stopPolling();
  }, [user]);

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/messages', icon: MessageSquare, label: 'Messages', badge: unreadMessages },
    { to: '/notifications', icon: Bell, label: 'Alerts', badge: unreadNotifications },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-white/[0.06] bg-lekho-surface/80 backdrop-blur-xl px-5 py-7">
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-3 mb-10 px-2 group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-lekho flex items-center justify-center shadow-glow-purple shrink-0">
          <Feather className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-bold font-bengali gradient-text tracking-tight">লেখো</span>
      </button>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-lekho-primary/15 text-lekho-primary-light font-semibold shadow-glow-purple'
                  : 'text-lekho-muted hover:text-lekho-text hover:bg-white/[0.05] font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative shrink-0">
                  <item.icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-lekho-primary-light' : ''}`} />
                  {item.badge > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-lekho-surface shadow-glow-rose animate-badge-pop">
                      {item.badge > 9 ? '9+' : item.badge}
                    </div>
                  )}
                </div>
                <span className="text-[15px]">{item.label}</span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-lekho rounded-r-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Card + Logout */}
      <div className="mt-auto space-y-3">
        {profile && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-lekho-primary/30 transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/profile')}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-lekho-soft flex items-center justify-center text-lekho-primary-light font-bold overflow-hidden shrink-0 ring-2 ring-lekho-primary/20 group-hover:ring-lekho-primary/50 transition-all">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile.username?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="truncate flex-1">
              <p className="font-semibold text-lekho-text text-sm truncate">{profile.full_name || profile.username}</p>
              <p className="text-xs text-lekho-muted truncate">@{profile.username}</p>
            </div>
          </div>
        )}

        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-2xl text-lekho-muted hover:text-rose-400 hover:bg-rose-500/10 font-medium transition-all duration-200 text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
