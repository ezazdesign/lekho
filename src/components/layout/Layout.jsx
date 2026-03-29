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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 w-full max-w-2xl min-h-screen border-r border-gray-200 bg-white pb-20 md:pb-0">
        <Outlet />
      </main>
      <RightSidebar />
      <BottomNav />
    </div>
  );
};

export default Layout;
