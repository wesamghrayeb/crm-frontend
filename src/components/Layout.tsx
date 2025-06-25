import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const showSidebar = location.pathname !== '/login';
  const showHeader = location.pathname !== '/login';

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100">
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      )}

      {/* Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? 'sm:ml-64' : ''}`}>
        {/* Header */}
        {showHeader && <Header onToggleSidebar={toggleSidebar} />}

        {/* Main Content */}
        <main className="flex-grow px-4 sm:px-6 py-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-md p-6 min-h-full">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t py-4 text-center text-sm text-gray-600 shadow-inner">
          &copy; {new Date().getFullYear()} | כל הזכויות שמורות{' '}
          <a
            href="https://wesamghrayeb.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 hover:underline"
          >
            Wesam
          </a>{' '}
          - פותח על ידי
        </footer>
      </div>
    </div>
  );
};

export default Layout;
