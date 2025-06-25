import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut, FiMenu } from 'react-icons/fi';
import { useClient } from '../contexts/ClientContext';

const Header: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { client, setClient } = useClient();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white shadow-md px-4 py-3 flex items-center justify-between">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              onToggleSidebar();
            }}
            className="sm:hidden text-white text-2xl hover:text-yellow-300"
          >
            <FiMenu />
          </button>
        )}

        <div className="flex items-center gap-2">
          <img src="/crmLogo.png" alt="CRM Logo" className="w-9 h-9 bg-white p-1 rounded-full shadow border" />
          <div className="leading-tight">
            <div className="text-white text-sm font-bold">TOGETHER</div>
          </div>
        </div>
      </div>

      {/* Right: User Info & Logout */}
      {client && (
        <div className="flex flex-col items-end space-y-1 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <FiUser className="text-yellow-300" />
            <span>
              {client.fullName}, שלום
              {client.role === 'admin' && ' (מנהל)'}
              {client.role === 'client' && ' (לקוח)'}
            </span>
          </div>

          {/* Show session count only for clients */}
          {client.role === 'client' && (
            <div className="text-xs text-white/80">
              מפגשים: {client.usedSessions} מתוך {client.totalSessions}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
