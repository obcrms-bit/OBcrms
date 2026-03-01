import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Menu, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="hidden md:flex bg-white shadow-sm px-6 py-4 items-center justify-between border-b border-gray-200">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-6">
        {/* Notifications */}
        <button className="text-gray-600 hover:text-gray-900 relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="flex items-center space-x-3 pl-6 border-l border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
