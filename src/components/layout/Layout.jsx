import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import RightSidebar from './RightSidebar';
import { useAuthStore } from '../../store/useAuthStore';

const Layout = () => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lekho-base">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-lekho flex items-center justify-center shadow-glow-purple animate-glow-pulse">
              <span className="text-2xl font-bold text-white font-bengali">ল</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-lekho-primary"
                style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-lekho-base flex justify-center max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 w-full max-w-2xl min-h-screen border-x border-white/[0.05] bg-lekho-surface/40 pb-24 md:pb-0">
        <Outlet />
      </main>
      <RightSidebar />
      <BottomNav />
    </div>
  );
};

export default Layout;
