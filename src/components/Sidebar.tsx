import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiCalendar,
  FiUsers,
  FiLogOut,
  FiClock,
  FiBarChart2
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const client = JSON.parse(localStorage.getItem('client') || '{}');

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('client');
    navigate('/login');
  };

  const navLinks = (
    <>
      {client.role === 'client' && (
        <>
          <Link to="/appointments" onClick={onClose} className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-blue-50 transition ${isActive('/appointments') ? 'text-blue-600 font-semibold bg-blue-50' : ''}`}>
            <FiClock /> תורים
          </Link>
          <Link to="/calendar" onClick={onClose} className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-blue-50 transition ${isActive('/calendar') ? 'text-blue-600 font-semibold bg-blue-50' : ''}`}>
            <FiCalendar /> יומן גרפי
          </Link>
          <Link
            to="/my-profile"
            onClick={onClose}
            className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-blue-50 transition ${
              isActive('/my-profile') ? 'text-blue-600 font-semibold bg-blue-50' : ''
            }`}
          >
            👤 פרופיל
          </Link>
        </>
      )}

      {client.role === 'admin' && (
        <>
          <Link to="/dashboard" onClick={onClose} className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-blue-50 transition ${isActive('/dashboard') ? 'text-blue-600 font-semibold bg-blue-50' : ''}`}>
            <FiBarChart2 /> לוח ניהול
          </Link>
          <Link to="/clients" onClick={onClose} className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-blue-50 transition ${isActive('/clients') ? 'text-blue-600 font-semibold bg-blue-50' : ''}`}>
            <FiUsers /> לקוחות
          </Link>
          <Link to="/admin/slots" onClick={onClose} className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-blue-50 transition ${isActive('/admin/slots') ? 'text-blue-600 font-semibold bg-blue-50' : ''}`}>
            <FiClock /> ניהול תורים
          </Link>
        </>
      )}
    </>
  );

  const logoutButton = (
    <div className="mt-auto pt-6 border-t">
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:underline transition"
      >
        <FiLogOut /> התנתקות
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex flex-col w-64 fixed top-0 left-0 h-screen bg-white border-r p-6 shadow z-40">
        <div className="flex flex-col items-center mb-12">
          <img src="/crmLogo.png" alt="CRM Logo" className="w-12 h-12 mb-2 rounded-xl shadow" />
          <h2 className="text-xl font-bold text-blue-700 tracking-wide">TOGETHER</h2>
        </div>
        <nav className="flex flex-col gap-4 text-gray-700 flex-grow">
          {navLinks}
        </nav>
        {logoutButton}
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex">
          <div className="flex-1 bg-black bg-opacity-50" onClick={onClose}></div>
          <div className="w-64 bg-white shadow-lg p-6 h-full">
            <div className="flex flex-col items-center mb-8">
              <img src="/crmLogo.png" alt="CRM Logo" className="w-12 h-12 mb-2 rounded-xl shadow" />
              <h2 className="text-xl font-bold text-blue-700 tracking-wide">TOGETHER</h2>
            </div>
            <nav className="flex flex-col gap-4 text-gray-700 flex-grow">
              {navLinks}
            </nav>
            {logoutButton}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
            <p className="text-gray-800 text-lg mb-4">האם אתה בטוח שברצונך להתנתק?</p>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
              >
                ביטול
              </button>
              <button
                onClick={confirmLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                התנתק
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
