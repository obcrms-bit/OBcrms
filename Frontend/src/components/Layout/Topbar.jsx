import React from 'react';
import { Search, MapPin, Grid, Bell, User, Menu } from 'lucide-react';

const Topbar = ({ toggleSidebar }) => {
    return (
        <header className="h-16 bg-[#1890ff] text-white flex items-center justify-between px-4 sticky top-0 z-40">
            <div className="flex items-center gap-4 w-1/3">
                <button onClick={toggleSidebar} className="md:hidden p-1 hover:bg-white/20 rounded">
                    <Menu size={20} />
                </button>
                <div className="hidden md:flex items-center bg-white/20 rounded px-3 py-1.5 w-full max-w-md">
                    <Search size={16} className="text-white/80" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-white placeholder:text-white/80 ml-2 w-full text-sm"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                    {/* Placeholder for custom action buttons seen in the mock (the blue and grey squares) */}
                    <div className="flex bg-[#0050b3] rounded overflow-hidden">
                        <button className="px-3 py-1.5 bg-[#1890ff] hover:bg-blue-400 text-white"><Search size={16} /></button>
                        <button className="px-3 py-1.5 bg-gray-500 hover:bg-gray-400 text-white"><Grid size={16} /></button>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-white/90">
                    <button className="hover:text-white"><MapPin size={18} /></button>
                    <button className="hover:text-white"><Grid size={18} /></button>
                    <button className="hover:text-white relative">
                        <Bell size={18} />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">8</span>
                    </button>
                    <button className="hover:text-white"><User size={18} /></button>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
