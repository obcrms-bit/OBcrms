import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Home, Users, BarChart3, LogOut, X } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems =
    user?.role?.toLowerCase() === 'admin'
      ? [
          { icon: Home, label: 'Dashboard', href: '/admin' },
          { icon: Users, label: 'Students', href: '/admin' },
          { icon: BarChart3, label: 'Analytics', href: '#analytics' },
        ]
      : [
          { icon: Home, label: 'Dashboard', href: '/counselor' },
          { icon: Users, label: 'My Students', href: '/counselor' },
        ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 text-white transform transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-primary-800">
          <div>
            <h1 className="text-xl font-bold">Trust CRM</h1>
            <p className="text-xs text-primary-300 mt-1">Education Management</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-8 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </a>
          ))}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-20 left-0 right-0 px-4">
          <div className="bg-primary-800 rounded-lg p-4">
            <p className="text-xs text-primary-300">Logged in as</p>
            <p className="text-sm font-semibold text-white mt-1">{user?.name}</p>
            <p className="text-xs text-primary-300 capitalize mt-1">{user?.role}</p>
          </div>
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-danger-500 hover:bg-danger-600 rounded-lg transition-colors font-medium text-sm"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
